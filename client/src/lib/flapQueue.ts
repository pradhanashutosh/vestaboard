import { FLAP_SEQUENCE, flapDistance, flapIndexOf, isFlapChar } from "@vestaboard/shared";

export const MAX_VISUAL_STEPS = 10;

/**
 * Builds the sequence of intermediate characters a tile flips through to
 * get from `from` to `to`. If the raw physical distance around the flap
 * sequence exceeds MAX_VISUAL_STEPS, we sample evenly spaced steps along
 * the way so the animation still reads as "flipping through many chars"
 * without taking forever for e.g. A -> Z.
 */
export function computeFlapQueue(from: string, to: string): string[] {
  if (from === to) return [];
  if (!isFlapChar(from) || !isFlapChar(to)) return [to]; // emoji/other: simple crossfade

  const distance = flapDistance(from, to);
  if (distance === 0) return [to];

  const a = flapIndexOf(from);
  const len = FLAP_SEQUENCE.length;

  if (distance <= MAX_VISUAL_STEPS) {
    return Array.from(
      { length: distance },
      (_, i) => FLAP_SEQUENCE[(a + i + 1) % len],
    );
  }

  const steps: string[] = [];
  const sampleCount = MAX_VISUAL_STEPS - 1;
  for (let i = 1; i <= sampleCount; i++) {
    const frac = Math.round((distance * i) / (sampleCount + 1));
    steps.push(FLAP_SEQUENCE[(a + frac) % len]);
  }
  steps.push(to);
  return steps;
}
