import type { ShopCustomer, SpiderSpecies } from "./spiders";

/**
 * Daily trend (I3, D11). One headline per game day on a fixed three-day
 * rotation. It only nudges which species some fresh walk-ins ask about.
 * It never touches prices, haggling, requests or the save: everything here
 * is derived from the day number, so a reload can't reroll it.
 */
export type TrendId = "arboreal" | "payday" | "ground";

export type DailyTrend = {
  id: TrendId;
  /** Short headline for the day. */
  title: string;
  /** One line in the shopkeeper's voice. */
  line: string;
};

export const TRENDS: readonly DailyTrend[] = [
  {
    id: "arboreal",
    title: "Climbers are in",
    line: "Word got around about tree dwellers. Some folks will come in asking for a spider that likes to climb.",
  },
  {
    id: "payday",
    title: "Payday collectors",
    line: "It's payday. A few collectors may drop by hoping for something a little less common.",
  },
  {
    id: "ground",
    title: "Ground dwellers' day",
    line: "Burrowers and ground dwellers are getting some love. Expect a few folks after a spider that stays down low.",
  },
];

/** Day 1 is arboreal, day 2 payday, day 3 ground, then it repeats. */
export function dailyTrend(day: number): DailyTrend {
  const d = Math.floor(Number.isFinite(day) ? day : 1);
  const i = (((d - 1) % TRENDS.length) + TRENDS.length) % TRENDS.length;
  return TRENDS[i]!;
}

/** Does this species fit the trend? Uses existing species fields only. */
export function fitsTrend(trend: TrendId, spec: Pick<SpiderSpecies, "life" | "rarity">): boolean {
  if (trend === "arboreal") return spec.life === "arboreal";
  if (trend === "ground") return spec.life === "terrestrial" || spec.life === "fossorial";
  return spec.rarity !== "common";
}

export function trendPool<T extends Pick<SpiderSpecies, "life" | "rarity">>(trend: TrendId, pool: readonly T[]): T[] {
  return pool.filter((s) => fitsTrend(trend, s));
}

/** Walk-in slots the trend may tilt: every other guest (0, 2, 4, …). */
export function isTiltedSlot(index: number): boolean {
  return index % 2 === 0;
}

/**
 * Tilt half of a fresh walk-in roll toward the trend. `base` is the normal
 * roll; `trendRoll` is the same roll drawn from the trend pool. Tilted slots
 * take only the species (and the offer the roll already priced for it);
 * name, id, keeper level, follow-up and browse/order kind stay as they were.
 * Untilted slots are returned untouched.
 */
export function tiltWalkIns(base: ShopCustomer[], trendRoll: ShopCustomer[]): ShopCustomer[] {
  return base.map((c, i) => {
    const t = trendRoll[i];
    if (!isTiltedSlot(i) || !t) return c;
    return { ...c, want: t.want, offer: t.offer };
  });
}
