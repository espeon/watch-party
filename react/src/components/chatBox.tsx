// src/components/ChatBox.tsx
import { useEffect, useRef, useState } from "react";
import Message, { ChatMessage } from "./chatMessage";
import { useWatchParty } from "@/context/useWatchParty";
import { Emoji, Viewer, WatchEvent } from "@/types";
import getJoinMessage from "@/lib/joinMsgs";
import ExpandableInput from "./expandableInput";

function processMojis(urls: string[]) {
  return urls.map((url) => ({
    name: url.split("/").pop()?.split(".")[0],
    url: "/emojis/" + url,
  }));
}

function ms2hms(ms: number) {
  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  seconds %= 60;
  minutes %= 60;
  return `${hours ? `${hours}h ` : ""}${
    minutes ? `${minutes}m ` : ""
  }${seconds}s`;
}

const ChatBox = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<Viewer[]>([]);
  const [emojis, setEmojis] = useState<Emoji[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchEmojis = async () => {
      try {
        const response = await fetch(`/emojos`);
        const data = await response.json();
        setEmojis(processMojis(data));
      } catch (error) {
        console.error("Failed to fetch emojis:", error);
      }
    };
    fetchEmojis();
  }, []);

  const setChatMessage = (
    event: WatchEvent,
    formattedData: string,
    showUser = true,
  ) => {
    const imsg: ChatMessage = {
      user: showUser ? event.user : "",
      colour: event.colour,
      data: {
        op: event.op,
        data: formattedData,
      },
    };
    setMessages((prevMessages) => [...prevMessages, imsg]);
  };

  const { connected, sendMessage } = useWatchParty({
    onMessage: (event) => {
      switch (event.op) {
        case "ChatMessage":
          setChatMessage(event, event.data.toString());
          break;
        case "SetPlaying":
          console.log(event);
          setChatMessage(
            event,
            `${event.user} ${event.data.playing ? "played" : "paused"} the video at ${ms2hms(event.data.time)}`,
            false,
          );
          break;
        case "SetTime":
          setChatMessage(
            event,
            `${event.user} set the time ${event.data.from && "from " + ms2hms(event.data.from)} to ${ms2hms(event.data.to)}`,
            false,
          );
          break;
        case "UpdateViewerList":
          setUsers(event.data as Viewer[]);
          break;
        case "Ping":
          // todo: actually ping the user and send a message!
          setChatMessage(event, `sent a Very Important Message: ${event.data}`);
          break;
        case "UserJoin":
          setChatMessage(event, getJoinMessage(event.user, "123"), false);
          break;
        case "UserLeave":
          setChatMessage(event, `left the party`);
          break;
      }
    },
  });

  const sendChatMessage = (message: string) => {
    sendMessage({
      op: "ChatMessage",
      data: message,
    });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  return (
    <div className="flex flex-col h-full w-full rounded-xl backdrop-blur-sm border border-white/10 p-4">
      <div className=" h-full max-h-full flex flex-col">
        <div className="fixed">
          <div className="flex flex-col items-start space-x-2 mb-4 bg-black/40 shadow-lg rounded-xl backdrop-blur-sm py-1 px-2">
            <h3 className="text-white font-semibold">Live Chat</h3>
            <div>
              With:{" "}
              {users.map((u, i) => (
                <>
                  <span style={{ color: u.colour }} key={u.nickname}>
                    {u.nickname}
                  </span>
                  {i != users.length - 1 && ", "}
                </>
              ))}
            </div>
          </div>
        </div>
        <div
          className="overflow-y-hidden hide-scrollbar h-min min-h-full max-h-full fixed pt-16 w-full"
          style={{
            maskImage: `linear-gradient(to bottom, transparent 0%, black 10%)`,
            maskComposite: "intersect",
          }}
          ref={scrollRef}
        >
          <div className="overflow-y-visible hide-scrollbar space-y-2 pb-8 px-1 mr-1">
            {messages.map((m, i) => (
              <div
                className="text-sm lg:text-base text-pretty break-words "
                key={m.user + m.data.data + i}
              >
                <Message message={m} emojis={emojis} />
              </div>
            ))}
          </div>
          <div className="h-16" />
        </div>
      </div>
      <ExpandableInput emojis={emojis} onSubmit={(e) => sendChatMessage(e)} />
    </div>
  );
};

export default ChatBox;
