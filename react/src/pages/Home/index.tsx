import { useStoredState } from "@/context/syncStorage";
import { PickColorButton } from "../../components/color-picker";
import { useState } from "preact/hooks";
import { useLocation } from "preact-iso";
import { SubtitleTrack, WatchSessionView } from "@/types";

export function Join() {
  const [nickname, setNickname] = useStoredState<string>("nickname", "");
  const [color, setColor] = useStoredState<string>("color", "#561ecb");

  const defaultSessId = () => {
    if (typeof window === "undefined") return "";
    return window.location.hash.substring(1);
  };
  const [sessionId, setSessionId] = useState(defaultSessId());

  const [isLoading, setIsLoading] = useState(false);

  const joinSession = async () => {
    // redirect to video?id=sessionId
    window.location.href = `/video?id=${sessionId}`;
  };
  return (
    <>
      <div class="flex items-center">
        <div class=" font-semibold text-4xl text-gray-700 dark:text-gray-200">
          <h2 class="leading-relaxed">Join a Room</h2>
        </div>
      </div>
      <div class="divide-y divide-gray-200">
        <div class="pb-8 pt-2 text-base space-y-4 text-gray-700 dark:text-gray-200 sm:text-lg sm:leading-7">
          <div class="flex flex-col">
            <label class="leading-loose">Nickname</label>
            <input
              type="text"
              class="px-4 py-2 border focus:ring-blue-500 focus:border-blue-500 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none"
              placeholder="Enter your nickname"
              onChange={(e) => setNickname(e.currentTarget.value)}
              value={nickname}
            />
          </div>

          <div class="flex flex-col">
            <label class="leading-loose">Choose Your Color</label>
            <div className="flex gap-2">
              <PickColorButton color={color} onChange={(e) => setColor(e)} />
              <div
                className="bg-foreground p-2 text-sm rounded"
                style={{ color: color }}
              >
                {nickname || "openai"}
              </div>
              <div
                className="bg-background p-2 text-sm rounded"
                style={{ color: color }}
              >
                {nickname || "closeai"}
              </div>
            </div>
          </div>

          <div class="flex flex-col">
            <label class="leading-loose">Room ID</label>
            <input
              type="text"
              class="px-4 py-2 border focus:ring-blue-500 focus:border-blue-500 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none"
              placeholder="Enter room ID"
              value={sessionId}
              onChange={(e) => setSessionId(e.currentTarget.value)}
            />
          </div>
        </div>
        <div class="pt-4 flex items-center space-x-4">
          <button
            onClick={() => joinSession()}
            class="w-full flex justify-center items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-md focus:outline-none"
          >
            Join Room
          </button>
        </div>
      </div>
    </>
  );
}

export interface CreateSessionResponse {
  id: string;
  session: WatchSessionView;
}

export function Create({ setCreate }: { setCreate: React.Dispatch<boolean> }) {
  const [url, setUrl] = useState("");
  const [subtitles, setSubtitles] = useState<SubtitleTrack>({
    url: "",
    name: "",
  });

  const createRoom = () => {
    if (url == "") {
      alert("Please enter a video url!");
      return;
    }
    fetch("/start_session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_url: url,
        subtitle_tracks: url == "" ? [] : [subtitles],
      }),
    })
      .then((j) => j.json())
      .then((res: CreateSessionResponse) => {
        // put id on # on url
        window.location.hash = res.id;
        // wait 500ms, setCreate to false
        setTimeout(() => {
          setCreate(false);
        }, 500);
      });
  };
  return (
    <>
      <div class="flex items-center">
        <div class="font-semibold text-4xl text-gray-700 dark:text-gray-200">
          <h2 class="leading-relaxed">Create a Room</h2>
        </div>
      </div>
      <div class="divide-y divide-gray-200">
        <div class="py-2 text-base space-y-4 text-gray-700 dark:text-gray-200 sm:text-lg sm:leading-7">
          <div class="flex flex-col">
            <label class="leading-loose">Video URL</label>
            <input
              type="text"
              class="px-4 py-2 border focus:ring-blue-500 focus:border-blue-500 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none"
              placeholder="https://cdn.bunnygi.rl/manifest.m3u8 (or .mp4)"
              onChange={(e) => setUrl(e.currentTarget.value)}
              value={url}
            />
          </div>
          <div class="flex flex-col">
            <label class="leading-loose">Subtitle URL</label>
            <input
              type="text"
              class="px-4 py-2 border focus:ring-blue-500 focus:border-blue-500 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none"
              placeholder="https://cdn.bunnygi.rl/en.vtt (or .ass)"
              onChange={(e) =>
                setSubtitles({ ...subtitles, url: e.currentTarget.value })
              }
              value={subtitles.url}
            />
          </div>
          <div class="flex flex-col">
            <label class="leading-loose">Subtitle Language</label>
            <input
              type="text"
              class="px-4 py-2 border focus:ring-blue-500 focus:border-blue-500 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none"
              placeholder="en"
              onChange={(e) =>
                setSubtitles({ ...subtitles, name: e.currentTarget.value })
              }
              value={subtitles.name}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Make sure your urls are hosted where everyone can access it! <br />{" "}
            Also, don't forget CORS!
          </div>
        </div>
        <div class="flex items-center pt-4">
          <button
            onClick={() => createRoom()}
            class="w-full flex justify-center items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-md focus:outline-none"
          >
            Create Room
          </button>
        </div>
      </div>
    </>
  );
}

export function Home() {
  const [create, setCreate] = useState(false);
  return (
    <div class="container mx-auto flex items-center justify-center h-full">
      <div class="relative bg-card mx-8 md:mx-0 shadow rounded-3xl border border-slate-500/20 sm:p-10 max-w-md min-w-sm w-screen">
        <div class="mx-auto">
          {create ? <Create setCreate={setCreate} /> : <Join />}
          <div className="mt-2">
            or...{" "}
            <span onClick={() => setCreate(!create)} className="text-blue-500">
              {create ? "Join an existing room!" : "Create a new room!"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
