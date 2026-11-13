/**
 * One small goal at a time, shown under the header. Pure functions only (no
 * imports) so the tests run with `node --experimental-strip-types`.
 *
 * A goal measures a counter in the save against the value it had when the
 * goal was set, so progress can't be earned before the goal existed.
 */

export type GoalKind = "sell" | "push" | "handfeed" | "order" | "truck" | "window";

export type Goal = {
  id: string;
  kind: GoalKind;
  text: string;
  /** How many more of the counter are needed. */
  n: number;
  /** Counter value when the goal was set. */
  base: number;
  /** Last day it can be finished on. */
  dueDay: number;
  reward: { chips: number; feeders?: number };
  /** Order id for "order" goals. */
  ref?: string;
};

/** Everything goals need from the save, flattened. */
export type GoalSnapshot = {
  day: number;
  cash: number;
  feeders: number;
  sales: number;
  pushSales: number;
  handFeeds: number;
  ordersFilled: number;
  truckBuys: number;
  listed: number;
  windowCap: number;
  /** Non-personal animals that could go in the window. */
  sellable: number;
  /** Animals that would eat a cricket right now. */
  hungry: number;
  /** Open requests with nothing in stock to fill them. */
  openOrders: { id: string; text: string; dueDay: number }[];
};

export function counter(snap: GoalSnapshot, kind: GoalKind): number {
  switch (kind) {
    case "sell":
      return snap.sales;
    case "push":
      return snap.pushSales;
    case "handfeed":
      return snap.handFeeds;
    case "order":
      return snap.ordersFilled;
    case "truck":
      return snap.truckBuys;
    case "window":
      return snap.listed;
  }
}

export function progress(goal: Goal, snap: GoalSnapshot): number {
  if (goal.kind === "window") return Math.min(goal.n, snap.listed);
  return Math.max(0, Math.min(goal.n, counter(snap, goal.kind) - goal.base));
}

export function isDone(goal: Goal, snap: GoalSnapshot): boolean {
  return progress(goal, snap) >= goal.n;
}

export function isLapsed(goal: Goal, snap: GoalSnapshot): boolean {
  if (snap.day > goal.dueDay) return true;
  return (
    goal.kind === "order" &&
    !!goal.ref &&
    !snap.openOrders.some((o) => o.id === goal.ref) &&
    !isDone(goal, snap)
  );
}

function make(
  snap: GoalSnapshot,
  kind: GoalKind,
  seq: number,
  extra: Partial<Goal> = {},
): Goal | null {
  const id = `g${snap.day}-${seq}-${kind}`;
  const base = counter(snap, kind);
  switch (kind) {
    case "sell": {
      // Only what's in the window can sell today. First goal stays small.
      const n = Math.min(seq <= 1 ? 2 : 3, snap.listed);
      if (n < 1) return null;
      return {
        id,
        kind,
        base,
        n,
        dueDay: snap.day,
        text: n === 1 ? "Sell an animal today" : `Sell ${n} animals today`,
        reward: { chips: 6 * n },
      };
    }
    case "push":
      if (snap.listed < 1) return null;
      return {
        id,
        kind,
        base,
        n: 1,
        dueDay: snap.day + 1,
        text: "Push a price and still make the sale",
        reward: { chips: 12 },
      };
    case "handfeed":
      if (snap.hungry < 1 || snap.feeders < 1) return null;
      return {
        id,
        kind,
        base,
        n: 1,
        dueDay: snap.day,
        text: "Feed one by hand: tap the eye, drop a cricket",
        reward: { chips: 4, feeders: 4 },
      };
    case "truck":
      if (snap.cash < 30) return null;
      return {
        id,
        kind,
        base,
        n: 1,
        dueDay: snap.day + 1,
        text: "Buy new stock off the Truck",
        reward: { chips: 10 },
      };
    case "window": {
      const n = Math.min(snap.windowCap, snap.sellable);
      if (n < 1 || snap.listed >= n) return null;
      return {
        id,
        kind,
        base: 0,
        n,
        dueDay: snap.day,
        text:
          snap.listed === 0
            ? "Stock the window. Guests only buy what's in it"
            : `Fill the window (${n} cards)`,
        reward: { chips: 8 },
      };
    }
    case "order": {
      const o = snap.openOrders.find((x) => x.dueDay - snap.day >= 2 && x.id !== extra.ref);
      if (!o) return null;
      return {
        id,
        kind,
        base,
        n: 1,
        dueDay: o.dueDay,
        ref: o.id,
        text: o.text,
        reward: { chips: 15 },
      };
    }
  }
}

/** First goals teach the new systems in order; after that, goals follow what the shop needs. */
const INTRO: GoalKind[] = ["handfeed", "sell", "push", "order"];

/**
 * Pick the next goal.
 * - `done` is how many goals were finished so far (drives the intro order).
 * - `avoid` is the kind just finished or swapped away, so goals don't repeat back to back.
 */
export function pickGoal(snap: GoalSnapshot, done: number, avoid?: GoalKind): Goal | null {
  const seq = done;
  const tryKinds = (kinds: GoalKind[]) => {
    for (const k of kinds) {
      if (k === avoid) continue;
      const g = make(snap, k, seq);
      if (g && !isDone(g, snap)) return g;
    }
    return null;
  };
  // Nothing can sell from an empty window. Fix that before anything else.
  if (snap.listed === 0) {
    const g = tryKinds(["window"]) ?? tryKinds(["truck"]);
    if (g) return g;
  }
  if (done < INTRO.length) {
    const g = tryKinds(INTRO.slice(done));
    if (g) return g;
  }
  const needs: GoalKind[] = [];
  if (snap.sellable < 3) needs.push("truck");
  if (snap.openOrders.length) needs.push("order");
  if (snap.listed < Math.min(snap.windowCap, snap.sellable)) needs.push("window");
  const rotate: GoalKind[] =
    (snap.day + done) % 2 ? ["push", "sell", "handfeed"] : ["sell", "push", "handfeed"];
  return tryKinds([...needs, ...rotate, "truck"]);
}
