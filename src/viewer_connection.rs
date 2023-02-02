use once_cell::sync::Lazy;
use std::{
    collections::HashMap,
    sync::atomic::{AtomicUsize, Ordering},
};

use futures::{SinkExt, StreamExt, TryFutureExt};
use tokio::sync::{
    mpsc::{self, UnboundedSender},
    RwLock,
};
use tokio_stream::wrappers::UnboundedReceiverStream;

use uuid::Uuid;
use warp::ws::{Message, WebSocket};

use crate::{
    events::{Viewer, WatchEvent, WatchEventData},
    utils::truncate_str,
    watch_session::{get_session, handle_watch_event_data},
};

static CONNECTED_VIEWERS: Lazy<RwLock<HashMap<usize, ConnectedViewer>>> =
    Lazy::new(|| RwLock::new(HashMap::new()));
static NEXT_VIEWER_ID: AtomicUsize = AtomicUsize::new(1);

pub struct ConnectedViewer {
    pub session: Uuid,
    pub viewer_id: usize,
    pub tx: UnboundedSender<WatchEvent>,
    pub nickname: Option<String>,
    pub colour: Option<String>,
}

pub async fn ws_subscribe(session_uuid: Uuid, nickname: String, colour: String, ws: WebSocket) {
    let viewer_id = NEXT_VIEWER_ID.fetch_add(1, Ordering::Relaxed);
    let (mut viewer_ws_tx, mut viewer_ws_rx) = ws.split();

    let (tx, rx) = mpsc::unbounded_channel::<WatchEvent>();
    let mut rx = UnboundedReceiverStream::new(rx);

    tokio::task::spawn(async move {
        while let Some(event) = rx.next().await {
            viewer_ws_tx
                .send(Message::text(
                    serde_json::to_string(&event).expect("couldn't convert WatchEvent into JSON"),
                ))
                .unwrap_or_else(|e| eprintln!("ws send error: {}", e))
                .await;
        }
    });

    let mut colour = colour;
    if colour.len() != 6 || !colour.chars().all(|x| x.is_ascii_hexdigit()) {
        colour = String::from("7ed0ff");
    }
    let nickname = truncate_str(&nickname, 50).to_string();

    CONNECTED_VIEWERS.write().await.insert(
        viewer_id,
        ConnectedViewer {
            viewer_id,
            session: session_uuid,
            tx,
            nickname: Some(nickname.clone()),
            colour: Some(colour.clone()),
        },
    );

    ws_publish(
        session_uuid,
        None,
        WatchEvent::new(nickname.clone(), colour.clone(), WatchEventData::UserJoin),
    )
    .await;

    update_viewer_list(session_uuid).await;

    while let Some(Ok(message)) = viewer_ws_rx.next().await {
        let event: WatchEventData = match message
            .to_str()
            .ok()
            .and_then(|s| serde_json::from_str(s).ok())
        {
            Some(e) => e,
            None => continue,
        };

        let session = &mut get_session(session_uuid).unwrap();

        // server side event modification where neccessary
        let event: WatchEventData = match event {
            WatchEventData::SetTime { from: _, to } => WatchEventData::SetTime {
                from: Some(session.get_time_ms()),
                to,
            },
            _ => event,
        };

        handle_watch_event_data(session_uuid, session, event.clone());

        ws_publish(
            session_uuid,
            Some(viewer_id),
            WatchEvent::new(nickname.clone(), colour.clone(), event),
        )
        .await;
    }

    ws_publish(
        session_uuid,
        None,
        WatchEvent::new(nickname.clone(), colour.clone(), WatchEventData::UserLeave),
    )
    .await;

    CONNECTED_VIEWERS.write().await.remove(&viewer_id);
    update_viewer_list(session_uuid).await;
}

pub async fn ws_publish(session_uuid: Uuid, skip_viewer_id: Option<usize>, event: WatchEvent) {
    for viewer in CONNECTED_VIEWERS.read().await.values() {
        if viewer.session != session_uuid {
            continue;
        }

        let _ = viewer.tx.send(WatchEvent {
            reflected: skip_viewer_id == Some(viewer.viewer_id),
            ..event.clone()
        });
    }
}

async fn update_viewer_list(session_uuid: Uuid) {
    let mut viewers = Vec::new();

    for viewer in CONNECTED_VIEWERS.read().await.values() {
        if viewer.session == session_uuid {
            viewers.push(Viewer {
                nickname: viewer.nickname.clone(),
                colour: viewer.colour.clone(),
            })
        }
    }

    ws_publish(
        session_uuid,
        None,
        WatchEvent::new(
            String::from("server"),
            String::from(""),
            WatchEventData::UpdateViewerList(viewers),
        ),
    )
    .await;
}
