import Plyr from "./plyr-3.7.3.min.esm.js";

/**
 * @param {string} videoUrl
 * @param {{name: string, url: string}[]} subtitles
 */
const createVideoElement = (videoUrl, subtitles, created) => {
  const oldVideo = document.getElementById(".plyr");
  if (oldVideo) {
    oldVideo.remove();
  }
  const video = document.createElement("video");
  video.id = "video";
  video.crossOrigin = "anonymous";

  const source = document.createElement("source");
  source.src = videoUrl;

  video.appendChild(source);

  for (const { name, url } of subtitles) {
    const track = document.createElement("track");
    track.label = name;
    track.srclang = "xx-" + name.toLowerCase();
    track.src = url;
    track.kind = "captions";
    video.appendChild(track);
  }

  const videoContainer = document.querySelector("#video-container");
  videoContainer.style.display = "block";
  videoContainer.appendChild(video);

  const player = new Plyr(video, {
    clickToPlay: false,
    settings: ["captions", "quality"],
    autopause: false,
  });
  player.elements.controls.insertAdjacentHTML(
    "afterbegin",
    `<button type="button" aria-pressed="false" class="plyr__controls__item plyr__control lock-controls"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"></path></svg><span class="label--pressed plyr__sr-only">Unlock controls</span><span class="label--not-pressed plyr__sr-only">Lock controls</span></button>`
  );
  const lockButton = player.elements.controls.children[0];
  let controlsEnabled = created;
  const setControlsEnabled = (enabled) => {
    controlsEnabled = enabled;
    lockButton.setAttribute("aria-pressed", enabled);
    lockButton.classList.toggle("plyr__control--pressed", enabled);
    player.elements.buttons.play[0].disabled =
      player.elements.buttons.play[1].disabled =
      player.elements.inputs.seek.disabled =
        !enabled;
    if (!enabled) {
      // enable media button support
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("stop", null);
      navigator.mediaSession.setActionHandler("seekbackward", null);
      navigator.mediaSession.setActionHandler("seekforward", null);
      navigator.mediaSession.setActionHandler("seekto", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
    } else {
      // disable media button support by ignoring the events
      navigator.mediaSession.setActionHandler("play", () => {});
      navigator.mediaSession.setActionHandler("pause", () => {});
      navigator.mediaSession.setActionHandler("stop", () => {});
      navigator.mediaSession.setActionHandler("seekbackward", () => {});
      navigator.mediaSession.setActionHandler("seekforward", () => {});
      navigator.mediaSession.setActionHandler("seekto", () => {});
      navigator.mediaSession.setActionHandler("previoustrack", () => {});
      navigator.mediaSession.setActionHandler("nexttrack", () => {});
    }
  };
  setControlsEnabled(controlsEnabled);
  lockButton.addEventListener("click", () =>
    setControlsEnabled(!controlsEnabled)
  );
  window.__plyr = player;

  return player;
};

/**
 * @param {string} videoUrl
 * @param {{name: string, url: string}[]} subtitles
 * @param {number} currentTime
 * @param {boolean} playing
 */
export const setupVideo = async (
  videoUrl,
  subtitles,
  currentTime,
  playing,
  created
) => {
  document.querySelector("#pre-join-controls").style["display"] = "none";
  const player = createVideoElement(videoUrl, subtitles, created);
  player.currentTime = currentTime / 1000.0;

  try {
    if (playing) {
      player.play();
    } else {
      player.pause();
    }
  } catch (err) {
    // Auto-play is probably disabled, we should uhhhhhhh do something about it
  }

  return player;
};
