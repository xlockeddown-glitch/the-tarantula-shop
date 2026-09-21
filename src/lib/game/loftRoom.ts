/** Stages are 16:9 stills. Masters in /public/game/masters/. */

export type CribSlot = { x: number; y: number; w: number; h: number };
export type Spot = { id: "door" | "sign" | "bench" | "truck" | "computer"; label: string; x: number; y: number; w: number; h: number };

/** Percent of the still (0–100). */
export type Hotspot = {
  id: string;
  label: string;
  kind: "tank" | "spot";
  tank?: number;
  spot?: Spot["id"];
  x: number;
  y: number;
  w: number;
  h: number;
};

export const LOFT_W = 480;
export const LOFT_H = 270;

export type LoftWing = {
  map: string;
  cribs: CribSlot[];
  spots: Spot[];
  walls: { x: number; y: number; w: number; h: number }[];
  staffX: number;
  hotspots: Hotspot[];
};

const SMALL_HOTSPOTS: Hotspot[] = [
  { id: "t0", label: "Window 1", kind: "tank", tank: 0, x: 7, y: 30, w: 22, h: 30 },
  { id: "t1", label: "Window 2", kind: "tank", tank: 1, x: 31, y: 30, w: 22, h: 30 },
  { id: "t2", label: "Window 3", kind: "tank", tank: 2, x: 54, y: 30, w: 20, h: 30 },
  { id: "sign", label: "Register", kind: "spot", spot: "sign", x: 36, y: 60, w: 22, h: 18 },
  { id: "bench", label: "Workbench", kind: "spot", spot: "bench", x: 6, y: 62, w: 16, h: 16 },
  { id: "computer", label: "Office", kind: "spot", spot: "computer", x: 22, y: 64, w: 14, h: 14 },
  { id: "door", label: "Street door", kind: "spot", spot: "door", x: 78, y: 48, w: 16, h: 32 },
  { id: "truck", label: "Receiving", kind: "spot", spot: "truck", x: 88, y: 70, w: 10, h: 16 },
];

const STARTER: LoftWing = {
  map: "/game/loft-walk-small.jpg",
  cribs: [
    { x: 108, y: 44, w: 72, h: 58 },
    { x: 188, y: 44, w: 72, h: 58 },
    { x: 268, y: 44, w: 72, h: 58 },
    { x: 40, y: 44, w: 56, h: 48 },
    { x: 340, y: 44, w: 56, h: 48 },
    { x: 70, y: 160, w: 48, h: 40 },
    { x: 360, y: 160, w: 48, h: 40 },
  ],
  spots: [
    { id: "door", label: "Street door", x: 208, y: 220, w: 64, h: 36 },
    { id: "sign", label: "Register", x: 48, y: 130, w: 72, h: 48 },
    { id: "bench", label: "Workbench", x: 20, y: 70, w: 56, h: 40 },
    { id: "truck", label: "Receiving", x: 400, y: 40, w: 48, h: 48 },
    { id: "computer", label: "Office desk", x: 360, y: 150, w: 96, h: 56 },
  ],
  walls: [
    { x: 0, y: 0, w: 480, h: 28 },
    { x: 0, y: 0, w: 8, h: 270 },
    { x: 472, y: 0, w: 8, h: 270 },
    { x: 0, y: 258, w: 480, h: 12 },
  ],
  staffX: 400,
  hotspots: SMALL_HOTSPOTS,
};

const WIDE: LoftWing = {
  ...STARTER,
  hotspots: [
    ...SMALL_HOTSPOTS,
    { id: "t3", label: "Window 4", kind: "tank", tank: 3, x: 72, y: 30, w: 12, h: 22 },
    { id: "t4", label: "Window 5", kind: "tank", tank: 4, x: 84, y: 30, w: 10, h: 22 },
  ],
};

export function roomFor(tier: number): LoftWing {
  return tier >= 1 ? WIDE : STARTER;
}

export const LOFT_MAP_SRC = STARTER.map;
export const LOFT_SPOTS = STARTER.spots;
export const LOFT_WALLS = STARTER.walls;
export const STAFF_X = STARTER.staffX;

export function cribCount(tier: number) {
  if (tier <= 0) return 4;
  if (tier === 1) return 5;
  return 7;
}

export function cribsForTier(tier: number): CribSlot[] {
  return roomFor(tier).cribs.slice(0, cribCount(tier));
}

export function nextCribUnlock(tier: number) {
  const now = cribCount(tier);
  const nxt = cribCount(tier + 1);
  if (nxt <= now) return null;
  return { from: now, to: nxt };
}
