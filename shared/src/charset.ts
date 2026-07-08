// Order matters: this is the physical flap cycle order a real split-flap
// tile rotates through. Animating old -> new steps forward through this
// array (wrapping) so the motion looks mechanical instead of a random shuffle.
export const FLAP_SEQUENCE: string[] = [
  " ",
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)), // A-Z
  ...Array.from({ length: 10 }, (_, i) => String(i)), // 0-9
  ".",
  ",",
  "!",
  "?",
  "'",
  '"',
  "-",
  "/",
  ":",
  ";",
  "(",
  ")",
  "@",
  "#",
  "&",
  "*",
  "+",
  "=",
];

const FLAP_INDEX: Record<string, number> = FLAP_SEQUENCE.reduce(
  (acc, ch, i) => {
    acc[ch] = i;
    return acc;
  },
  {} as Record<string, number>,
);

export function isFlapChar(ch: string): boolean {
  return ch in FLAP_INDEX;
}

export function flapIndexOf(ch: string): number {
  return FLAP_INDEX[ch] ?? 0;
}

// Number of forward steps (through the physical flap order) to go from
// `from` to `to`, wrapping around. Used to time & count flap sounds.
export function flapDistance(from: string, to: string): number {
  if (from === to) return 0;
  const a = isFlapChar(from) ? flapIndexOf(from) : 0;
  const b = isFlapChar(to) ? flapIndexOf(to) : 0;
  const len = FLAP_SEQUENCE.length;
  return ((b - a) % len + len) % len;
}

export function sanitizeChar(ch: string): string {
  const upper = ch.toUpperCase();
  if (isFlapChar(upper)) return upper;
  // Non-flap chars (e.g. emoji) render as-is with a simple crossfade
  // instead of a mechanical flap sequence.
  return ch;
}
