import { cribsForTier } from "./loftRoom";
import { neglectDays } from "./progress";
import { spiderById, type OwnedSpider, type SpiderSpecies, type SpiderStage } from "./spiders";

export type CareKind = "feed" | "water" | "mist" | "clean";

export const CLEAN_EVERY = 15;

export function needsWaterBowl(spec: SpiderSpecies) {
  return spec.life === "terrestrial" || spec.life === "fossorial" || spec.humidity === "arid" || spec.humidity === "dry";
}

export function needsMist(spec: SpiderSpecies) {
  return spec.life === "arboreal" || spec.humidity === "crossvent" || spec.humidity === "slight";
}

export function feedWindow(stage: SpiderStage): { every: number; late: number } {
  if (stage === "sling") return { every: 4, late: 5 };
  if (stage === "juvenile") return { every: 2, late: 3 };
  return { every: 1, late: 2 };
}

export function daysSince(last: number | undefined, day: number) {
  return day - (last ?? day);
}

export function careDue(sp: OwnedSpider, spec: SpiderSpecies, day: number): CareKind[] {
  const due: CareKind[] = [];
  const feed = feedWindow(sp.stage);
  if (daysSince(sp.fedDay, day) >= feed.every) due.push("feed");
  if (needsWaterBowl(spec) && daysSince(sp.waterDay, day) >= 1) due.push("water");
  if (needsMist(spec) && daysSince(sp.mistDay, day) >= 1) due.push("mist");
  if (daysSince(sp.cleanDay, day) >= CLEAN_EVERY) due.push("clean");
  return due;
}

export function careLate(sp: OwnedSpider, spec: SpiderSpecies, day: number): CareKind[] {
  const late: CareKind[] = [];
  const feed = feedWindow(sp.stage);
  if (daysSince(sp.fedDay, day) >= feed.late) late.push("feed");
  if (needsWaterBowl(spec) && daysSince(sp.waterDay, day) >= 2) late.push("water");
  if (needsMist(spec) && daysSince(sp.mistDay, day) >= 2) late.push("mist");
  if (daysSince(sp.cleanDay, day) >= CLEAN_EVERY + 5) late.push("clean");
  return late;
}

export function atRisk(sp: OwnedSpider, spec: SpiderSpecies, day: number) {
  return careLate(sp, spec, day).length > 0;
}

export function wouldDie(sp: OwnedSpider, spec: SpiderSpecies, day: number) {
  if (day < 5) return false;
  if (!atRisk(sp, spec, day)) return false;
  return day - (sp.caredDay ?? day) >= neglectDays(spec);
}

/** Water / mist / clean always. Feed only if the bin has crickets. */
export function applyTendAll(
  colony: OwnedSpider[],
  feeders: number,
  day: number,
): { colony: OwnedSpider[]; feeders: number; tended: number; hungry: number } {
  let bin = feeders;
  let tended = 0;
  let hungry = 0;
  const next = colony.map((c) => {
    if (c.personal) return c;
    const spec = spiderById(c.speciesId);
    if (!spec) return c;
    const due = careDue(c, spec, day);
    if (!due.length) return c;
    const row = { ...c, caredDay: day };
    if (due.includes("feed")) {
      if (bin < 1) hungry += 1;
      else {
        bin -= 1;
        row.fedDay = day;
      }
    }
    if (due.includes("water")) row.waterDay = day;
    if (due.includes("mist")) row.mistDay = day;
    if (due.includes("clean")) row.cleanDay = day;
    tended += 1;
    return row;
  });
  return { colony: next, feeders: bin, tended, hungry };
}

export type WallBay = { id: string; kind: SpiderStage };

export type FloorTank = {
  i: number;
  x: number;
  y: number;
  w: number;
  h: number;
  spider: OwnedSpider | null;
};

export function defaultWall(): WallBay[] {
  return [
    { id: "bay-a", kind: "adult" },
    { id: "bay-j1", kind: "juvenile" },
    { id: "bay-j2", kind: "juvenile" },
    { id: "bay-s1", kind: "sling" },
    { id: "bay-s2", kind: "sling" },
    { id: "bay-s3", kind: "sling" },
    { id: "bay-s4", kind: "sling" },
  ];
}

export function floorTanks(colony: OwnedSpider[], tier = 0): FloorTank[] {
  const slots = cribsForTier(tier);
  const listed = colony.filter((c) => c.listed && !c.personal);
  const order = [
    ...listed.filter((c) => c.stage === "adult"),
    ...listed.filter((c) => c.stage === "juvenile"),
    ...listed.filter((c) => c.stage === "sling"),
  ];
  return slots.map((s, i) => ({ i, ...s, spider: order[i] ?? null }));
}
