import ChatBox from "@/components/chatBox";
import { Player } from "@/components/player";
import { Loader } from "@/components/ui/loader";
import { useStoredState } from "@/context/syncStorage";
import { WatchPartyProvider } from "@/context/watchPartyContext";

export function Video() {
  // get colour and nickname from local storage
  const [nickname, setNickname] = useStoredState<string>("nickname", "");
  const [color, setColor] = useStoredState<string>("color", "#561ecb");

  // get query params, 'id'
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  // if no id, redirect to home
  if (!id) {
    window.location.href = "/";
  }

  // if invalid colour or nickname, redirect to home
  if (!color || !nickname) {
    window.location.href = "/";
  }

  return (
    <WatchPartyProvider sessionId={id} nickname={nickname} colour={color}>
      <div className="flex flex-col lg:flex-row max-h-screen h-screen max-w-screen w-screen overflow-y-hidden overflow-x-hidden">
        <div className="lg:max-h-screen lg:h-screen w-full lg:max-w-[calc(100vw-448px)] bg-black">
          <Player />
        </div>
        <div className="min-w-md flex-1">
          <ChatBox />
        </div>
      </div>
    </WatchPartyProvider>
  );
}
