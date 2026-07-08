// Order matters: this is the physical flap cycle order a real split-flap
// tile rotates through. Animating old -> new steps forward through this
// array (wrapping) so the motion looks mechanical instead of a random shuffle.
// Matches the official Vestaboard character codes (docs.vestaboard.com/docs/charactercodes)
// for letters/numbers/punctuation, plus the degree, heart, and filled-block glyphs.
export const FLAP_SEQUENCE: string[] = [
  " ",
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)), // A-Z
  ...Array.from({ length: 10 }, (_, i) => String(i)), // 0-9
  "!",
  "@",
  "#",
  "$",
  "(",
  ")",
  "-",
  "+",
  "&",
  "=",
  ";",
  ":",
  "'",
  '"',
  "%",
  ",",
  ".",
  "/",
  "?",
  "°",
  "❤",
  "■",
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
  // Non-flap chars (e.g. emoji, color tiles) render as-is with a simple
  // crossfade instead of a mechanical flap sequence.
  return ch;
}

// Real Vestaboards have 8 solid color tiles alongside letters. We encode
// them as single codepoints in the Private Use Area (U+E000-U+E007) so
// they flow through text/wrapping/grid layout exactly like any other
// character — Admin's color picker inserts these, FlapTile renders a
// swatch instead of a glyph when it sees one. Using explicit \u escapes
// (rather than the literal invisible glyphs) so this stays editable.
export const COLOR_TILES: Record<string, string> = {
  "\uE000": "#c0392b", // red
  "\uE001": "#d2691e", // orange
  "\uE002": "#e0b400", // yellow
  "\uE003": "#2e8b45", // green
  "\uE004": "#2a5db0", // blue
  "\uE005": "#7a3bb0", // violet
  "\uE006": "#f4f2ea", // white
  "\uE007": "#1a1a1c", // black
};

export const COLOR_TILE_LIST: { char: string; hex: string; label: string }[] = [
  { char: "\uE000", hex: COLOR_TILES["\uE000"], label: "Red" },
  { char: "\uE001", hex: COLOR_TILES["\uE001"], label: "Orange" },
  { char: "\uE002", hex: COLOR_TILES["\uE002"], label: "Yellow" },
  { char: "\uE003", hex: COLOR_TILES["\uE003"], label: "Green" },
  { char: "\uE004", hex: COLOR_TILES["\uE004"], label: "Blue" },
  { char: "\uE005", hex: COLOR_TILES["\uE005"], label: "Violet" },
  { char: "\uE006", hex: COLOR_TILES["\uE006"], label: "White" },
  { char: "\uE007", hex: COLOR_TILES["\uE007"], label: "Black" },
];

export function isColorTile(ch: string): boolean {
  return ch in COLOR_TILES;
}

export function colorTileHex(ch: string): string | undefined {
  return COLOR_TILES[ch];
}
