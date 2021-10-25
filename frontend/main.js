/**
 * @param {string} videoUrl
 * @param {{name: string, url: string}[]} subtitles
 */
const createVideoElement = (videoUrl, subtitles) => {
  document.querySelector("#pre-join-controls").style["display"] = "none";

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

      outgoingDebounce = true;

      switch (event.op) {
        case "SetPlaying":
          if (event.data.playing) {
            await video.play();
          } else {
            video.pause();
          }

          setVideoTime(event.data.time);

          break;
        case "SetTime":
          setVideoTime(event.data);

          break;
      }
    } catch (_err) {
    }

    if (outgoingDebounceCallbackId) {
      cancelIdleCallback(outgoingDebounceCallbackId);
      outgoingDebounceCallbackId = null;
    }

    outgoingDebounceCallbackId = setTimeout(() => {
      outgoingDebounce = false;
    }, 500);
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
  const video = createVideoElement(videoUrl, subtitles);
  document.body.appendChild(video);

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

/** @param {string} sessionId */
const joinSession = async (sessionId) => {
  try {
    window.location.hash = sessionId;

    const {
      video_url, subtitle_tracks,
      current_time_ms, is_playing
    } = await fetch(`/sess/${sessionId}`).then(r => r.json());

    const wsUrl = new URL(`/sess/${sessionId}/subscribe`, window.location.href);
    wsUrl.protocol = { "http:": "ws:", "https:": "wss:" }[wsUrl.protocol];
    const socket = new WebSocket(wsUrl.toString());

    setupVideo(sessionId, video_url, subtitle_tracks, current_time_ms, is_playing, socket);
  } catch (err) {
    // TODO: Show an error on the screen
    console.error(err);
  }
}

const main = () => {
  document.querySelector("#join-session-form").addEventListener("submit", event => {
    event.preventDefault();

    const sessionId = document.querySelector("#join-session-id").value;
    joinSession(sessionId);
  });

  if (window.location.hash.match(/#[0-9a-f\-]+/)) {
    document.querySelector("#join-session-id").value = window.location.hash.substring(1);
  }
};

if (document.readyState === "complete") {
  main();
} else {
  document.addEventListener("DOMContentLoaded", main);
}
