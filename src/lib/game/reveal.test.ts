import test from "node:test";
import assert from "node:assert/strict";
import { crossedUnlocks, orderReveals, type RevealCard } from "./reveal.ts";

const tiers = [
  { profit: 0, ids: ["a"] },
  { profit: 70, ids: ["b", "c"] },
  { profit: 160, ids: ["d"] },
];

test("crossedUnlocks finds only tiers crossed today", () => {
  assert.deepEqual(crossedUnlocks(tiers, 0, 69), []);
  assert.deepEqual(crossedUnlocks(tiers, 69, 70), ["b", "c"]);
  assert.deepEqual(crossedUnlocks(tiers, 70, 200), ["d"]);
  assert.deepEqual(crossedUnlocks(tiers, 10, 500), ["b", "c", "d"]);
  assert.deepEqual(crossedUnlocks(tiers, 200, 150), []);
});

test("summary leads the deck, then unlock, then the rest", () => {
  const summary: RevealCard = {
    kind: "summary",
    id: "s",
    speciesId: "",
    sold: 0,
    tookIn: 0,
    rent: 0,
    net: 0,
    premolt: [],
    premoltMore: 0,
    nextNeed: null,
    nextHint: "",
  };
  const unlock: RevealCard = { kind: "unlock", id: "u", speciesId: "b", ids: ["b"] };
  const loss: RevealCard = { kind: "loss", id: "l", speciesId: "a", tag: "SP-1" };
  const sac: RevealCard = {
    kind: "sac",
    id: "k",
    speciesId: "a",
    eggs: 40,
    progress: 1,
    unlocked: false,
  };
  assert.deepEqual(
    orderReveals([loss, sac, unlock, summary]).map((c) => c.id),
    ["s", "u", "k", "l"],
  );
});
