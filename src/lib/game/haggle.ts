/**
 * Haggling at the counter. Pure functions only (no imports) so the tests can run
 * with `node --experimental-strip-types` and no path aliases.
 *
 * Every guest has a persona with a visible tell and a hidden budget, expressed as a
 * multiple of the animal's fair ask. Ask at or under budget and they buy. Ask a bit over
 * and they counter once with their real number. Ask way over and they walk.
 */

export type PersonaId = "bargain" | "first" | "collector" | "regular";

export type Persona = {
  id: PersonaId;
  label: string;
  /** Visible hint the player can learn to read. */
  tell: string;
  /** Opening offer as a multiple of fair. Always a sure sale. */
  open: number;
  /** Hidden budget as a multiple of fair (before jitter). */
  budget: number;
};

export const PERSONAS: Record<PersonaId, Persona> = {
  bargain: {
    id: "bargain",
    label: "Bargain hunter",
    tell: "Counts their bills twice.",
    open: 0.8,
    budget: 0.92,
  },
  first: {
    id: "first",
    label: "First-timer",
    tell: "Asking a lot of care questions.",
    open: 0.9,
    budget: 1.12,
  },
  collector: {
    id: "collector",
    label: "Collector",
    tell: "Already knows the Latin name.",
    open: 0.95,
    budget: 1.38,
  },
  regular: {
    id: "regular",
    label: "Regular",
    tell: "Back again. Remembers the shop.",
    open: 1,
    budget: 1.22,
  },
};

/** Push ask as a multiple of fair. */
export const PUSH_MULT = 1.3;
/** Over budget by more than this factor and the guest walks without a counter. */
export const INSULT_MULT = 1.3;

export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Pick a persona from a stable seed (the customer id), so a reload shows the same guest.
 * Returning guests are always regulars. A guest with high husbandry leans collector.
 */
export function personaFor(
  seedText: string,
  opts: { returning?: boolean; husbandry?: number } = {},
): PersonaId {
  if (opts.returning) return "regular";
  const h = hashSeed(seedText);
  const skilled = (opts.husbandry ?? 0) >= 7;
  const roll = h % 10;
  if (skilled) return roll < 6 ? "collector" : roll < 8 ? "first" : "bargain";
  return roll < 4 ? "bargain" : roll < 8 ? "first" : "collector";
}

/** Budget multiple with ±6% jitter from the seed. */
export function budgetMultFor(persona: PersonaId, seedText: string): number {
  const h = hashSeed(`${seedText}:budget`);
  const jitter = ((h % 1000) / 1000 - 0.5) * 0.12;
  return Math.round((PERSONAS[persona].budget + jitter) * 1000) / 1000;
}

export type AskLadder = { opener: number; fair: number; push: number };

export function askLadder(fair: number, persona: PersonaId): AskLadder {
  const f = Math.max(6, Math.round(fair));
  const opener = Math.max(6, Math.min(f, Math.round(f * PERSONAS[persona].open)));
  const push = Math.max(f + 1, Math.round(f * PUSH_MULT));
  return { opener, fair: f, push };
}

export type HaggleResult =
  | { outcome: "sold"; price: number }
  | { outcome: "counter"; counter: number }
  | { outcome: "walk"; reason: "insulted" | "final" };

/**
 * Judge an ask.
 * - `counter` is set when this guest already countered on this animal; they won't move again.
 */
export function judgeAsk(input: {
  ask: number;
  fair: number;
  persona: PersonaId;
  budgetMult: number;
  counter?: number | null;
}): HaggleResult {
  const { ask, fair, persona, budgetMult, counter } = input;
  const { opener } = askLadder(fair, persona);
  if (counter != null) {
    return ask <= counter ? { outcome: "sold", price: ask } : { outcome: "walk", reason: "final" };
  }
  if (ask <= opener) return { outcome: "sold", price: ask };
  const budget = Math.max(opener, Math.round(fair * budgetMult));
  if (ask <= budget) return { outcome: "sold", price: ask };
  if (ask > Math.ceil(budget * INSULT_MULT)) return { outcome: "walk", reason: "insulted" };
  return { outcome: "counter", counter: budget };
}
