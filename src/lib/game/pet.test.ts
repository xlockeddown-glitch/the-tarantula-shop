import test from "node:test";
import assert from "node:assert/strict";
import { adoptBlockReason, makeSling } from "./spiders.ts";

const animal = (serial: number) => makeSling("tliltocatl-albopilosus", 1, "sling", serial);

test("adoption allows stock, including wild slings", () => {
  const sp = animal(1);
  const colony = [sp, animal(2)];
  assert.equal(adoptBlockReason(colony, sp.id), null);
  assert.equal(adoptBlockReason([{ ...sp, wild: true }, animal(2)], sp.id), null);
});

test("adoption blocks a second pet", () => {
  const sp = animal(1);
  const colony = [sp, { ...animal(2), personal: true, name: "Miso" }, animal(3)];
  assert.equal(adoptBlockReason(colony, sp.id), "You already have a shop pet.");
});

test("adoption blocks breeding animals", () => {
  const sp = { ...animal(1), inBreed: true };
  assert.equal(adoptBlockReason([sp, animal(2)], sp.id), "She's busy breeding.");
});

test("adoption keeps at least one non-personal animal", () => {
  const sp = animal(1);
  assert.equal(adoptBlockReason([sp], sp.id), "Keep at least one animal to sell.");
});

test("adoption blocks missing and already personal animals", () => {
  const sp = { ...animal(1), personal: true, name: "Miso" };
  assert.equal(adoptBlockReason([], "missing"), "Animal not found.");
  assert.equal(adoptBlockReason([sp, animal(2)], sp.id), "You already have a shop pet.");
});

test("adoption won't break up the only breeding pair", () => {
  const adult = (serial: number, sex: "f" | "m") => ({ ...animal(serial), stage: "adult" as const, sex });
  const f = adult(1, "f");
  const m = adult(2, "m");
  assert.equal(adoptBlockReason([f, m, animal(3)], m.id), "That's half of your only breeding pair.");
  assert.equal(adoptBlockReason([f, m, adult(4, "m"), animal(3)], m.id), null);
});
