import { HAlign, VAlign } from "./types.js";

export type LayoutConfig = {
  rows: number;
  cols: number;
  hAlign: HAlign;
  vAlign: VAlign;
  wrap: boolean;
};
import { sanitizeChar } from "./charset.js";

function wrapLine(line: string, cols: number, wrap: boolean): string[] {
  if (!wrap) return [line.slice(0, cols)];
  const words = line.split(" ").filter((w) => w.length > 0);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    // word itself longer than the board: hard-break it
    if (word.length > cols) {
      if (current) {
        lines.push(current);
        current = "";
      }
      for (let i = 0; i < word.length; i += cols) {
        lines.push(word.slice(i, i + cols));
      }
      continue;
    }
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > cols) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function alignLine(line: string, cols: number, align: HAlign): string {
  const padTotal = Math.max(0, cols - line.length);
  if (align === "left") return (line + " ".repeat(padTotal)).slice(0, cols);
  if (align === "right")
    return (" ".repeat(padTotal) + line).slice(-cols).padStart(cols);
  const left = Math.floor(padTotal / 2);
  const right = padTotal - left;
  return (" ".repeat(left) + line + " ".repeat(right)).slice(0, cols);
}

function positionRows(
  lines: string[],
  rows: number,
  vAlign: VAlign,
): string[] {
  const trimmed = lines.slice(0, rows);
  const blank = rows - trimmed.length;
  if (blank <= 0) return trimmed;
  if (vAlign === "top") return [...trimmed, ...Array(blank).fill("")];
  if (vAlign === "bottom") return [...Array(blank).fill(""), ...trimmed];
  const top = Math.floor(blank / 2);
  const bottom = blank - top;
  return [...Array(top).fill(""), ...trimmed, ...Array(bottom).fill("")];
}

/**
 * Converts raw text into a rows x cols grid of single characters,
 * applying word-wrap and horizontal/vertical alignment.
 */
export function textToGrid(text: string, config: LayoutConfig): string[][] {
  const { rows, cols, hAlign, vAlign, wrap } = config;
  const rawLines = text.toUpperCase().split("\n");
  const wrapped = rawLines.flatMap((line) => wrapLine(line, cols, wrap));
  const positioned = positionRows(wrapped, rows, vAlign);
  const aligned = positioned.map((line) => alignLine(line, cols, hAlign));

  return aligned.map((line) =>
    Array.from({ length: cols }, (_, i) => sanitizeChar(line[i] ?? " ")),
  );
}
