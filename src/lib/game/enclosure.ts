import type { SpiderHumidity, SpiderKind, SpiderSpecies, SpiderStage } from "./spiders";

export type Vessel = "vial" | "cube" | "terrestrial" | "arboreal" | "dwarf";
export type Substrate = "arid" | "dry" | "slight";
export type Hide = "none" | "cork" | "burrow" | "hammock";
export type Water = "dry" | "dish" | "droplets";

export type EnclosureBuild = {
  vessel: Vessel;
  substrate: Substrate;
  vent: boolean;
  deep: boolean;
  hide: Hide;
  water: Water;
  score: number;
};

export type BuildDraft = Omit<EnclosureBuild, "score">;
export type BuildReport = { score: number; misses: string[] };

export const VESSEL_OPTS: { id: Vessel; label: string; cost: number; note: string }[] = [
  { id: "vial", label: "Sling vial", cost: 2, note: "Small, so a sling finds its food." },
  { id: "cube", label: "Cube crib", cost: 6, note: "Starter home for terrestrial juveniles." },
  { id: "terrestrial", label: "Floor tank", cost: 12, note: "Wide, low: heavy adults fall badly from height." },
  { id: "arboreal", label: "Tall tank", cost: 14, note: "Height for webbing and climbing." },
  { id: "dwarf", label: "Shallow dish", cost: 8, note: "Low and small for dwarf species." },
];

export const SUB_OPTS: { id: Substrate; label: string; cost: number; note: string }[] = [
  { id: "arid", label: "Dry mix", cost: 1, note: "Desert species." },
  { id: "dry", label: "Dry coco", cost: 1, note: "Most terrestrials and arboreals." },
  { id: "slight", label: "One damp corner", cost: 2, note: "Humid-leaning species; rest stays dry." },
];

export const HIDE_OPTS: { id: Hide; label: string; cost: number; note: string }[] = [
  { id: "none", label: "Open", cost: 0, note: "No cover at all." },
  { id: "cork", label: "Cork bark", cost: 3, note: "Flat hide for semi-arboreals and dwarfs." },
  { id: "burrow", label: "Cave hide", cost: 3, note: "Burrow start for terrestrials and diggers." },
  { id: "hammock", label: "Cork tube", cost: 3, note: "Upright tube for arboreals to web." },
];

export const WATER_OPTS: { id: Water; label: string; cost: number; note: string }[] = [
  { id: "dry", label: "No dish", cost: 0, note: "No standing water." },
  { id: "dish", label: "Water dish", cost: 2, note: "Every juvenile and adult needs one." },
  { id: "droplets", label: "Dish + wall droplets", cost: 3, note: "Arboreals also drink from the glass." },
];

export const VENT_OPT = {
  label: "Cross-ventilation",
  cost: 1,
  note: "Holes on opposite sides so air moves. Arboreals sicken in stuffy, wet tanks.",
};

export const DEEP_OPT = {
  label: "Deep substrate",
  cost: 2,
  note: "Deep enough to dig a real burrow.",
};

function vesselWant(kind: SpiderKind, stage: SpiderStage): Vessel {
  if (stage === "sling") return "vial";
  if (kind === "dwarf") return "dwarf";
  if (kind === "arboreal") return "arboreal";
  if (kind === "semi") return "cube";
  return stage === "adult" ? "terrestrial" : "cube";
}

function hideWant(kind: SpiderKind): Hide {
  if (kind === "arboreal") return "hammock";
  if (kind === "semi") return "cork";
  if (kind === "dwarf") return "cork";
  return "burrow";
}

/** Fossorial species dig, whatever their body plan. */
function wantedHide(spec: SpiderSpecies): Hide {
  return spec.life === "fossorial" ? "burrow" : hideWant(spec.kind);
}

/** "crossvent" species want dry substrate. The moving air is the vent toggle. */
function moistureWant(humidity: SpiderHumidity): Substrate {
  return humidity === "crossvent" ? "dry" : humidity;
}

const DAMP_RANK: Record<Substrate, number> = { arid: 0, dry: 1, slight: 2 };

const VESSEL_MISS: Record<Vessel, string> = {
  vial: "A sling vial suits slings.",
  cube: "A cube crib suits it at this size.",
  terrestrial: "A floor tank suits adult terrestrials.",
  arboreal: "A tall tank suits arboreals.",
  dwarf: "A shallow dish suits dwarf species.",
};

/**
 * Score a build for one animal at one stage. A missing essential caps the
 * score just under the pass mark, so no amount of extras can buy past it.
 * Misses are plain sentences: essentials first, then softer hints.
 */
