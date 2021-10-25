use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
#[serde(tag = "op", content = "data")]
pub enum WatchEvent {
    SetPlaying {
        playing: bool,
        time: u64,
    },
    SetTime(u64),

    UserJoin(String),
    UserLeave(String),
    ChatMessage {
        #[serde(default = "String::new")]
        user: String,
        message: String,
    },
}
