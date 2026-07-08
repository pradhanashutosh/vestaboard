import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  BoardState,
  ClientToServerEvents,
  DEFAULT_STATE,
  ServerToClientEvents,
} from "@vestaboard/shared";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket() {
  const socketRef = useRef<AppSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [board, setBoard] = useState<BoardState>(DEFAULT_STATE);

  useEffect(() => {
    // Same-origin: works whether hitting the Vite dev proxy or the
    // production build served directly from the Express server.
    const socket: AppSocket = io({
      // Default transport order (polling first, upgrade to websocket if it
      // works) — some TV browsers/networks block a raw WS handshake as the
      // very first request but are fine with plain HTTP polling.
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
    });
    socketRef.current = socket;

    socket.on("connect", () => setStatus("connected"));
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.io.on("reconnect_attempt", () => setStatus("connecting"));
    socket.on("board:state", (s) => setBoard(s));

    return () => {
      socket.disconnect();
    };
  }, []);

  const setBoardPartial = useCallback(
    (partial: Partial<Omit<BoardState, "updatedAt">>) => {
      socketRef.current?.emit("board:set", partial);
    },
    [],
  );

  const clearBoard = useCallback(() => {
    socketRef.current?.emit("board:clear");
  }, []);

  return { status, board, setBoardPartial, clearBoard };
}
