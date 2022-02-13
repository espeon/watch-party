use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::Mutex, time::Instant};
use uuid::Uuid;

use crate::events::WatchEventData;

#[derive(Serialize, Deserialize, Clone)]
pub struct SubtitleTrack {
    pub url: String,
    pub name: String,
}

#[derive(Clone)]
pub struct WatchSession {
    pub video_url: String,
    pub subtitle_tracks: Vec<SubtitleTrack>,

    is_playing: bool,
    playing_from_timestamp: u64,
    playing_from_instant: Instant,
}

#[derive(Serialize)]
pub struct WatchSessionView {
    pub video_url: String,
    pub subtitle_tracks: Vec<SubtitleTrack>,
    pub current_time_ms: u64,
    pub is_playing: bool,
}

impl WatchSession {
    pub fn new(video_url: String, subtitle_tracks: Vec<SubtitleTrack>) -> Self {
        WatchSession {
            video_url,
            subtitle_tracks,
            is_playing: false,
            playing_from_timestamp: 0,
            playing_from_instant: Instant::now(),
        }
    }

    pub fn view(&self) -> WatchSessionView {
        WatchSessionView {
            video_url: self.video_url.clone(),
            subtitle_tracks: self.subtitle_tracks.clone(),
            current_time_ms: self.get_time_ms() as u64,
            is_playing: self.is_playing,
        }
    }

    pub fn get_time_ms(&self) -> u64 {
        if !self.is_playing {
            return self.playing_from_timestamp;
        }

        self.playing_from_timestamp + self.playing_from_instant.elapsed().as_millis() as u64
    }

    pub fn set_time_ms(&mut self, time_ms: u64) {
        self.playing_from_timestamp = time_ms;
        self.playing_from_instant = Instant::now();
    }

    pub fn set_playing(&mut self, playing: bool, time_ms: u64) {
        self.set_time_ms(time_ms);
        self.is_playing = playing;
    }
}

pub static SESSIONS: Lazy<Mutex<HashMap<Uuid, WatchSession>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

pub fn get_session(uuid: Uuid) -> Option<WatchSession> {
    SESSIONS.lock().unwrap().get(&uuid).cloned()
}

pub fn handle_watch_event_data(
    uuid: Uuid,
    watch_session: &mut WatchSession,
    event: WatchEventData,
) {
    match event {
        WatchEventData::SetPlaying { playing, time } => {
            watch_session.set_playing(playing, time);
        }

        WatchEventData::SetTime { from: _, to } => {
            watch_session.set_time_ms(to);
        }

        _ => {}
    };

    let _ = SESSIONS.lock().unwrap().insert(uuid, watch_session.clone());
}
