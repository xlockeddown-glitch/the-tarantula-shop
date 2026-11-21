import test from "node:test";
import assert from "node:assert/strict";
import { rollCustomers, SPIDER_SPECIES } from "./spiders.ts";
import { dailyTrend, fitsTrend, isTiltedSlot, tiltWalkIns, trendPool, TRENDS } from "./trend.ts";

test("one trend per day on a three-day rotation", () => {
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6].map((d) => dailyTrend(d).id),
    ["arboreal", "payday", "ground", "arboreal", "payday", "ground"],
  );
  for (let day = 1; day <= 90; day++) {
    assert.equal(dailyTrend(day), dailyTrend(day + 3));
    assert.equal(dailyTrend(day).id, dailyTrend(day).id, "same day, same trend");
  }
  assert.ok(TRENDS.some((t) => t === dailyTrend(0)));
  assert.ok(TRENDS.some((t) => t === dailyTrend(-4)));
});

test("trend copy stays plain: no em dashes, no jargon", () => {
  for (const t of TRENDS) {
    for (const s of [t.title, t.line]) {
      assert.ok(!s.includes("—"), `em dash in "${s}"`);
      assert.ok(!/trend|algorithm|rng|tilt/i.test(s), `jargon in "${s}"`);
    }
  }
});

test("trend pools use existing species fields", () => {
  const arb = trendPool("arboreal", SPIDER_SPECIES);
  const ground = trendPool("ground", SPIDER_SPECIES);
  const pay = trendPool("payday", SPIDER_SPECIES);
  assert.ok(arb.length && ground.length && pay.length);
  assert.ok(arb.every((s) => s.life === "arboreal"));
  assert.ok(ground.every((s) => s.life !== "arboreal"));
  assert.ok(pay.every((s) => s.rarity !== "common"));
  for (const s of SPIDER_SPECIES) assert.equal(fitsTrend("arboreal", s) || fitsTrend("ground", s), true);
});

test("half the walk-ins lean in; the other half are exactly today's guests", () => {
  for (let day = 1; day <= 60; day++) {
    const trend = dailyTrend(day).id;
    const base = rollCustomers(day, 6, SPIDER_SPECIES);
    const out = tiltWalkIns(base, rollCustomers(day, 6, trendPool(trend, SPIDER_SPECIES)));
    assert.equal(out.length, base.length);
    let tilted = 0;
    out.forEach((c, i) => {
      const b = base[i]!;
      if (!isTiltedSlot(i)) {
        assert.deepEqual(c, b);
        return;
      }
      tilted++;
      const spec = SPIDER_SPECIES.find((s) => s.id === c.want)!;
      assert.ok(fitsTrend(trend, spec), `day ${day} slot ${i} ${c.want}`);
      // Only the species changes; who they are and how they shop stays put.
      assert.deepEqual({ ...c, want: b.want, offer: b.offer }, b);
    });
    assert.equal(tilted, base.length / 2);
  }
});

test("a tilted guest's offer is priced the same way as any guest", () => {
  for (let day = 1; day <= 30; day++) {
    const pool = trendPool(dailyTrend(day).id, SPIDER_SPECIES);
    const trendRoll = rollCustomers(day, 6, pool);
    const out = tiltWalkIns(rollCustomers(day, 6, SPIDER_SPECIES), trendRoll);
    out.forEach((c, i) => {
      if (isTiltedSlot(i)) assert.equal(c.offer, trendRoll[i]!.offer);
    });
  }
});

test("an empty trend pool leaves the line alone", () => {
  const base = rollCustomers(7, 6, SPIDER_SPECIES);
  assert.deepEqual(tiltWalkIns(base, rollCustomers(7, 6, [])), base);
});

test("reload safe: the same day always gives the same line", () => {
  const a = tiltWalkIns(rollCustomers(11, 6, SPIDER_SPECIES), rollCustomers(11, 6, trendPool(dailyTrend(11).id, SPIDER_SPECIES)));
  const b = tiltWalkIns(rollCustomers(11, 6, SPIDER_SPECIES), rollCustomers(11, 6, trendPool(dailyTrend(11).id, SPIDER_SPECIES)));
  assert.deepEqual(a, b);
});
