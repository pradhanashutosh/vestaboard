import { useEffect, useState } from "react";
import { textToGrid } from "@vestaboard/shared";
import { useSocket } from "../hooks/useSocket";
import { useWakeLock } from "../hooks/useWakeLock";
import { useViewportSize } from "../hooks/useViewportSize";
import { flapSoundEngine } from "../lib/sound";
import Board from "../components/Board";

export default function Display() {
  const { status, board } = useSocket();
  const [unlocked, setUnlocked] = useState(false);
  const viewport = useViewportSize();
  useWakeLock();

  useEffect(() => {
    flapSoundEngine.setMuted(!board.soundOn);
  }, [board.soundOn]);

  useEffect(() => {
    flapSoundEngine.setVolume(board.volume);
  }, [board.volume]);

  const grid = textToGrid(board.text, board);

  // Contain-fit the board in the viewport (computed in JS, not CSS
  // aspect-ratio/min() — unsupported on some older TV webviews).
  const maxW = viewport.width * 0.98;
  const maxH = viewport.height * 0.96;
  const ratio = board.cols / board.rows;
  let boardWidth = maxW;
  let boardHeight = boardWidth / ratio;
  if (boardHeight > maxH) {
    boardHeight = maxH;
    boardWidth = boardHeight * ratio;
  }

  function handleUnlock() {
    // Best-effort: a TV webview missing Web Audio or a spec-noncompliant
    // Fullscreen API must never block the tap from actually unlocking the
    // display — each of these can throw synchronously on some TVs.
    try {
      flapSoundEngine.init();
    } catch {
      // sound just won't work on this device; the board still should
    }
    try {
      const result = document.documentElement.requestFullscreen?.();
      if (result && typeof result.catch === "function") {
        result.catch(() => {});
      }
    } catch {
      // fullscreen unsupported/denied — not fatal
    }
    setUnlocked(true);
  }

  return (
    <div className="tv-mode flex h-screen w-screen items-center justify-center bg-board-bg p-[2vmin]">
      {!unlocked && (
        <button
          onClick={handleUnlock}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-board-bg text-board-char"
        >
          <span className="text-3xl font-semibold tracking-tight">Vestaboard</span>
          <span className="rounded-full border border-board-char/40 px-6 py-2 text-sm">
            Tap to start
          </span>
        </button>
      )}

      <div style={{ width: boardWidth, height: boardHeight }}>
        <Board grid={grid} stepMs={board.flapStepMs} soundEnabled={unlocked} />
      </div>

      {status !== "connected" && (
        <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs text-board-char">
          <span
            className={`h-2 w-2 rounded-full ${status === "connecting" ? "bg-amber-500" : "bg-red-500"}`}
          />
          {status === "connecting" ? "Reconnecting…" : "Disconnected"}
        </div>
      )}
    </div>
  );
}
