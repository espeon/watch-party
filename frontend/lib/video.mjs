/**
 * @param {string} videoUrl
 * @param {{name: string, url: string}[]} subtitles
 */
const createVideoElement = (videoUrl, subtitles) => {
  const video = document.createElement("video");
  video.controls = true;
  video.autoplay = false;
  video.crossOrigin = "anonymous";

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
  document.querySelector("#video-container").appendChild(video);

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
