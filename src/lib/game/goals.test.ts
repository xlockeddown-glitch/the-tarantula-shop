import { test } from "node:test";
import assert from "node:assert/strict";
import { isDone, isLapsed, pickGoal, progress, type GoalSnapshot } from "./goals.ts";

const snap = (over: Partial<GoalSnapshot> = {}): GoalSnapshot => ({
  day: 3,
  cash: 120,
  feeders: 6,
  sales: 4,
  pushSales: 0,
  handFeeds: 0,
  ordersFilled: 0,
  truckBuys: 0,
  listed: 3,
  windowCap: 4,
  sellable: 5,
  hungry: 2,
  openOrders: [{ id: "o1", text: "Get a ♀ Pinktoe for Gin", dueDay: 8 }],
  ...over,
});

test("intro goals come in order: hand-feed, sell, push, request", () => {
  const kinds = [0, 1, 2, 3].map((d) => pickGoal(snap(), d)!.kind);
  assert.deepEqual(kinds, ["handfeed", "sell", "push", "order"]);
});

test("intro skips a step that can't be done right now", () => {
  assert.equal(pickGoal(snap({ hungry: 0 }), 0)!.kind, "sell");
  assert.equal(pickGoal(snap({ feeders: 0 }), 0)!.kind, "sell");
});

test("progress counts only what happened after the goal was set", () => {
  const g = pickGoal(snap({ sales: 10 }), 1)!;
  assert.equal(progress(g, snap({ sales: 10 })), 0);
  assert.equal(progress(g, snap({ sales: 11 })), 1);
  assert.ok(isDone(g, snap({ sales: 10 + g.n })));
});

test("an empty window comes first; empty racks point at the Truck", () => {
  assert.equal(pickGoal(snap({ listed: 0 }), 0)!.kind, "window");
  assert.equal(pickGoal(snap({ listed: 0, sellable: 0 }), 0)!.kind, "truck");
});

test("sell goals never ask for more than the window holds", () => {
  for (let listed = 1; listed <= 4; listed++) {
    const g = pickGoal(snap({ listed }), 1)!;
    assert.equal(g.kind, "sell");
    assert.ok(g.n <= Math.min(2, listed));
  }
});

test("a shop low on stock is pointed at the Truck", () => {
  assert.equal(pickGoal(snap({ sellable: 1, openOrders: [] }), 9)!.kind, "truck");
});

test("goals lapse after their day, and order goals lapse if the request is gone", () => {
  const sell = pickGoal(snap(), 1)!;
  assert.ok(!isLapsed(sell, snap()));
  assert.ok(isLapsed(sell, snap({ day: 4 })));
  const order = pickGoal(snap(), 3)!;
  assert.equal(order.kind, "order");
  assert.ok(isLapsed(order, snap({ openOrders: [] })));
  assert.ok(!isLapsed(order, snap({ openOrders: [], ordersFilled: 1 })));
});

test("never picks a goal that is already complete, and avoids repeating the last kind", () => {
  for (let day = 1; day < 40; day++)
    for (let done = 0; done < 12; done++) {
      const s = snap({
        day,
        listed: day % 5,
        sellable: day % 7,
        cash: (day * 13) % 90,
        hungry: day % 3,
        openOrders: day % 4 ? [] : snap().openOrders.map((o) => ({ ...o, dueDay: day + 3 })),
      });
      const g = pickGoal(s, done, "sell");
      if (!g) continue;
      assert.ok(!isDone(g, s), `${g.kind} done on arrival`);
      assert.notEqual(g.kind, "sell");
    }
});
