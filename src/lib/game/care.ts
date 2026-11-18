import { neglectDays } from "./progress";
import { isPremolt, spiderById, type OwnedSpider, type SpiderSpecies, type SpiderStage } from "./spiders";

export type CareKind = "feed" | "water" | "mist" | "clean";

export const CLEAN_EVERY = 15;

export function needsWaterBowl(spec: SpiderSpecies) {
  return spec.life === "terrestrial" || spec.life === "fossorial" || spec.humidity === "arid" || spec.humidity === "dry";
}

export function needsMist(spec: SpiderSpecies) {
  return spec.life === "arboreal" || spec.humidity === "crossvent" || spec.humidity === "slight";
}

export function feedWindow(stage: SpiderStage): { every: number; late: number } {
  if (stage === "sling") return { every: 2, late: 4 };
  if (stage === "juvenile") return { every: 4, late: 6 };
  return { every: 7, late: 10 };
}

export const WATER_WINDOW = { due: 3, late: 5 } as const;

export function mistWindow(spec: SpiderSpecies): { due: number; late: number } {
  if (spec.humidity === "slight") return { due: 3, late: 5 };
  return { due: 2, late: 4 };
}

export function daysSince(last: number | undefined, day: number) {
  return day - (last ?? day);
}

/** Premolt or fresh out of a molt: keepers don't feed, and nothing should nag. */
export function offFood(sp: OwnedSpider, day: number) {
  return isPremolt(sp) || sp.moltDay === day;
}

export function careDue(sp: OwnedSpider, spec: SpiderSpecies, day: number): CareKind[] {
  const due: CareKind[] = [];
  const feed = feedWindow(sp.stage);
  if (!offFood(sp, day) && daysSince(sp.fedDay, day) >= feed.every) due.push("feed");
  if (needsWaterBowl(spec) && daysSince(sp.waterDay, day) >= WATER_WINDOW.due) due.push("water");
  if (needsMist(spec) && daysSince(sp.mistDay, day) >= mistWindow(spec).due) due.push("mist");
  if (daysSince(sp.cleanDay, day) >= CLEAN_EVERY) due.push("clean");
  return due;
}

export function careLate(sp: OwnedSpider, spec: SpiderSpecies, day: number): CareKind[] {
  const late: CareKind[] = [];
  const feed = feedWindow(sp.stage);
  if (!offFood(sp, day) && daysSince(sp.fedDay, day) >= feed.late) late.push("feed");
  if (needsWaterBowl(spec) && daysSince(sp.waterDay, day) >= WATER_WINDOW.late) late.push("water");
  if (needsMist(spec) && daysSince(sp.mistDay, day) >= mistWindow(spec).late) late.push("mist");
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
