import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dist,
  dropCricket,
  hipLocal,
  LEG_GEO,
  makeWorld,
  poke,
  step,
  toWorld,
  type Life,
  type Temper,
} from "./tankSim.ts";

const TEMPERS: Temper[] = ["docile", "skittish", "defensive"];
const LIVES: Life[] = ["terrestrial", "arboreal", "fossorial"];
const STAGES = ["sling", "juvenile", "adult"] as const;

function run(w: ReturnType<typeof makeWorld>, seconds: number, onFrame?: () => void) {
  for (let t = 0; t < seconds; t += 1 / 60) {
    step(w, 1 / 60);
    onFrame?.();
  }
}

test("a hungry spider catches the cricket within 90 s", () => {
  for (const temper of TEMPERS)
    for (const stage of STAGES)
      for (let seed = 1; seed <= 6; seed++) {
        const w = makeWorld({
          life: "terrestrial",
          temper,
          stage,
          hasDish: true,
          hungry: true,
          premolt: false,
          seed,
        });
        run(w, 2);
        dropCricket(w);
        let at = -1;
        for (let t = 0; t < 90 && at < 0; t += 1 / 60) {
          step(w, 1 / 60);
          if (w.events.includes("ate")) at = t;
        }
        assert.ok(at >= 0, `${temper} ${stage} seed ${seed} never ate`);
      }
});

test("premolt spiders refuse food", () => {
  const w = makeWorld({
    life: "terrestrial",
    temper: "docile",
    stage: "juvenile",
    hasDish: true,
    hungry: true,
    premolt: true,
    seed: 3,
  });
  dropCricket(w);
  run(w, 60);
  assert.ok(!w.events.includes("ate"));
  assert.ok(w.events.includes("refused"));
});

test("legs stay attached and the spider stays in the tank", () => {
  for (const life of LIVES)
    for (const temper of TEMPERS)
      for (const stage of STAGES) {
        const w = makeWorld({
          life,
          temper,
          stage,
          hasDish: life !== "arboreal",
          hungry: true,
          premolt: false,
          seed: 11,
        });
        dropCricket(w);
        let worst = 0;
        run(w, 40, () => {
          if (Math.floor(w.time * 10) % 37 === 0) poke(w, w.spider.pos);
          const sp = w.spider;
          for (const leg of sp.legs) {
            const h = hipLocal(leg.idx, leg.side, sp.scale);
            const hip = toWorld(sp, h.x, h.y);
            worst = Math.max(worst, dist(hip, leg.foot) / (LEG_GEO[leg.idx]!.reach * sp.scale));
          }
          assert.ok(sp.pos.x > 0 && sp.pos.x < w.layout.w && sp.pos.y > 0 && sp.pos.y < w.layout.h);
        });
        assert.ok(worst < 1.42, `${life} ${temper} ${stage} leg stretched ${worst.toFixed(2)}x`);
      }
});

test("pokes: defensive threat, skittish bolt, docile flicks on a second poke", () => {
  const mk = (temper: Temper) =>
    makeWorld({
      life: "terrestrial",
      temper,
      stage: "adult",
      hasDish: true,
      hungry: false,
      premolt: false,
      seed: 5,
    });
  const d = mk("defensive");
  poke(d, d.spider.pos);
  assert.equal(d.spider.mode, "threat");
  const s = mk("skittish");
  poke(s, s.spider.pos);
  assert.equal(s.spider.mode, "bolt");
  const c = mk("docile");
  poke(c, c.spider.pos);
  assert.equal(c.spider.mode, "flinch");
  run(c, 0.5);
  poke(c, c.spider.pos);
  assert.equal(c.spider.mode, "flick");
});
