import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { WatchEvent, WatchEventData, WatchSessionView } from "../types";

interface WatchPartyContextType {
  sessionId: string;
  nickname: string;
  colour: string;
  socket: WebSocket | null;
  connected: boolean;
  roomInfo: WatchSessionView | null;
  sendMessage: (data: WatchEventData) => void;
  setPlaying: (playing: boolean, time: number) => void;
  setTime: (to: number, from?: number) => void;
}

const WatchPartyContext = createContext<WatchPartyContextType | null>(null);

interface WatchPartyProviderProps {
  sessionId: string;
  nickname: string;
  colour: string;
  children: ReactNode;
}

export function WatchPartyProvider({
  sessionId,
  nickname,
  colour,
  children,
}: WatchPartyProviderProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomInfo, setRoomInfo] = useState<WatchSessionView | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptRef = useRef(0);
  const maxReconnectAttempts = 5;
  const wsRef = useRef<WebSocket | null>(null);

  const createWebSocket = useCallback(() => {
    const isSecure = window.location.protocol === "https:";
    const wsUrl = new URL(
      `/sess/${sessionId}/subscribe?nickname=${encodeURIComponent(
        nickname,
      )}&colour=${encodeURIComponent(colour.startsWith("#") ? colour.replace("#", "") : colour)}`,
      import.meta.env.DEV ? `http://localhost:3000` : window.location.origin,
    );
    wsUrl.protocol = isSecure ? "wss:" : "ws:";
    console.log("WS URL:", wsUrl.toString());
    return new WebSocket(wsUrl.toString());
  }, [sessionId, nickname, colour]);

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectAttemptRef.current >= maxReconnectAttempts) {
      console.log("Max reconnection attempts reached");
      return;
    }

    const ws = createWebSocket();
    wsRef.current = ws;

    const handleOpen = () => {
      console.log("WS opened!");
      setConnected(true);
      reconnectAttemptRef.current = 0;
      setSocket(ws);
    };

    const handleClose = (event: CloseEvent) => {
      setConnected(false);
      console.log("WS closed!", event.code, event.reason);

      if (
        ws === wsRef.current &&
        reconnectAttemptRef.current < maxReconnectAttempts
      ) {
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttemptRef.current),
          10000,
        );
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptRef.current++;
          connect();
        }, delay);
      }
    };

    const handleError = (error: Event) => {
      console.error("WebSocket error:", error);
    };

    ws.addEventListener("open", handleOpen);
    ws.addEventListener("close", handleClose);
    ws.addEventListener("error", handleError);

    return () => {
      ws.removeEventListener("open", handleOpen);
      ws.removeEventListener("close", handleClose);
      ws.removeEventListener("error", handleError);
    };
  }, [createWebSocket]);

  useEffect(() => {
    if (sessionId) {
      fetch(`/sess/${sessionId}`)
        .then((j) => j.json())
        .then((res: WatchSessionView) => {
          setRoomInfo(res);
        });
    }
  }, [sessionId]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      cleanup?.();
      setSocket(null);
      setConnected(false);
    };
  }, [connect]);

  const sendMessage = useCallback(
    (data: WatchEventData) => {
      if (socket && connected) {
        socket.send(JSON.stringify(data));
      }
    },
    [socket, connected],
  );

  const setPlaying = useCallback(
    (playing: boolean, time: number) => {
      sendMessage({
        op: "SetPlaying",
        data: { playing, time },
      });
    },
    [sendMessage],
  );

  const setTime = useCallback(
    (to: number, from?: number) => {
      sendMessage({
        op: "SetTime",
        data: { to, from },
      });
    },
    [sendMessage],
  );

  return (
    <WatchPartyContext.Provider
      value={{
        sessionId,
        nickname,
        colour,
        socket,
        connected,
        sendMessage,
        setPlaying,
        setTime,
        roomInfo: roomInfo,
      }}
    >
      {children}
    </WatchPartyContext.Provider>
  );
}

export function useWatchPartyContext() {
  const context = useContext(WatchPartyContext);
  if (!context) {
    throw new Error(
      "useWatchPartyContext must be used within a WatchPartyProvider",
    );
  }
  return context;
}
