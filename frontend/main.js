/**
 * @param {string} videoUrl
 * @param {{name: string, url: string}[]} subtitles
 */
const createVideoElement = (videoUrl, subtitles) => {
  const video = document.createElement("video");
  video.controls = true;
  video.autoplay = false;

  const source = document.createElement("source");
  source.src = videoUrl;

  video.appendChild(source);

  let first = true;
  for (const { name, url } of subtitles) {
    const track = document.createElement("track");
    track.label = name;
    track.src = url;
    track.kind = "captions";

    if (first) {
      track.default = true;
      first = false;
    }

    video.appendChild(track);
  }

  return video;
}

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
}

const clearChat = () => {
  document.querySelector("#chatbox").innerHTML = "";
}

const printToChat = (elem) => {
  const chatbox = document.querySelector("#chatbox");
  chatbox.appendChild(elem);
  chatbox.scrollTop = chatbox.scrollHeight;
}

const handleChatEvent = (event) => {
  switch (event.op) {
    case "UserJoin": {
      // print something to the chat
      const chatMessage = document.createElement("div");
      chatMessage.classList.add("chat-message");
      chatMessage.classList.add("user-join");
      const userName = document.createElement("strong");
      userName.textContent = event.data;
      chatMessage.appendChild(userName);
      chatMessage.appendChild(document.createTextNode(" joined"));
      printToChat(chatMessage);

      break;
    }
    case "UserLeave": {
      const chatMessage = document.createElement("div");
      chatMessage.classList.add("chat-message");
      chatMessage.classList.add("user-leave");
      const userName = document.createElement("strong");
      userName.textContent = event.data;
      chatMessage.appendChild(userName);
      chatMessage.appendChild(document.createTextNode(" left"));
      printToChat(chatMessage);

      break;
    }
    case "ChatMessage": {
      const chatMessage = document.createElement("div");
      chatMessage.classList.add("chat-message");
      const userName = document.createElement("strong");
      userName.innerText = event.data.user;
      chatMessage.appendChild(userName);
      chatMessage.appendChild(document.createTextNode(" "));
      const messageContent = document.createElement("span");
      messageContent.classList.add("message-content");
      messageContent.textContent = event.data.message;
      chatMessage.appendChild(messageContent);
      printToChat(chatMessage);
      break;
    }
  }
}

/**
 * @param {WebSocket} socket
 * @param {HTMLVideoElement} video
 */
const setupSocketEvents = (socket, video) => {
  const setVideoTime = time => {
    const timeSecs = time / 1000.0;

    if (Math.abs(video.currentTime - timeSecs) > 0.5) {
      video.currentTime = timeSecs;
    }
  }

  socket.addEventListener("message", async messageEvent => {
    try {
      const event = JSON.parse(messageEvent.data);
      console.log(event);

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
    } catch (_err) {
    }
  });
}

/**
 * @param {string} sessionId
 * @param {HTMLVideoElement} video
 * @param {WebSocket} socket
 */
const setupVideoEvents = (sessionId, video, socket) => {
  const currentVideoTime = () => (video.currentTime * 1000) | 0;

  video.addEventListener("pause", async event => {
    if (outgoingDebounce) {
      return;
    }

    socket.send(JSON.stringify({
      "op": "SetPlaying",
      "data": {
        "playing": false,
        "time": currentVideoTime(),
      }
    }));
  });

  video.addEventListener("play", event => {
    if (outgoingDebounce) {
      return;
    }

    socket.send(JSON.stringify({
      "op": "SetPlaying",
      "data": {
        "playing": true,
        "time": currentVideoTime(),
      }
    }));
  });

  let firstSeekComplete = false;
  video.addEventListener("seeked", async event => {
    if (!firstSeekComplete) {
      // The first seeked event is performed by the browser when the video is loading
      firstSeekComplete = true;
      return;
    }

    if (outgoingDebounce) {
      return;
    }

    socket.send(JSON.stringify({
      "op": "SetTime",
      "data": currentVideoTime(),
    }));
  });
}