export function assessBuild(spec: SpiderSpecies, stage: SpiderStage, b: BuildDraft): BuildReport {
  const essentials: string[] = [];
  const hints: string[] = [];
  let s = 1;

  const v = vesselWant(spec.kind, stage);
  if (b.vessel === v) s += 3;
  else if (spec.kind === "semi" && (b.vessel === "cube" || b.vessel === "arboreal")) s += 2;
  else {
    s -= spec.price >= 40 ? 3 : 1;
    hints.push(VESSEL_MISS[v]);
  }

  const gap = DAMP_RANK[b.substrate] - DAMP_RANK[moistureWant(spec.humidity)];
  if (gap === 0) s += 2;
  else if (Math.abs(gap) === 1) {
    s += 1;
    hints.push(gap > 0 ? "A little too damp for this species." : "A little too dry for this species.");
  } else {
    if (spec.ow || spec.price >= 50) s -= 2;
    hints.push(gap > 0 ? "Too damp for this species." : "Too dry for this species.");
  }

  if (spec.life === "arboreal") {
    if (b.vent) s += 1;
    else essentials.push("Needs cross-ventilation.");
  }
  if (spec.life === "fossorial") {
    if (b.deep) s += 1;
    else essentials.push("Needs deep substrate to burrow.");
  }

  if (b.hide === wantedHide(spec)) s += 2;
  else if (b.hide !== "none") s += 1;
  else hints.push("A hide would help.");

  if (b.water === "dish") s += 2;
  else if (b.water === "droplets") s += spec.life === "arboreal" ? 2 : 1;
  else if (stage === "sling") hints.push("A water dish would help.");
  else essentials.push("Needs a water dish.");

  if (stage === "adult" && b.vessel === "vial") essentials.push("Too small for an adult.");

  let score = Math.max(0, Math.min(10, s));
  if (essentials.length) score = Math.min(score, passScore(spec) - 1);
  return { score, misses: [...essentials, ...hints] };
}

export function scoreBuild(spec: SpiderSpecies, stage: SpiderStage, b: Omit<EnclosureBuild, "score">): number {
  return assessBuild(spec, stage, b).score;
}

export function buildCost(b: Omit<EnclosureBuild, "score">) {
  return (
    (VESSEL_OPTS.find((x) => x.id === b.vessel)?.cost ?? 0) +
    (SUB_OPTS.find((x) => x.id === b.substrate)?.cost ?? 0) +
    (HIDE_OPTS.find((x) => x.id === b.hide)?.cost ?? 0) +
    (WATER_OPTS.find((x) => x.id === b.water)?.cost ?? 0) +
    (b.vent ? VENT_OPT.cost : 0) +
    (b.deep ? DEEP_OPT.cost : 0)
  );
}

export function passScore(spec: SpiderSpecies) {
  if (spec.ow || spec.price >= 54) return 8;
  if (spec.price >= 30) return 6;
  return 4;
}

/** A passing build for any species at any stage. The bench starts from this. */
export function starterBuild(spec: SpiderSpecies, stage: SpiderStage): EnclosureBuild {
  const arboreal = spec.life === "arboreal";
  const raw: BuildDraft = {
    vessel: vesselWant(spec.kind, stage),
    substrate: moistureWant(spec.humidity),
    vent: arboreal,
    deep: spec.life === "fossorial",
    hide: wantedHide(spec),
    water: arboreal ? "droplets" : "dish",
  };
  return { ...raw, score: assessBuild(spec, stage, raw).score };
}

/** What the bench shows for an animal with no build yet: right size, nothing tailored. */
export function blankDraft(spec: SpiderSpecies, stage: SpiderStage): BuildDraft {
  return { vessel: vesselWant(spec.kind, stage), substrate: "dry", vent: false, deep: false, hide: "none", water: "dry" };
}

/** The six choices, without the score. */
export function draftOf(b: BuildDraft): BuildDraft {
  return { vessel: b.vessel, substrate: b.substrate, vent: b.vent, deep: b.deep, hide: b.hide, water: b.water };
}

/** Same choices, ignoring score. */
export function sameBuild(a: BuildDraft, b: BuildDraft) {
  return (
    a.vessel === b.vessel &&
    a.substrate === b.substrate &&
    a.vent === b.vent &&
    a.deep === b.deep &&
    a.hide === b.hide &&
    a.water === b.water
  );
}

/** Old saves: "crossvent" substrate becomes dry + vent, "drip" becomes droplets. */
export function migrateBuild(raw: unknown): EnclosureBuild | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const vessel = VESSEL_OPTS.find((x) => x.id === r.vessel)?.id;
  if (!vessel) return undefined;
  const cross = r.substrate === "crossvent";
  const substrate: Substrate = cross ? "dry" : (SUB_OPTS.find((x) => x.id === r.substrate)?.id ?? "dry");
  const hide: Hide = HIDE_OPTS.find((x) => x.id === r.hide)?.id ?? "none";
  const water: Water = r.water === "drip" ? "droplets" : (WATER_OPTS.find((x) => x.id === r.water)?.id ?? "dry");
  return {
    vessel,
    substrate,
    vent: cross || r.vent === true,
    deep: r.deep === true,
    hide,
    water,
    score: typeof r.score === "number" ? r.score : 0,
  };
}
