use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
#[serde(tag = "op", content = "data")]
pub enum WatchEvent {
    SetPlaying { playing: bool, time: u64 },
    SetTime(u64),
}
