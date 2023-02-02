import { setupVideo } from "./video.mjs?v=bfdcf2";
import {
  setupChat,
  logEventToChat,
  updateViewerList,
  printChatMessage,
} from "./chat.mjs?v=bfdcf2";
import ReconnectingWebSocket from "./reconnecting-web-socket.mjs";
import { state } from "./state.mjs";
let player;
/**
 * @param {string} sessionId
 * @param {string} nickname
 * @returns {ReconnectingWebSocket}
 */
const createWebSocket = () => {
  const wsUrl = new URL(
    `/sess/${state().sessionId}/subscribe` +
      `?nickname=${encodeURIComponent(state().nickname)}` +
      `&colour=${encodeURIComponent(state().colour)}`,
    window.location.href
  );
  wsUrl.protocol = "ws" + window.location.protocol.slice(4);
  const socket = new ReconnectingWebSocket(wsUrl);

  return socket;
};

let outgoingDebounce = false;
let outgoingDebounceCallbackId = null;

export const setDebounce = () => {
  outgoingDebounce = true;

  if (outgoingDebounceCallbackId) {
    cancelIdleCallback(outgoingDebounceCallbackId);
    outgoingDebounceCallbackId = null;
  }

  outgoingDebounceCallbackId = setTimeout(() => {
    outgoingDebounce = false;
  }, 500);
};

export const setVideoTime = (time) => {
  const timeSecs = time / 1000.0;
  if (Math.abs(player.currentTime - timeSecs) > 0.5) {
    player.currentTime = timeSecs;
  }
};

export const setPlaying = async (playing) => {
  if (playing) {
    await player.play();
  } else {
    player.pause();
  }
};

/**
 * @param {HTMLVideoElement} video
 * @param {ReconnectingWebSocket} socket
 */
const setupIncomingEvents = (player, socket) => {
  socket.addEventListener("message", async (messageEvent) => {
    try {
      const event = JSON.parse(messageEvent.data);
      if (!event.reflected) {
        switch (event.op) {
          case "SetPlaying":
            setDebounce();

            if (event.data.playing) {
              await player.play();
            } else {
              player.pause();
            }

            setVideoTime(event.data.time);
            break;
          case "SetTime":
            setDebounce();
            setVideoTime(event.data);
            break;
          case "UpdateViewerList":
            updateViewerList(event.data);
            break;
        }
      }

      logEventToChat(event);
    } catch (_err) {}
  });
};

/**
 * @param {Plyr} player
 * @param {ReconnectingWebSocket} socket
 */
const setupOutgoingEvents = (player, socket) => {
  const currentVideoTime = () => (player.currentTime * 1000) | 0;

  player.on("pause", async () => {
    if (outgoingDebounce || player.elements.inputs.seek.disabled) {
      return;
    }

    // don't send a pause event for the video ending
    if (player.currentTime == player.duration) {
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

  player.on("play", () => {
    if (outgoingDebounce || player.elements.inputs.seek.disabled) {
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
  player.on("seeked", async (event) => {
    if (!firstSeekComplete) {
      // The first seeked event is performed by the browser when the video is loading
      firstSeekComplete = true;
      return;
    }

    if (outgoingDebounce || player.elements.inputs.seek.disabled) {
      return;
    }

    socket.send(
      JSON.stringify({
        op: "SetTime",
        data: {
          to: currentVideoTime(),
        },
      })
    );
  });
};

export const joinSession = async (created) => {
  if (state().activeSession) {
    if (state().activeSession === state().sessionId) {
      // we are already in this session, dont rejoin
      return;
    }
    // we are joining a new session from an existing session
    const messageContent = document.createElement("span");
    messageContent.appendChild(document.createTextNode("joining new session "));
    messageContent.appendChild(document.createTextNode(state().sessionId));

    printChatMessage("join-session", "watch-party", "#fffff", messageContent);
  }
  state().activeSession = state().sessionId;

  // try { // we are handling errors in the join form.
  const genericConnectionError = new Error(
    "There was an issue getting the session information."
  );
  window.location.hash = state().sessionId;
  let response, video_url, subtitle_tracks, current_time_ms, is_playing;
  try {
    response = await fetch(`/sess/${state().sessionId}`);
  } catch (e) {
    console.error(e);
    throw genericConnectionError;
  }
  if (!response.ok) {
    let error;
    try {
      ({ error } = await response.json());
      if (!error) throw new Error();
    } catch (e) {
      console.error(e);
      throw genericConnectionError;
    }
    throw new Error(error);
  }
  try {
    ({ video_url, subtitle_tracks, current_time_ms, is_playing } =
      await response.json());
  } catch (e) {
    console.error(e);
    throw genericConnectionError;
  }

  if (state().socket) {
    state().socket.close();
    state().socket = null;
  }
  const socket = createWebSocket();
  state().socket = socket;
  socket.addEventListener("open", async () => {
    player = await setupVideo(
      video_url,
      subtitle_tracks,
      current_time_ms,
      is_playing,
      created
    );

    player.on("canplay", () => {
      sync();
    });

    setupOutgoingEvents(player, socket);
    setupIncomingEvents(player, socket);
    setupChat(socket);
  });
  socket.addEventListener("reconnecting", (e) => {
    console.log("Reconnecting...");
  });
  socket.addEventListener("reconnected", (e) => {
    console.log("Reconnected.");
  });
  //} catch (e) {
  //  alert(e.message)
  //}
};

/**
 * @param {string} videoUrl
 * @param {Array} subtitleTracks
 */
export const createSession = async (videoUrl, subtitleTracks) => {
  const { id } = await fetch("/start_session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      video_url: videoUrl,
      subtitle_tracks: subtitleTracks,
    }),
  }).then((r) => r.json());

  window.location = `/?created=true#${id}`;
};

export const sync = async () => {
  setDebounce();
  await setPlaying(false);
  const { current_time_ms, is_playing } = await fetch(
    `/sess/${state().sessionId}`
  ).then((r) => r.json());

  setDebounce();
  setVideoTime(current_time_ms);
  if (is_playing) await setPlaying(is_playing);
};
