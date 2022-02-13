use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
#[serde(tag = "op", content = "data")]
pub enum WatchEventData {
    SetPlaying {
        playing: bool,
        time: u64,
    },
    SetTime {
        #[serde(default, skip_serializing_if = "Option::is_none")]
        from: Option<u64>,
        to: u64,
    },

    UserJoin,
    UserLeave,
    ChatMessage(String),
    Ping(String),
}

#[derive(Clone, Serialize, Deserialize)]
pub struct WatchEvent {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub user: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub colour: Option<String>,
    #[serde(flatten)]
    pub data: WatchEventData,
    #[serde(default)]
    pub reflected: bool,
}

impl WatchEvent {
    pub fn new(user: String, colour: String, data: WatchEventData) -> Self {
        WatchEvent {
            user: Some(user),
            colour: Some(colour),
            data,
            reflected: false,
        }
    }
}
