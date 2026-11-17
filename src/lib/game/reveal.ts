import type { SpiderSex, SpiderStage } from "./spiders";

/** One card in the morning (or sac-pull) reveal deck. */
export type RevealCard =
  | {
      kind: "molt";
      id: string;
      speciesId: string;
      tag: string;
      name?: string;
      from: SpiderStage;
      to: SpiderStage;
      sex: SpiderSex;
      /** True when this molt is the one that shows the sex (sling → juvenile). */
      sexReveal: boolean;
      before: number;
      after: number;
    }
  | {
      kind: "sac";
      id: string;
      speciesId: string;
      eggs: number;
      progress: number;
      unlocked: boolean;
    }
  | { kind: "collapse"; id: string; speciesId: string }
  | { kind: "loss"; id: string; speciesId: string; tag: string }
  | { kind: "truck"; id: string; speciesId: string; n: number }
  | { kind: "held"; id: string; speciesId: string; tag: string; reason: "crib" | "setup" }
  | {
      kind: "summary";
      id: string;
      /** Art for the card: the first animal in premolt, else the first in the colony. Empty if none. */
      speciesId: string;
      sold: number;
      tookIn: number;
      rent: number;
      net: number;
      /** Common names of animals in premolt, at most 4. */
      premolt: string[];
      premoltMore: number;
      /** Profit still needed for the next species tier; null when all are open. */
      nextNeed: number | null;
      nextHint: string;
    }
  | { kind: "unlock"; id: string; speciesId: string; ids: string[] };

export type MorningSlip = { day: number; rent: number; cash: number; late: number };

/** Where the books stood at the start of a day. The morning summary compares against it. */
export type DayLedger = { profit: number; sales: number; cash: number };

/** Species ids opened by tiers crossed between two profit totals, in tier order. */
export function crossedUnlocks(
  tiers: readonly { profit: number; ids: string[] }[],
  before: number,
  after: number,
): string[] {
  if (after <= before) return [];
  return tiers.filter((t) => t.profit > before && t.profit <= after).flatMap((t) => t.ids);
}

/** Sex reveals first (they're the fun part), losses last. */
export function orderReveals(cards: RevealCard[]): RevealCard[] {
  const rank = (c: RevealCard) =>
    c.kind === "summary"
      ? -2
      : c.kind === "unlock"
        ? -1
        : c.kind === "sac"
      ? 0
      : c.kind === "molt"
        ? c.sexReveal
          ? c.sex === "f"
            ? 1
            : 2
          : 3
        : c.kind === "truck"
          ? 4
          : c.kind === "held"
            ? 5
            : 6;
  return [...cards].sort((a, b) => rank(a) - rank(b));
}
