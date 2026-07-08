import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import {
  BoardState,
  ClientToServerEvents,
  ServerToClientEvents,
  DEFAULT_STATE,
} from "@vestaboard/shared";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3001);

const app = express();
app.use(cors());
app.use(express.json());

// In production the client is built as static files and served here so the
// whole app is a single port (simpler for LAN access from a TV browser).
const clientDist = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDist));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// SPA fallback so a hard refresh on /display works in production.
app.get(/^(?!\/api|\/socket\.io).*/, (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(
  httpServer,
  { cors: { origin: "*" } },
);

let state: BoardState = { ...DEFAULT_STATE };

function clampInt(n: unknown, min: number, max: number, fallback: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, Math.round(v)));
}

io.on("connection", (socket) => {
  socket.emit("board:state", state);
  io.emit("presence:count", io.engine.clientsCount);

  socket.on("board:request", () => {
    socket.emit("board:state", state);
  });

  socket.on("board:set", (partial) => {
    const next: BoardState = {
      ...state,
      ...partial,
      rows: partial.rows !== undefined ? clampInt(partial.rows, 1, 30, state.rows) : state.rows,
      cols: partial.cols !== undefined ? clampInt(partial.cols, 1, 60, state.cols) : state.cols,
      flapStepMs:
        partial.flapStepMs !== undefined
          ? clampInt(partial.flapStepMs, 15, 300, state.flapStepMs)
          : state.flapStepMs,
      volume:
        partial.volume !== undefined
          ? Math.min(1, Math.max(0, Number(partial.volume)))
          : state.volume,
      text: typeof partial.text === "string" ? partial.text.slice(0, 2000) : state.text,
      updatedAt: Date.now(),
    };
    state = next;
    io.emit("board:state", state);
  });

  socket.on("board:clear", () => {
    state = { ...state, text: "", updatedAt: Date.now() };
    io.emit("board:state", state);
  });

  socket.on("disconnect", () => {
    io.emit("presence:count", io.engine.clientsCount);
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`[vestaboard] server listening on http://0.0.0.0:${PORT}`);
});
