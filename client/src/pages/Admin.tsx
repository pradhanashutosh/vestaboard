import { useEffect, useState } from "react";
import {
  BOARD_PRESETS,
  HAlign,
  VAlign,
  textToGrid,
} from "@vestaboard/shared";
import { useSocket } from "../hooks/useSocket";
import Board from "../components/Board";

const MAX_CHARS = 2000;

export default function Admin() {
  const { status, board, setBoardPartial, clearBoard } = useSocket();

  const [text, setText] = useState(board.text);
  const [preset, setPreset] = useState("22x6");
  const [hAlign, setHAlign] = useState<HAlign>(board.hAlign);
  const [vAlign, setVAlign] = useState<VAlign>(board.vAlign);
  const [wrap, setWrap] = useState(board.wrap);
  const [flapStepMs, setFlapStepMs] = useState(board.flapStepMs);
  const [soundOn, setSoundOn] = useState(board.soundOn);
  const [volume, setVolume] = useState(board.volume);
  const [dark, setDark] = useState(true);
  const [synced, setSynced] = useState(false);

  // Sync local editor state from the server once, on first load, so we
  // reflect whatever's already on the board without clobbering it.
  useEffect(() => {
    if (synced) return;
    setText(board.text);
    setHAlign(board.hAlign);
    setVAlign(board.vAlign);
    setWrap(board.wrap);
    setFlapStepMs(board.flapStepMs);
    setSoundOn(board.soundOn);
    setVolume(board.volume);
    const match = Object.entries(BOARD_PRESETS).find(
      ([, s]) => s.rows === board.rows && s.cols === board.cols,
    );
    if (match) setPreset(match[0]);
    setSynced(true);
  }, [board, synced]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Sound/volume are TV display preferences, not part of "the message" —
  // push them live instead of waiting for Send.
  useEffect(() => {
    if (!synced) return;
    setBoardPartial({ soundOn });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundOn]);

  useEffect(() => {
    if (!synced) return;
    const t = setTimeout(() => setBoardPartial({ volume }), 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume]);

  const size = BOARD_PRESETS[preset];
  const previewGrid = textToGrid(text, {
    rows: size.rows,
    cols: size.cols,
    hAlign,
    vAlign,
    wrap,
  });

  function handleSend() {
    setBoardPartial({
      text,
      rows: size.rows,
      cols: size.cols,
      hAlign,
      vAlign,
      wrap,
      flapStepMs,
      autoCenter: true,
    });
  }

  function handleClear() {
    setText("");
    clearBoard();
  }

  const statusColor =
    status === "connected"
      ? "bg-emerald-500"
      : status === "connecting"
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 transition-colors dark:bg-board-bg dark:text-board-char">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 pb-24 sm:p-8">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Vestaboard</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
            <span className="capitalize text-gray-500 dark:text-gray-400">{status}</span>
            <button
              onClick={() => setDark((d) => !d)}
              className="ml-2 rounded-full border border-gray-300 px-3 py-1 text-xs dark:border-gray-700"
            >
              {dark ? "Light" : "Dark"}
            </button>
          </div>
        </header>

        <div className="overflow-hidden rounded-xl">
          {/* padding-top percentage trick instead of CSS aspect-ratio, so
              this also renders correctly on older TV webviews if Admin is
              ever opened there */}
          <div style={{ position: "relative", width: "100%", paddingTop: `${(size.rows / size.cols) * 100}%` }}>
            <div style={{ position: "absolute", inset: 0 }}>
              <Board grid={previewGrid} stepMs={flapStepMs} soundEnabled={false} />
            </div>
          </div>
        </div>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <label htmlFor="message">Message</label>
            <span>
              {text.length} / {MAX_CHARS}
            </span>
          </div>
          <textarea
            id="message"
            value={text}
            maxLength={MAX_CHARS}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="TYPE A MESSAGE..."
            className="w-full resize-none rounded-lg border border-gray-300 bg-white p-3 font-mono text-lg uppercase tracking-wide outline-none focus:border-gray-500 dark:border-gray-700 dark:bg-board-tile dark:text-board-char"
          />
          <div className="flex gap-3">
            <button
              onClick={handleSend}
              className="flex-1 rounded-lg bg-gray-900 py-3 font-medium text-white transition active:scale-[0.98] dark:bg-board-char dark:text-board-bg"
            >
              Send
            </button>
            <button
              onClick={handleClear}
              className="rounded-lg border border-gray-300 px-5 py-3 font-medium dark:border-gray-700"
            >
              Clear
            </button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Board size">
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="select"
            >
              {Object.keys(BOARD_PRESETS).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Horizontal align">
            <select value={hAlign} onChange={(e) => setHAlign(e.target.value as HAlign)} className="select">
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </Field>

          <Field label="Vertical align">
            <select value={vAlign} onChange={(e) => setVAlign(e.target.value as VAlign)} className="select">
              <option value="top">Top</option>
              <option value="middle">Middle</option>
              <option value="bottom">Bottom</option>
            </select>
          </Field>

          <Field label="Word wrap">
            <button
              onClick={() => setWrap((w) => !w)}
              className={`select text-left ${wrap ? "opacity-100" : "opacity-60"}`}
            >
              {wrap ? "On" : "Off"}
            </button>
          </Field>

          <Field label={`Animation speed (${flapStepMs}ms/step)`}>
            <input
              type="range"
              min={15}
              max={200}
              step={5}
              value={220 - flapStepMs}
              onChange={(e) => setFlapStepMs(220 - Number(e.target.value))}
              className="w-full"
            />
          </Field>

          <Field label="Sound">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundOn((s) => !s)}
                className={`select ${soundOn ? "opacity-100" : "opacity-60"}`}
              >
                {soundOn ? "On" : "Off"}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                disabled={!soundOn}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </Field>
        </section>

        <p className="text-center text-xs text-gray-400">
          Open <code>/display</code> on the TV's browser to show this board.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      {children}
    </label>
  );
}
