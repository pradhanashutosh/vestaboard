export type HAlign = "left" | "center" | "right";
export type VAlign = "top" | "middle" | "bottom";

export interface BoardSize {
  rows: number;
  cols: number;
}

export const BOARD_PRESETS: Record<string, BoardSize> = {
  "22x6": { rows: 6, cols: 22 },
  "22x8": { rows: 8, cols: 22 },
  "16x8": { rows: 8, cols: 16 },
  "40x8": { rows: 8, cols: 40 },
  "40x24": { rows: 24, cols: 40 },
};

export interface BoardConfig {
  rows: number;
  cols: number;
  hAlign: HAlign;
  vAlign: VAlign;
  wrap: boolean;
  autoCenter: boolean;
  /** ms per single flap step; lower = faster animation */
  flapStepMs: number;
  /** Controls the TV display's own sound engine (remote-controlled from admin). */
  soundOn: boolean;
  volume: number;
}

export interface BoardState extends BoardConfig {
  text: string;
  updatedAt: number;
}

export const DEFAULT_CONFIG: BoardConfig = {
  rows: 6,
  cols: 22,
  hAlign: "center",
  vAlign: "middle",
  wrap: true,
  autoCenter: true,
  flapStepMs: 45,
  soundOn: true,
  volume: 0.85,
};

export const DEFAULT_STATE: BoardState = {
  ...DEFAULT_CONFIG,
  text: "GOOD MORNING",
  updatedAt: Date.now(),
};

// Socket.IO event contracts (shared between server & client for type safety)
export interface ServerToClientEvents {
  "board:state": (state: BoardState) => void;
  "presence:count": (count: number) => void;
}

export interface ClientToServerEvents {
  "board:set": (partial: Partial<Omit<BoardState, "updatedAt">>) => void;
  "board:clear": () => void;
  "board:request": () => void;
}
