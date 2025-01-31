import { useEffect } from "react";
import { useWatchPartyContext } from "./watchPartyContext";
import { WatchEvent, WatchEventData } from "../types";

interface UseWatchPartyOptions {
  onMessage?: (event: WatchEvent) => void;
  onReconnecting?: () => void;
  onReconnected?: () => void;
}

export function useWatchParty({
  onMessage,
  onReconnecting,
  onReconnected,
}: UseWatchPartyOptions = {}) {
  const {
    socket,
    connected,
    sendMessage,
    setPlaying,
    setTime,
    sessionId,
    roomInfo,
  } = useWatchPartyContext();

  useEffect(() => {
    if (!socket || !onMessage) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as WatchEvent;
        onMessage(data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket, onMessage]);

  useEffect(() => {
    if (!socket || !onReconnecting) return;

    const handleClose = () => {
      onReconnecting();
    };

    socket.addEventListener("close", handleClose);
    return () => {
      socket.removeEventListener("close", handleClose);
    };
  }, [socket, onReconnecting]);

  useEffect(() => {
    if (!socket || !onReconnected) return;

    const handleOpen = () => {
      onReconnected();
    };

    socket.addEventListener("open", handleOpen);
    return () => {
      socket.removeEventListener("open", handleOpen);
    };
  }, [socket, onReconnected]);

  return {
    connected,
    sendMessage,
    setPlaying,
    setTime,
    sessionId,
    roomInfo,
  };
}
