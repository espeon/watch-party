import { setupVideo } from "./video.mjs";
import { setupChat, handleChatEvent } from "./chat.mjs";

/**
 * @param {string} sessionId
 * @param {string} nickname
 * @returns {WebSocket}
 */
const createWebSocket = (sessionId, nickname) => {
  const wsUrl = new URL(
    `/sess/${sessionId}/subscribe` +
      `?nickname=${encodeURIComponent(nickname)}`,
    window.location.href
  );
  wsUrl.protocol = { "http:": "ws:", "https:": "wss:" }[wsUrl.protocol];
  const socket = new WebSocket(wsUrl.toString());

  return socket;
};

let outgoingDebounce = false;
let outgoingDebounceCallbackId = null;

const setDebounce = () => {
  outgoingDebounce = true;

  if (outgoingDebounceCallbackId) {
    cancelIdleCallback(outgoingDebounceCallbackId);
    outgoingDebounceCallbackId = null;
  }

  outgoingDebounceCallbackId = setTimeout(() => {
    outgoingDebounce = false;
  }, 500);
};

/**
 * @param {HTMLVideoElement} video
 * @param {WebSocket} socket
 */
const setupIncomingEvents = (video, socket) => {
  const setVideoTime = (time) => {
    const timeSecs = time / 1000.0;

    if (Math.abs(video.currentTime - timeSecs) > 0.5) {
      video.currentTime = timeSecs;
    }
  };

  socket.addEventListener("message", async (messageEvent) => {
    try {
      const event = JSON.parse(messageEvent.data);
      // console.log(event);

      switch (event.op) {
        case "SetPlaying":
          setDebounce();

          if (event.data.playing) {
            await video.play();
          } else {
            video.pause();
          }

          setVideoTime(event.data.time);

          break;
        case "SetTime":
          setDebounce();
          setVideoTime(event.data);
          break;
        case "UserJoin":
        case "UserLeave":
        case "ChatMessage":
          handleChatEvent(event);
          break;
      }
    } catch (_err) {}
  });
};

/**
 * @param {HTMLVideoElement} video
 * @param {WebSocket} socket
 */
const setupOutgoingEvents = (video, socket) => {
  const currentVideoTime = () => (video.currentTime * 1000) | 0;

  video.addEventListener("pause", async (event) => {
    if (outgoingDebounce) {
      return;
    }

    socket.send(
      JSON.stringify({
        op: "SetPlaying",
        data: {
          playing: false,
          time: currentVideoTime(),
        },
      })
    );
  });

  video.addEventListener("play", (event) => {
    if (outgoingDebounce) {
      return;
    }

    socket.send(
      JSON.stringify({
        op: "SetPlaying",
        data: {
          playing: true,
          time: currentVideoTime(),
        },
      })
    );
  });

  let firstSeekComplete = false;
  video.addEventListener("seeked", async (event) => {
    if (!firstSeekComplete) {
      // The first seeked event is performed by the browser when the video is loading
      firstSeekComplete = true;
      return;
    }

    if (outgoingDebounce) {
      return;
    }

    socket.send(
      JSON.stringify({
        op: "SetTime",
        data: currentVideoTime(),
      })
    );
  });
};

/**
 * @param {string} nickname
 * @param {string} sessionId
 */
export const joinSession = async (nickname, sessionId) => {
  try {
    window.location.hash = sessionId;

    const { video_url, subtitle_tracks, current_time_ms, is_playing } =
      await fetch(`/sess/${sessionId}`).then((r) => r.json());

    const socket = createWebSocket(sessionId, nickname);
    socket.addEventListener("open", async () => {
      const video = await setupVideo(
        video_url,
        subtitle_tracks,
        current_time_ms,
        is_playing
      );

      setupOutgoingEvents(video, socket);
      setupIncomingEvents(video, socket);
      setupChat(socket);
    });
    // TODO: Close listener ?
  } catch (err) {
    // TODO: Show an error on the screen
    console.error(err);
  }
};