/** 
 * @param {string} videoUrl
 * @param {{name: string, url: string}[]} subtitles
 * @param {number} currentTime
 * @param {boolean} playing
 * @param {WebSocket} socket
 */
const setupVideo = async (sessionId, videoUrl, subtitles, currentTime, playing, socket) => {
  document.querySelector("#pre-join-controls").style["display"] = "none";
  const video = createVideoElement(videoUrl, subtitles);
  document.querySelector("#video-container").appendChild(video);

  video.currentTime = (currentTime / 1000.0);

  try {
    if (playing) {
      await video.play()
    } else {
      video.pause()
    }
  } catch (err) {
    // Auto-play is probably disabled, we should uhhhhhhh do something about it
  }

  setupSocketEvents(socket, video);
  setupVideoEvents(sessionId, video, socket);
}

const fixChatSize = () => {
  const video = document.querySelector("video");
  const chatbox = document.querySelector("#chatbox");
  const chatboxContainer = document.querySelector("#chatbox-container");

  if (video && chatbox && chatboxContainer) {
    const delta = chatboxContainer.clientHeight - chatbox.clientHeight;

    chatbox.style["height"] = `calc(${(window.innerHeight - video.clientHeight)}px - ${delta}px - 1em)`;
  }
};

const setupChatboxEvents = (socket) => {
  // clear events by just reconstructing the form
  const oldChatForm = document.querySelector("#chatbox-send");
  const chatForm = oldChatForm.cloneNode(true);
  oldChatForm.replaceWith(chatForm);

  chatForm.addEventListener("submit", e => {
    e.preventDefault();

    const input = chatForm.querySelector("input");
    const content = input.value;
    input.value = "";

    socket.send(JSON.stringify({
      "op": "ChatMessage",
      "data": {
        "message": content,
      }
    }));
  });
}

/**
 * @param {string} sessionId
 * @param {WebSocket} socket
 */
const setupChat = async (sessionId, socket) => {
  document.querySelector("#chatbox-container").style["display"] = "block";
  setupChatboxEvents(socket);
  fixChatSize();
}

/** 
 * @param {string} nickname
 * @param {string} sessionId
 */
const joinSession = async (nickname, sessionId) => {
  try {
    window.location.hash = sessionId;

    const {
      video_url, subtitle_tracks,
      current_time_ms, is_playing
    } = await fetch(`/sess/${sessionId}`).then(r => r.json());

    const wsUrl = new URL(`/sess/${sessionId}/subscribe?nickname=${encodeURIComponent(nickname)}`, window.location.href);
    wsUrl.protocol = { "http:": "ws:", "https:": "wss:" }[wsUrl.protocol];
    const socket = new WebSocket(wsUrl.toString());

    socket.addEventListener("open", () => {
      setupVideo(sessionId, video_url, subtitle_tracks, current_time_ms, is_playing, socket);
      setupChat(sessionId, socket);
    });
  } catch (err) {
    // TODO: Show an error on the screen
    console.error(err);
  }
}

const main = () => {
  document.querySelector("#join-session-nickname").value = localStorage.getItem("watch-party-nickname");

  document.querySelector("#join-session-form").addEventListener("submit", event => {
    event.preventDefault();

    const nickname = document.querySelector("#join-session-nickname").value;
    const sessionId = document.querySelector("#join-session-id").value;

    localStorage.setItem("watch-party-nickname", nickname);
    joinSession(nickname, sessionId);
  });

  if (window.location.hash.match(/#[0-9a-f\-]+/)) {
    document.querySelector("#join-session-id").value = window.location.hash.substring(1);
  }

  window.addEventListener("resize", event => {
    fixChatSize();
  });
};

if (document.readyState === "complete") {
  main();
} else {
  document.addEventListener("DOMContentLoaded", main);
}
