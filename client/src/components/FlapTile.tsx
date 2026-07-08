import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { colorTileHex } from "@vestaboard/shared";
import { computeFlapQueue } from "../lib/flapQueue";

interface FlapTileProps {
  char: string;
  stepMs: number;
}

/**
 * A single split-flap tile. Flips through intermediate characters
 * (computed by computeFlapQueue) to land on `char`, one physical flap
 * per step. Each step is its own front/back card rotating -180deg on
 * the X axis so only the changed tile ever animates.
 */
export default function FlapTile({ char, stepMs }: FlapTileProps) {
  const [displayed, setDisplayed] = useState(char);
  const [flipTo, setFlipTo] = useState<string | null>(null);
  const queueRef = useRef<string[]>([]);

  useEffect(() => {
    if (char === displayed && flipTo === null) return;
    if (char === displayed) return;
    queueRef.current = computeFlapQueue(displayed, char);
    advance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char]);

  function advance() {
    const next = queueRef.current.shift();
    if (next === undefined) {
      setFlipTo(null);
      return;
    }
    setFlipTo(next);
  }

  function onFlipComplete() {
    if (flipTo === null) return;
    setDisplayed(flipTo);
    if (queueRef.current.length > 0) {
      advance();
    } else {
      setFlipTo(null);
    }
  }

  const isFlipping = flipTo !== null;

  return (
    <div className="relative h-full w-full select-none [perspective:400px]">
      {/* base tile: bottom half always shows the settled/incoming char */}
      <div className="absolute inset-0 rounded-[3px] bg-board-tile shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <TileHalf char={displayed} half="bottom" />
        <TileHalf char={displayed} half="top" />
      </div>

      {isFlipping && (
        <motion.div
          key={`${displayed}-${flipTo}`}
          className="absolute inset-x-0 top-0 h-1/2 origin-bottom [transform-style:preserve-3d]"
          initial={{ rotateX: 0 }}
          animate={{ rotateX: -180 }}
          transition={{ duration: stepMs / 1000, ease: "easeIn" }}
          onAnimationComplete={onFlipComplete}
        >
          <div className="absolute inset-0 [backface-visibility:hidden]">
            <TileHalf char={displayed} half="top" flap />
          </div>
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateX(180deg)]">
            <TileHalf char={flipTo!} half="top" flap flipped />
          </div>
        </motion.div>
      )}

      {/* center groove for the split-flap look */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-px bg-black/60" />
    </div>
  );
}

function TileHalf({
  char,
  half,
  flap = false,
  flipped = false,
}: {
  char: string;
  half: "top" | "bottom";
  flap?: boolean;
  flipped?: boolean;
}) {
  const color = colorTileHex(char);

  return (
    <div
      className={[
        "absolute inset-x-0 flex items-center justify-center overflow-hidden",
        color ? "" : "bg-board-tile",
        half === "top" ? "top-0 h-1/2 rounded-t-[3px]" : "bottom-0 h-1/2 rounded-b-[3px]",
        flap ? "shadow-[0_2px_4px_rgba(0,0,0,0.5)]" : "",
      ].join(" ")}
      style={color ? { backgroundColor: color } : undefined}
    >
      {!color && (
        <span
          className="font-board font-bold text-board-char"
          style={{
            fontSize: "clamp(0.9rem, 4vw, 2.6rem)",
            lineHeight: 1,
            transform: `translateY(${half === "top" ? "25%" : "-25%"}) ${
              flipped ? "rotateX(180deg)" : ""
            }`,
          }}
        >
          {char === " " ? " " : char}
        </span>
      )}
    </div>
  );
}
