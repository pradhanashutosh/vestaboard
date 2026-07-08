import { HAlign, VAlign } from "./types.js";
import { sanitizeChar } from "./charset.js";

export type LayoutConfig = {
  rows: number;
  cols: number;
  hAlign: HAlign;
  vAlign: VAlign;
  wrap: boolean;
};

// Astral-plane emoji are surrogate pairs in JS strings — plain string
// indexing/slicing would split one glyph into two broken "characters".
// Array.from() iterates by codepoint instead, so every operation below
// works on codepoint arrays rather than raw UTF-16 units.
function chars(s: string): string[] {
  return Array.from(s);
}

function wrapLine(line: string, cols: number, wrap: boolean): string[][] {
  if (!wrap) return [chars(line).slice(0, cols)];
  const words = line.split(" ").filter((w) => w.length > 0);
  if (words.length === 0) return [[]];

  const lines: string[][] = [];
  let current: string[] = [];
  for (const word of words) {
    const wordChars = chars(word);
    // word itself longer than the board: hard-break it
    if (wordChars.length > cols) {
      if (current.length > 0) {
        lines.push(current);
        current = [];
      }
      for (let i = 0; i < wordChars.length; i += cols) {
        lines.push(wordChars.slice(i, i + cols));
      }
      continue;
    }
    const candidate = current.length > 0 ? [...current, " ", ...wordChars] : wordChars;
    if (candidate.length > cols) {
      lines.push(current);
      current = wordChars;
    } else {
      current = candidate;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

function alignLine(lineChars: string[], cols: number, align: HAlign): string[] {
  const trimmed = lineChars.slice(0, cols);
  const padTotal = Math.max(0, cols - trimmed.length);
  if (align === "left") return [...trimmed, ...Array(padTotal).fill(" ")];
  if (align === "right") return [...Array(padTotal).fill(" "), ...trimmed];
  const left = Math.floor(padTotal / 2);
  const right = padTotal - left;
  return [...Array(left).fill(" "), ...trimmed, ...Array(right).fill(" ")];
}

function positionRows(
  lines: string[][],
  rows: number,
  vAlign: VAlign,
): string[][] {
  const trimmed = lines.slice(0, rows);
  const blank = rows - trimmed.length;
  if (blank <= 0) return trimmed;
  if (vAlign === "top") return [...trimmed, ...Array(blank).fill([])];
  if (vAlign === "bottom") return [...Array(blank).fill([]), ...trimmed];
  const top = Math.floor(blank / 2);
  const bottom = blank - top;
  return [...Array(top).fill([]), ...trimmed, ...Array(bottom).fill([])];
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
  const aligned = positioned.map((lineChars) => alignLine(lineChars, cols, hAlign));

  return aligned.map((lineChars) =>
    Array.from({ length: cols }, (_, i) => sanitizeChar(lineChars[i] ?? " ")),
  );
}
