use serde_json::json;
use std::net::IpAddr;
use uuid::Uuid;

use warb::{hyper::StatusCode, Filter, Reply};
use warp as warb; // i think it's funny

mod events;
mod viewer_connection;
mod watch_session;

use serde::Deserialize;

use crate::{
    events::WatchEvent,
    viewer_connection::{ws_publish, ws_subscribe},
    watch_session::{get_session, handle_watch_event, SubtitleTrack, WatchSession, SESSIONS},
};

#[derive(Deserialize)]
struct StartSessionBody {
    video_url: String,
    #[serde(default = "Vec::new")]
    subtitle_tracks: Vec<SubtitleTrack>,
}

#[derive(Deserialize)]
struct SubscribeQuery {
    nickname: String,
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
                get_session(uuid)
                    .map(|sess| RequestedSession::Session(uuid, sess))
                    .unwrap_or_else(|| {
                        RequestedSession::Error(warb::reply::with_status(
                            warb::reply::json(&json!({ "error": "session does not exist" })),
                            StatusCode::NOT_FOUND,
                        ))
                    })
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
                let event = WatchEvent::SetPlaying {
                    playing,
                    time: sess.get_time_ms(),
                };

                handle_watch_event(uuid, &mut sess, event.clone());
                tokio::spawn(ws_publish(uuid, None, event));

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
                    let event = WatchEvent::SetTime(current_time_ms);

                    handle_watch_event(uuid, &mut sess, event.clone());
                    tokio::spawn(ws_publish(uuid, None, event));

                    warb::reply::with_status(warb::reply::json(&sess.view()), StatusCode::OK)
                }
                RequestedSession::Error(e) => e,
            },
        );

    let ws_subscribe_route = get_running_session
        .and(warb::path!("subscribe"))
        .and(warb::query())
        .and(warb::ws())
        .map(
            |requested_session, query: SubscribeQuery, ws: warb::ws::Ws| match requested_session {
                RequestedSession::Session(uuid, _) => ws
                    .on_upgrade(move |ws| ws_subscribe(uuid, query.nickname, ws))
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

    let ip = std::env::var("IP")
        .ok()
        .and_then(|s| s.parse::<IpAddr>().ok())
        .unwrap_or_else(|| [127, 0, 0, 1].into());
    let port = std::env::var("PORT")
        .ok()
        .and_then(|s| s.parse::<u16>().ok())
        .unwrap_or(3000);

    println!("Listening at http://{}:{} ...", &ip, &port);
    warb::serve(routes).run((ip, port)).await;
}
