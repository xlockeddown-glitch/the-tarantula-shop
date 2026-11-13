import type { SpiderSex, SpiderStage } from "./spiders";

/** One card in the morning (or sac-pull) reveal deck. */
export type RevealCard =
  | {
      kind: "molt";
      id: string;
      speciesId: string;
      tag: string;
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
  | { kind: "held"; id: string; speciesId: string; tag: string; reason: "crib" | "setup" };

export type MorningSlip = { day: number; rent: number; cash: number; late: number };

/** Sex reveals first (they're the fun part), losses last. */
export function orderReveals(cards: RevealCard[]): RevealCard[] {
  const rank = (c: RevealCard) =>
    c.kind === "sac"
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
