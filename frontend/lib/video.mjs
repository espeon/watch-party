const loadVolume = () => {
  try {
    const savedVolume = localStorage.getItem("watch-party-volume");
    if (savedVolume != null && savedVolume != "") {
      return +savedVolume;
    }
  } catch (_err) {
    // Sometimes localStorage is blocked from use
  }
  // default
  return 0.5;
};

/**
 * @param {number} volume
 */
const saveVolume = (volume) => {
  try {
    localStorage.setItem("watch-party-volume", volume);
  } catch (_err) {
    // see loadVolume
  }
};

const loadCaptionTrack = () => {
  try {
    const savedTrack = localStorage.getItem("watch-party-captions");
    if (savedTrack != null && savedTrack != "") {
      return +savedTrack;
    }
  } catch (_err) {
    // Sometimes localStorage is blocked from use
  }
  // default
  return -1;
};

/**
 * @param {number} track
 */
const saveCaptionsTrack = (track) => {
  try {
    localStorage.setItem("watch-party-captions", track);
  } catch (_err) {
    // see loadCaptionsTrack
  }
};

/**
 * @param {string} videoUrl
 * @param {{name: string, url: string}[]} subtitles
 */
const createVideoElement = (videoUrl, subtitles) => {
  const video = document.createElement("video");
  video.controls = true;
  video.autoplay = false;
  video.volume = loadVolume();
  video.crossOrigin = "anonymous";

  video.addEventListener("volumechange", async () => {
    saveVolume(video.volume);
  });

  const source = document.createElement("source");
  source.src = videoUrl;

  video.appendChild(source);

  const storedTrack = loadCaptionTrack();
  let id = 0;
  for (const { name, url } of subtitles) {
    const track = document.createElement("track");
    track.label = name;
    track.src = url;
    track.kind = "captions";

    if (id == storedTrack) {
      track.default = true;
    }

    video.appendChild(track);
    id++;
  }

  video.textTracks.addEventListener("change", async () => {
    let id = 0;
    for (const track of video.textTracks) {
      if (track.mode != "disabled") {
        saveCaptionsTrack(id);
        return;
      }
      id++;
    }
    saveCaptionsTrack(-1);
  });

  // watch for attribute changes on the video object to detect hiding/showing of controls
  // as far as i can tell this is the least hacky solutions to get control visibility change events
  const observer = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName == "controls") {
        if (video.controls) {
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
        return;
      }
    }
  });
  observer.observe(video, { attributes: true });

  return video;
};

/**
 * @param {string} videoUrl
 * @param {{name: string, url: string}[]} subtitles
 * @param {number} currentTime
 * @param {boolean} playing
 */
export const setupVideo = async (videoUrl, subtitles, currentTime, playing) => {
  document.querySelector("#pre-join-controls").style["display"] = "none";
  const video = createVideoElement(videoUrl, subtitles);
  const videoContainer = document.querySelector("#video-container");
  videoContainer.style.display = "block";
  videoContainer.appendChild(video);

  video.currentTime = currentTime / 1000.0;

  try {
    if (playing) {
      await video.play();
    } else {
      video.pause();
    }
  } catch (err) {
    // Auto-play is probably disabled, we should uhhhhhhh do something about it
  }

  return video;
};
