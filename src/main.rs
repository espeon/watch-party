use serde_json::json;
use std::net::IpAddr;
use uuid::Uuid;

use warb::{hyper::StatusCode, Filter, Reply};
use warp as warb; // i think it's funny

mod events;
mod utils;
mod viewer_connection;
mod watch_session;

use serde::Deserialize;

use crate::{
    viewer_connection::ws_subscribe,
    watch_session::{get_session, SubtitleTrack, WatchSession, SESSIONS},
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
    colour: String,
}

async fn get_emoji_list() -> Result<impl warb::Reply, warb::Rejection> {
    use tokio_stream::{wrappers::ReadDirStream, StreamExt};

    let dir = tokio::fs::read_dir("frontend/emojis")
        .await
        .expect("Couldn't read emojis directory!");

    let files = ReadDirStream::new(dir)
        .filter_map(|r| r.ok())
        .map(|e| e.file_name().to_string_lossy().to_string())
        .collect::<Vec<_>>()
        .await;

    Ok(warb::reply::json(&files))
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

    let get_emoji_route = warb::path!("emojos").and_then(get_emoji_list);

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

    let ws_subscribe_route = get_running_session
        .and(warb::path!("subscribe"))
        .and(warb::query())
        .and(warb::ws())
        .map(
            |requested_session, query: SubscribeQuery, ws: warb::ws::Ws| match requested_session {
                RequestedSession::Session(uuid, _) => ws
                    .on_upgrade(move |ws| ws_subscribe(uuid, query.nickname, query.colour, ws))
                    .into_response(),
                RequestedSession::Error(error_response) => error_response.into_response(),
            },
        );

    let frontend_path = std::env::var("FRONTEND_PATH").unwrap_or_else(|_| "react/dist".to_string());

    let routes = start_session_route
        .or(get_status_route)
        .or(ws_subscribe_route)
        .or(get_emoji_route)
        .or(warb::path::end().and(warb::fs::file(format!("{}/index.html", frontend_path))))
        .or(warb::fs::dir(frontend_path))
        .or(warb::fs::file("react/dist/index.html"));

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
