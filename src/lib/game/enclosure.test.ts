import test from "node:test";
import assert from "node:assert/strict";
import { assessBuild, blankDraft, migrateBuild, passScore, starterBuild } from "./enclosure.ts";
import { SPECIES_PAINT } from "./look.ts";
import { SPIDER_SPECIES, STAGE_ORDER, spiderById } from "./spiders.ts";

const need = (id: string) => {
  const s = spiderById(id);
  if (!s) throw new Error(`missing species ${id}`);
  return s;
};

test("starter build passes for every species at every stage", () => {
  for (const spec of SPIDER_SPECIES) {
    for (const stage of STAGE_ORDER) {
      const b = starterBuild(spec, stage);
      const a = assessBuild(spec, stage, b);
      assert.ok(b.score >= passScore(spec), `${spec.id} ${stage}: ${b.score} < ${passScore(spec)}`);
      assert.equal(a.score, b.score, `${spec.id} ${stage}`);
      assert.deepEqual(a.misses, [], `${spec.id} ${stage}`);
    }
  }
});

test("an arboreal without cross-ventilation fails", () => {
  const spec = need("avicularia-avicularia");
  const a = assessBuild(spec, "adult", { ...starterBuild(spec, "adult"), vent: false });
  assert.ok(a.score < passScore(spec));
  assert.ok(a.misses.includes("Needs cross-ventilation."));
});

test("a fossorial without deep substrate fails", () => {
  for (const id of ["ceratogyrus-darlingi", "megaphobema-robustum"]) {
    const spec = need(id);
    const a = assessBuild(spec, "juvenile", { ...starterBuild(spec, "juvenile"), deep: false });
    assert.ok(a.score < passScore(spec), id);
    assert.ok(a.misses.includes("Needs deep substrate to burrow."), id);
  }
});

test("a juvenile or adult without water fails, a sling does not", () => {
  const spec = need("tliltocatl-albopilosus");
  for (const stage of ["juvenile", "adult"] as const) {
    const a = assessBuild(spec, stage, { ...starterBuild(spec, stage), water: "dry" });
    assert.ok(a.score < passScore(spec), stage);
    assert.ok(a.misses.includes("Needs a water dish."), stage);
  }
  const sling = assessBuild(spec, "sling", { ...starterBuild(spec, "sling"), water: "dry" });
  assert.ok(sling.score >= passScore(spec));
});

test("an adult in a sling vial fails", () => {
  const spec = need("tliltocatl-albopilosus");
  const a = assessBuild(spec, "adult", { ...starterBuild(spec, "adult"), vessel: "vial" });
  assert.ok(a.score < passScore(spec));
  assert.ok(a.misses.includes("Too small for an adult."));
});

test("migrateBuild converts crossvent and drip from old saves", () => {
  assert.deepEqual(
    migrateBuild({ vessel: "arboreal", substrate: "crossvent", hide: "hammock", water: "drip", score: 9 }),
    { vessel: "arboreal", substrate: "dry", vent: true, deep: false, hide: "hammock", water: "droplets", score: 9 },
  );
  assert.deepEqual(
    migrateBuild({ vessel: "cube", substrate: "slight", hide: "burrow", water: "dish", score: 7 }),
    { vessel: "cube", substrate: "slight", vent: false, deep: false, hide: "burrow", water: "dish", score: 7 },
  );
  assert.equal(migrateBuild(undefined), undefined);
});

test("blank bench draft is cheap and never the full answer", () => {
  for (const s of SPIDER_SPECIES)
    for (const st of STAGE_ORDER) {
      const blank = assessBuild(s, st, blankDraft(s, st)).score;
      assert.ok(blank < 10, `${s.id} ${st} blank scored ${blank}`);
    }
});

test("every species in SPIDER_SPECIES has a tailored palette in SPECIES_PAINT", () => {
  for (const s of SPIDER_SPECIES) {
    assert.ok(SPECIES_PAINT[s.id], `missing SPECIES_PAINT entry for ${s.id}`);
  }
});
