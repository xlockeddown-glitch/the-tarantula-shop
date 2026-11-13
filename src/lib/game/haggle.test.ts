import { test } from "node:test";
import assert from "node:assert/strict";
import {
  askLadder,
  budgetMultFor,
  judgeAsk,
  personaFor,
  PERSONAS,
  type PersonaId,
} from "./haggle.ts";

const IDS = Object.keys(PERSONAS) as PersonaId[];

test("opener always sells", () => {
  for (const p of IDS) {
    for (const fair of [6, 14, 40, 120]) {
      const { opener } = askLadder(fair, p);
      const r = judgeAsk({ ask: opener, fair, persona: p, budgetMult: 0.5 });
      assert.equal(r.outcome, "sold");
    }
  }
});

test("ladder is ordered opener <= fair < push", () => {
  for (const p of IDS) {
    for (const fair of [6, 9, 40, 200]) {
      const l = askLadder(fair, p);
      assert.ok(l.opener <= l.fair && l.fair < l.push, `${p} ${fair} ${JSON.stringify(l)}`);
    }
  }
});

test("persona tells are readable: push outcome per persona at base budget", () => {
  const fair = 50;
  const push = askLadder(fair, "bargain").push;
  assert.equal(
    judgeAsk({ ask: push, fair, persona: "bargain", budgetMult: PERSONAS.bargain.budget }).outcome,
    "walk",
  );
  assert.equal(
    judgeAsk({ ask: push, fair, persona: "first", budgetMult: PERSONAS.first.budget }).outcome,
    "counter",
  );
  assert.equal(
    judgeAsk({ ask: push, fair, persona: "regular", budgetMult: PERSONAS.regular.budget }).outcome,
    "counter",
  );
  assert.equal(
    judgeAsk({ ask: push, fair, persona: "collector", budgetMult: PERSONAS.collector.budget })
      .outcome,
    "sold",
  );
});

test("counter is final: at or under sells, over walks", () => {
  assert.deepEqual(judgeAsk({ ask: 30, fair: 30, persona: "first", budgetMult: 1, counter: 32 }), {
    outcome: "sold",
    price: 30,
  });
  assert.deepEqual(judgeAsk({ ask: 33, fair: 30, persona: "first", budgetMult: 2, counter: 32 }), {
    outcome: "walk",
    reason: "final",
  });
});

test("counter offer is never below the opener", () => {
  const r = judgeAsk({ ask: 20, fair: 20, persona: "bargain", budgetMult: 0.5 });
  if (r.outcome === "counter") assert.ok(r.counter >= askLadder(20, "bargain").opener);
});

test("persona and budget are stable per seed; returning is regular", () => {
  assert.equal(personaFor("c12-1"), personaFor("c12-1"));
  assert.equal(budgetMultFor("first", "x"), budgetMultFor("first", "x"));
  assert.equal(personaFor("anything", { returning: true }), "regular");
  for (let i = 0; i < 200; i++) {
    const m = budgetMultFor("collector", `s${i}`);
    assert.ok(m >= PERSONAS.collector.budget - 0.061 && m <= PERSONAS.collector.budget + 0.061);
  }
});

test("all personas appear across seeds", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 300; i++) seen.add(personaFor(`c${i}-${i % 5}`, { husbandry: i % 9 }));
  for (const p of ["bargain", "first", "collector"]) assert.ok(seen.has(p), p);
});

test("first-timers and regulars never walk on Push; they counter or buy", () => {
  for (const p of ["first", "regular"] as const) {
    for (let i = 0; i < 300; i++) {
      for (const fair of [6, 11, 15, 24, 48, 130]) {
        const mult = budgetMultFor(p, `g${i}`);
        const r = judgeAsk({ ask: askLadder(fair, p).push, fair, persona: p, budgetMult: mult });
        assert.notEqual(r.outcome, "walk", `${p} fair=${fair} mult=${mult}`);
      }
    }
  }
});

test("bargain hunters mostly walk on Push", () => {
  let walks = 0;
  let total = 0;
  for (let i = 0; i < 300; i++) {
    for (const fair of [15, 24, 48, 130]) {
      const mult = budgetMultFor("bargain", `g${i}`);
      total += 1;
      if (
        judgeAsk({
          ask: askLadder(fair, "bargain").push,
          fair,
          persona: "bargain",
          budgetMult: mult,
        }).outcome === "walk"
      )
        walks += 1;
    }
  }
  assert.ok(walks / total > 0.6, `walk rate ${walks / total}`);
});
