import { clutchNights, eatMaleChance, type OwnedSpider, type SpiderSpecies } from "./spiders";

export function femaleRestDays(spec: SpiderSpecies) {
  if (spec.beginner) return 2;
  return clutchNights(spec) + 3 + (spec.ow ? 2 : 0);
}

export function pairRisk(female: OwnedSpider, male: OwnedSpider, spec: SpiderSpecies) {
  const tries = female.mates ?? 0;
  const repeat = female.lastMateId === male.id;
  const failBase = spec.beginner ? 0.08 : 0.16;
  const fail = Math.min(spec.beginner ? 0.32 : 0.72, failBase + tries * (spec.beginner ? 0.08 : 0.14) + (repeat ? 0.22 : 0));
  const eat = Math.min(0.85, eatMaleChance(spec) * (spec.beginner ? 0.45 : 1) + tries * 0.06 + (repeat ? 0.18 : 0));
  const maleSpent = (male.mates ?? 0) >= 1;
  const sacCollapse = Math.min(0.4, (spec.beginner ? 0.04 : 0.08) + tries * 0.07 + (repeat ? 0.1 : 0));
  return { fail, eat, maleSpent, sacCollapse, repeat, tries };
}

export function restLeft(sp: OwnedSpider, day: number) {
  const until = sp.breedRestUntil ?? 0;
  return Math.max(0, until - day);
}
