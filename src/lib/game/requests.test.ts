import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fairAsk,
  makeSling,
  rollCustomers,
  rollShipOrders,
  shipMatch,
  SPIDER_SPECIES,
} from "./spiders.ts";

const starters = SPIDER_SPECIES.filter((s) => s.beginner).slice(0, 3);

test("requests only ask for species in the pool, with time to get one", () => {
  for (let day = 1; day <= 60; day++) {
    for (const o of rollShipOrders(day, 2, starters)) {
      assert.ok(starters.some((s) => s.id === o.speciesId));
      assert.ok(o.dueDay - day >= 4, `day ${day} due ${o.dueDay}`);
    }
  }
  assert.deepEqual(rollShipOrders(5, 2, []), []);
});

test("a request pays more than the animal's fair ask", () => {
  for (let day = 1; day <= 60; day++) {
    for (const o of rollShipOrders(day, 2, starters)) {
      for (const sex of o.sex === "any" ? (["m", "f"] as const) : [o.sex]) {
        const sp = {
          ...makeSling(o.speciesId, day, o.stage, 1, sex),
          stage: o.stage,
          enclosureScore: 8,
        };
        assert.ok(shipMatch(sp, o));
        if (o.sex !== "any")
          assert.ok(
            o.pay > fairAsk(sp),
            `${o.speciesId} ${o.stage} ${sex}: ${o.pay} vs ${fairAsk(sp)}`,
          );
      }
    }
  }
});

test("walk-in guests only want species from the pool", () => {
  for (let day = 1; day <= 40; day++)
    for (const c of rollCustomers(day, 6, starters))
      assert.ok(starters.some((s) => s.id === c.want));
});
