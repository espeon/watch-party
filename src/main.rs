use std::{collections::HashMap, net::IpAddr, sync::Mutex};

use once_cell::sync::Lazy;
use serde_json::json;
use uuid::Uuid;

use warb::{hyper::StatusCode, Filter, Reply};
use warp as warb; // i think it's funny

mod events;
mod watch_session;

use serde::Deserialize;

use crate::{
    events::{ws_publish, ws_subscribe, WatchEvent},
    watch_session::{SubtitleTrack, WatchSession},
};

static SESSIONS: Lazy<Mutex<HashMap<Uuid, WatchSession>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

#[derive(Deserialize)]
struct StartSessionBody {
    pub video_url: String,
    #[serde(default = "Vec::new")]
    pub subtitle_tracks: Vec<SubtitleTrack>,
}

#[tokio::main]
async fn main() {
    let start_session_route = warb::path!("start_session")
        .and(warb::path::end())
        .and(warb::post())
        .and(warb::body::json())
        .map(|body: StartSessionBody| {
            let mut sessions = SESSIONS.lock().unwrap();
            let session_uuid = Uuid::new_v4();
            let session = WatchSession::new(body.video_url, body.subtitle_tracks);
            let session_view = session.view();
            sessions.insert(session_uuid, session);

            warb::reply::json(&json!({ "id": session_uuid.to_string(), "session": session_view }))
        });

    enum RequestedSession {
        Session(Uuid, WatchSession),
        Error(warb::reply::WithStatus<warb::reply::Json>),
    }

    let get_running_session = warb::path::path("sess")
        .and(warb::path::param::<String>())
        .map(|session_id: String| {
            if let Ok(uuid) = Uuid::parse_str(&session_id) {
                if let Some(session) = SESSIONS.lock().unwrap().get(&uuid) {
                    RequestedSession::Session(uuid, session.clone())
                } else {
                    RequestedSession::Error(warb::reply::with_status(
                        warb::reply::json(&json!({ "error": "session does not exist" })),
                        StatusCode::NOT_FOUND,
                    ))
                }
            } else {
                RequestedSession::Error(warb::reply::with_status(
                    warb::reply::json(&json!({ "error": "invalid session UUID" })),
                    StatusCode::BAD_REQUEST,
                ))
            }
        });

    let get_status_route = get_running_session
        .and(warb::path::end())
        .map(|requested_session| match requested_session {
            RequestedSession::Session(_, sess) => {
                warb::reply::with_status(warb::reply::json(&sess.view()), StatusCode::OK)
            }
            RequestedSession::Error(e) => e,
        });

    let set_playing_route = get_running_session
        .and(warb::path!("playing"))
        .and(warb::put())
        .and(warb::body::json())
        .map(|requested_session, playing: bool| match requested_session {
            RequestedSession::Session(uuid, mut sess) => {
                sess.set_playing(playing);
                let time = sess.get_time_ms();
                SESSIONS.lock().unwrap().insert(uuid, sess.clone());

                tokio::spawn(async move {
                    ws_publish(uuid, WatchEvent::SetPlaying { playing, time }).await
                });

                warb::reply::with_status(warb::reply::json(&sess.view()), StatusCode::OK)
            }
            RequestedSession::Error(e) => e,
        });

    let set_timestamp_route = get_running_session
        .and(warb::path!("current_time"))
        .and(warb::put())
        .and(warb::body::json())
        .map(
            |requested_session, current_time_ms: u64| match requested_session {
                RequestedSession::Session(uuid, mut sess) => {
                    sess.set_time_ms(current_time_ms);
                    SESSIONS.lock().unwrap().insert(uuid, sess.clone());

                    tokio::spawn(async move {
                        ws_publish(uuid, WatchEvent::SetTime(current_time_ms)).await
                    });

                    warb::reply::with_status(warb::reply::json(&sess.view()), StatusCode::OK)
                }
                RequestedSession::Error(e) => e,
            },
        );

    let ws_subscribe_route = get_running_session
        .and(warp::path!("subscribe"))
        .and(warp::ws())
        .map(
            |requested_session, ws: warb::ws::Ws| match requested_session {
                RequestedSession::Session(uuid, _) => ws
                    .on_upgrade(move |ws| ws_subscribe(uuid, ws))
                    .into_response(),
                RequestedSession::Error(error_response) => error_response.into_response(),
            },
        );

    let routes = start_session_route
        .or(get_status_route)
        .or(set_playing_route)
        .or(set_timestamp_route)
        .or(ws_subscribe_route)
        .or(warb::path::end().and(warb::fs::file("frontend/index.html")))
        .or(warb::fs::dir("frontend"));

    let host = std::env::var("HOST")
        .ok()
        .and_then(|s| s.parse::<IpAddr>().ok())
        .unwrap_or_else(|| [127, 0, 0, 1].into());
    let port = std::env::var("PORT")
        .ok()
        .and_then(|s| s.parse::<u16>().ok())
        .unwrap_or(3000);
    warb::serve(routes).run((host, port)).await;
}
