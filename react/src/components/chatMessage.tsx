import { Emoji, WatchEvent } from "@/types";

interface ChatMessageProps {
  message: ChatMessage;
  emojis?: Emoji[];
}
export interface ChatMessage {
  user?: string;
  colour?: string;
  data: {
    op: WatchEvent["op"];
    data: string;
  };
}

export interface ChatMessageSection {
  dataType: "emoji" | "text";
  data: string;
}

// insert :emoji:s into the message
const ChatMessageData = ({
  data,
  emojis,
}: {
  data: string;
  emojis?: Emoji[];
}) => {
  let stuff: ChatMessageSection[] = [];
  if (emojis) {
    data.split(" ").forEach((word) => {
      if (word.startsWith(":") && word.endsWith(":")) {
        const emoji = word.slice(1, -1);
        const emojiUrl = emojis.find((e) => e.name === emoji)?.url;
        if (!emojiUrl) return;
        stuff.push({ dataType: "emoji", data: emojiUrl });
      } else {
        stuff.push({
          dataType: "text",
          data: (stuff.pop()?.data || "") + word + " ",
        });
      }
    });
  } else {
    stuff = data.split(" ").map((word) => ({
      dataType: "text",
      data: word,
    }));
  }
  return (
    <>
      {stuff.map((s, i) => {
        if (s.dataType === "emoji") {
          return (
            <img
              key={s.data}
              src={s.data}
              alt={s.data}
              className="w-6 h-6 inline"
            />
          );
        } else {
          return <span key={s.data}>{s.data}</span>;
        }
      })}
    </>
  );
};

const ChatMessage = ({ message, emojis }: ChatMessageProps) => {
  return (
    <>
      <span
        className="text-purple-400 font-medium"
        style={{
          color: "#" + message.colour || "#9333ea", // fallback to default purple if no color
        }}
      >
        {message.user && message.user + ": "}
      </span>
      <span
        className={`${message.user || "text-xs italic text-muted-foreground"}`}
      >
        <ChatMessageData data={message.data.data} emojis={emojis} />
      </span>
    </>
  );
};

export default ChatMessage;
