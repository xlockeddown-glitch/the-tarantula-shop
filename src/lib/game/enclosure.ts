import type { SpiderHumidity, SpiderKind, SpiderSpecies, SpiderStage } from "./spiders";

export type Vessel = "vial" | "cube" | "terrestrial" | "arboreal" | "dwarf";
export type Substrate = "arid" | "dry" | "slight" | "crossvent";
export type Hide = "none" | "cork" | "burrow" | "hammock";
export type Water = "dry" | "dish" | "drip";

export type EnclosureBuild = {
  vessel: Vessel;
  substrate: Substrate;
  hide: Hide;
  water: Water;
  score: number;
};

export const VESSEL_OPTS: { id: Vessel; label: string; cost: number; note: string }[] = [
  { id: "vial", label: "Sling vial", cost: 2, note: "Short stay. Air holes." },
  { id: "cube", label: "Cube crib", cost: 6, note: "Starter terrestrial." },
  { id: "terrestrial", label: "Floor tank", cost: 12, note: "Wide, deep hide." },
  { id: "arboreal", label: "Tall cork tank", cost: 14, note: "Height and cross-vent." },
  { id: "dwarf", label: "Shallow dish", cost: 8, note: "Low and small." },
];

export const SUB_OPTS: { id: Substrate; label: string; cost: number }[] = [
  { id: "arid", label: "Dry mix", cost: 1 },
  { id: "dry", label: "Dry corner coco", cost: 1 },
  { id: "slight", label: "Mist one wall", cost: 2 },
  { id: "crossvent", label: "Bare + air", cost: 2 },
];

export const HIDE_OPTS: { id: Hide; label: string; cost: number }[] = [
  { id: "none", label: "Open", cost: 0 },
  { id: "cork", label: "Cork bark", cost: 3 },
  { id: "burrow", label: "Cave hide", cost: 3 },
  { id: "hammock", label: "Silk perch", cost: 3 },
];

export const WATER_OPTS: { id: Water; label: string; cost: number }[] = [
  { id: "dry", label: "No dish", cost: 0 },
  { id: "dish", label: "Water dish", cost: 2 },
  { id: "drip", label: "Light drip", cost: 3 },
];

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

function waterWant(humidity: SpiderHumidity): Water {
  if (humidity === "arid") return "dish";
  if (humidity === "crossvent") return "drip";
  return "dish";
}

export function scoreBuild(spec: SpiderSpecies, stage: SpiderStage, b: Omit<EnclosureBuild, "score">): number {
  let s = 0;
  const v = vesselWant(spec.kind, stage);
  if (b.vessel === v) s += 3;
  else if (stage === "sling" && b.vessel === "vial") s += 3;
  else if (spec.kind === "semi" && (b.vessel === "cube" || b.vessel === "arboreal")) s += 2;
  else s -= spec.price >= 40 ? 3 : 1;

  if (b.substrate === spec.humidity) s += 3;
  else if (
    (spec.humidity === "arid" && b.substrate === "dry") ||
    (spec.humidity === "dry" && (b.substrate === "arid" || b.substrate === "slight"))
  )
    s += 1;
  else s -= spec.ow || spec.price >= 50 ? 4 : spec.price >= 30 ? 2 : 0;

  const h = hideWant(spec.kind);
  if (b.hide === h) s += 2;
  else if (b.hide !== "none") s += 1;

  const w = waterWant(spec.humidity);
  if (b.water === w) s += 2;
  else if (spec.humidity === "crossvent" && b.water === "dish") s += 1;
  else if (b.water === "drip" && spec.humidity === "arid") s -= spec.price >= 30 ? 2 : 0;

  return Math.max(0, Math.min(10, s + 2));
}

export function buildCost(b: Omit<EnclosureBuild, "score">) {
  return (
    (VESSEL_OPTS.find((x) => x.id === b.vessel)?.cost ?? 0) +
    (SUB_OPTS.find((x) => x.id === b.substrate)?.cost ?? 0) +
    (HIDE_OPTS.find((x) => x.id === b.hide)?.cost ?? 0) +
    (WATER_OPTS.find((x) => x.id === b.water)?.cost ?? 0)
  );
}

export function passScore(spec: SpiderSpecies) {
  if (spec.ow || spec.price >= 54) return 8;
  if (spec.price >= 30) return 6;
  return 4;
}

export function starterBuild(spec: SpiderSpecies, stage: SpiderStage): EnclosureBuild {
  const raw = {
    vessel: vesselWant(spec.kind, stage),
    substrate: spec.humidity,
    hide: hideWant(spec.kind),
    water: waterWant(spec.humidity),
  };
  return { ...raw, score: scoreBuild(spec, stage, raw) };
}
