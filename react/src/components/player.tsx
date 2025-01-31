import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/plyr/theme.css";

import {
  LibASSTextRenderer,
  MediaPlayer,
  MediaPlayerInstance,
  MediaProvider,
  Track,
  useMediaRemote,
  useMediaStore,
} from "@vidstack/react";
import {
  PlyrLayout,
  plyrLayoutIcons,
} from "@vidstack/react/player/layouts/plyr";
import { useWatchParty } from "@/context/useWatchParty";
import { useCallback, useEffect, useRef } from "preact/hooks";
import fonts from "@/fonts";

export function Player() {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const remote = useMediaRemote(playerRef);

  // Remote action debounce
  const isRemoteAction = useRef(false);
  const remoteActionRef = useRef(null);
  const isSeeking = useRef(false);

  const activateDebounce = useCallback(() => {
    console.log("activate debounce");
    isRemoteAction.current = true;
    if (remoteActionRef.current) clearTimeout(remoteActionRef.current);
    remoteActionRef.current = setTimeout(() => {
      console.log("reset debounce");
      isRemoteAction.current = false;
      remoteActionRef.current = null;
    }, 1500);
  }, []);

  const { setTime, setPlaying, roomInfo } = useWatchParty({
    onMessage: (event) => {
      if (event.reflected) return;

      switch (event.op) {
        case "SetPlaying":
          requestAnimationFrame(() => {
            activateDebounce();
            remote.seek((event.data as any).time / 1000);
            if ((event.data as any).playing) {
              remote.play();
            } else {
              remote.pause();
            }
          });
          break;
        case "SetTime":
          activateDebounce();
          remote.seek((event.data as any).to / 1000);
          break;
      }
    },
  });

  useEffect(() => {
    const handleFirstClick = () => {
      playerRef.current?.startLoading();
      document.removeEventListener("click", handleFirstClick);
    };

    document.addEventListener("click", handleFirstClick);
    return () => document.removeEventListener("click", handleFirstClick);
  }, []);

  useEffect(() => {
    const renderer = new LibASSTextRenderer(() => import("jassub"), {
      blendMode: "wasm",
      workerUrl: "/jassub/jassub-worker.js",
      legacyWorkerUrl: "/jassub/jassub-worker-legacy.js",
      // https://github.com/ThaUnknown/jassub/issues/33
      offscreenRender: isMobileBrowser(),
      availableFonts: fonts,
    });

    console.log("renderer", renderer);

    playerRef.current!.textRenderers.add(renderer);
  }, []);

  useEffect(() => {
    if (roomInfo) {
      activateDebounce();
      console.log("is_playing", roomInfo.is_playing);
      if (roomInfo.is_playing) remote.play();
      remote.seek(roomInfo.current_time_ms / 1000);
    } else {
      console.log("roomInfo is null");
    }
    activateDebounce();
  }, [roomInfo]);

  const handleSeeking = useCallback(() => {
    isSeeking.current = true;
  }, []);

  const handleSeeked = useCallback(
    (s: any, ne: { type: any }) => {
      if (!isRemoteAction.current) {
        console.log(ne.type);
        // also ignore if <= |10s|
        setTime(Math.floor(playerRef.current?.currentTime * 1000));
        activateDebounce();
      }
      // Reset seeking flag after a short delay to ensure play/pause events are filtered
      setTimeout(() => {
        isSeeking.current = false;
      }, 100);
    },
    [setTime],
  );

  const handlePlay = useCallback(
    (p: any) => {
      if (!isRemoteAction.current || isSeeking.current) {
        setPlaying(true, Math.floor(playerRef.current?.currentTime * 1000));
        activateDebounce();
      }
    },
    [setPlaying],
  );

  const handlePause = useCallback(
    (p: any) => {
      if (!isRemoteAction.current || isSeeking.current) {
        setPlaying(false, Math.floor(playerRef.current?.currentTime * 1000));
        activateDebounce();
      }
    },
    [setPlaying],
  );

  return (
    <div className="max-h-screen h-full max-w-full w-screen">
      <MediaPlayer
        ref={playerRef}
        title="Sprite Fight"
        src={roomInfo?.video_url}
        crossOrigin={true}
        className="max-h-screen h-full"
        onSeeking={handleSeeking}
        onSeeked={handleSeeked}
        onPlay={handlePlay}
        onPause={handlePause}
        autoPlay={roomInfo?.is_playing}
        muted
      >
        <div className="flex flex-1 w-screen lg:w-auto">
          <MediaProvider
            className="*:max-h-screen w-screen"
            style={{ display: "block" }}
          >
            {roomInfo?.subtitle_tracks?.map((track) => (
              <Track key={track.url} kind="subtitles" src={track.url} default />
            ))}
          </MediaProvider>
        </div>
        <PlyrLayout icons={plyrLayoutIcons} />
      </MediaPlayer>
    </div>
  );
}

function isMobileBrowser() {
  let check = false;
  (function (a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
        a,
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        a.substr(0, 4),
      )
    )
      check = true;
  })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
}
