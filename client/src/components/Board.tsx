import { useEffect, useRef } from "react";
import { flapDistance } from "@vestaboard/shared";
import FlapTile from "./FlapTile";
import { flapSoundEngine } from "../lib/sound";
import { MAX_VISUAL_STEPS } from "../lib/flapQueue";

interface BoardProps {
  grid: string[][];
  stepMs: number;
  soundEnabled: boolean;
}

export default function Board({ grid, stepMs, soundEnabled }: BoardProps) {
  const prevGridRef = useRef<string[][] | null>(null);
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  useEffect(() => {
    const prev = prevGridRef.current;
    prevGridRef.current = grid;
    if (!soundEnabled || !prev) return;

    const changes: { r: number; c: number; steps: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const from = prev[r]?.[c];
        const to = grid[r][c];
        if (from !== undefined && from !== to) {
          const steps = Math.min(flapDistance(from, to), MAX_VISUAL_STEPS) || 1;
          changes.push({ r, c, steps });
        }
      }
    }
    if (changes.length === 0) return;

    const concurrent = changes.length;
    for (const { r, c, steps } of changes) {
      // Slight wave/jitter so a full-board change doesn't sound like one
      // synchronized blast.
      const delay = (r * cols + c) * 0.0015 + Math.random() * 0.02;
      flapSoundEngine.playTileFlip(steps, delay, concurrent);
    }
  }, [grid, rows, cols, soundEnabled]);

  return (
    <div
      className="grid h-full w-full gap-[3px] rounded-xl bg-board-bg p-[3px]"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
    >
      {grid.map((row, r) =>
        row.map((char, c) => (
          <FlapTile key={`${r}-${c}`} char={char} stepMs={stepMs} />
        )),
      )}
    </div>
  );
}
