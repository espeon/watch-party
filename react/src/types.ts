export interface Viewer {
  nickname?: string;
  colour?: string;
}

type WatchEventDataMap = {
  SetPlaying: { playing: boolean; time: number };
  SetTime: { from?: number; to: number };
  UserJoin: null;
  UserLeave: null;
  ChatMessage: string;
  Ping: string;
  UpdateViewerList: Viewer[];
};

export type WatchEventData = {
  [K in keyof WatchEventDataMap]: { op: K; data: WatchEventDataMap[K] };
}[keyof WatchEventDataMap];

export interface WatchEvent {
  user?: string;
  colour?: string;
  op: WatchEventData["op"];
  data: WatchEventData["data"];
  reflected: boolean;
}

export interface ChatMessage {
  user?: string;
  colour?: string;
  data: {
    op: "ChatMessage";
    data: string;
  };
  reflected: boolean;
}

export interface Emoji {
  name: string;
  url: string;
}

export interface SubtitleTrack {
  url: string;
  name: string;
}

export interface WatchSessionView {
  video_url: string;
  is_playing?: boolean;
  subtitle_tracks?: SubtitleTrack[];
  current_time_ms?: number;
}
