import { isUnlocked } from "./progress";
import { makeSling, spiderById, type OwnedSpider } from "./spiders";

export type Biome = "dry" | "leaf" | "cave" | "cork";

export const BIOME_HEX: Record<Biome, string> = {
  leaf: "#7a9a62",
  dry: "#c4a06a",
  cork: "#8a6248",
  cave: "#6a7080",
};

export const BIOME_ART: Record<Biome, string> = {
  leaf: "/game/felt/tile-bark.webp",
  dry: "/game/felt/tile-stone.webp",
  cork: "/game/felt/tile-log.webp",
  cave: "/game/felt/tile-stone.webp",
};

export type PathSpace = {
  id: string;
  biome: Biome;
  landmark?: string;
  silk?: boolean;
  rare?: boolean;
};

/** 20-space Candy Land snake. Row-major; UI snakes even rows. */
export const PATH: PathSpace[] = [
  { id: "yard", biome: "leaf", landmark: "Yard" },
  { id: "hedge", biome: "leaf" },
  { id: "scrub", biome: "dry" },
  { id: "log", biome: "leaf", landmark: "Log" },
  { id: "cork1", biome: "cork" },
  { id: "dry2", biome: "dry" },
  { id: "flake", biome: "cork" },
  { id: "cave1", biome: "cave" },
  { id: "silk", biome: "cave", silk: true },
  { id: "wash", biome: "dry", landmark: "Wash" },
  { id: "leaf2", biome: "leaf" },
  { id: "cork2", biome: "cork" },
  { id: "print", biome: "leaf", rare: true },
  { id: "cave2", biome: "cave" },
  { id: "hollow", biome: "cork", landmark: "Hollow" },
  { id: "dry3", biome: "dry" },
  { id: "leaf3", biome: "leaf" },
  { id: "cork3", biome: "cork" },
  { id: "cave3", biome: "cave" },
  { id: "mouth", biome: "cave", landmark: "Mouth" },
];

export const PATH_COLS = 5;

export function pathCell(i: number) {
  const row = Math.floor(i / PATH_COLS);
  const col = i % PATH_COLS;
  const x = row % 2 === 0 ? col + 1 : PATH_COLS - col;
  return { row: row + 1, col: x };
}

export type TrailCard = {
  id: string;
  kind: "color" | "picture" | "silk" | "print";
  biome?: Biome;
  double?: boolean;
  landmark?: string;
  label: string;
};

const DECK_SPEC: Omit<TrailCard, "id">[] = [
  { kind: "color", biome: "leaf", label: "Leaf" },
  { kind: "color", biome: "dry", label: "Dry" },
  { kind: "color", biome: "cork", label: "Cork" },
  { kind: "color", biome: "cave", label: "Cave" },
  { kind: "color", biome: "leaf", double: true, label: "Double leaf" },
  { kind: "color", biome: "dry", double: true, label: "Double dry" },
  { kind: "picture", landmark: "Log", label: "The Log" },
  { kind: "picture", landmark: "Wash", label: "The Wash" },
  { kind: "picture", landmark: "Hollow", label: "The Hollow" },
  { kind: "picture", landmark: "Mouth", label: "The Mouth" },
  { kind: "silk", label: "Sticky silk" },
  { kind: "print", label: "Pink print" },
];

export function shuffleDeck(): TrailCard[] {
  const deck = DECK_SPEC.map((c, i) => ({ ...c, id: `${c.kind}-${i}` }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j]!, deck[i]!];
  }
  return deck;
}

export const DRAWS_PER_DAY = 3;

export function hopPawn(from: number, card: TrailCard): { to: number; stuck: boolean; looped: boolean } {
  if (card.kind === "silk") return { to: from, stuck: true, looped: false };
  if (card.kind === "print") {
    const rare = PATH.findIndex((s, i) => s.rare && i > from);
    return { to: rare >= 0 ? rare : from, stuck: false, looped: false };
  }
  if (card.kind === "picture" && card.landmark) {
    const ahead = PATH.findIndex((s, i) => s.landmark === card.landmark && i >= from);
    if (ahead >= 0) return { to: ahead, stuck: false, looped: false };
    return { to: from, stuck: false, looped: false };
  }
  if (card.kind === "color" && card.biome) {
    const hits: number[] = [];
    for (let i = from + 1; i < PATH.length; i++) {
      if (PATH[i]!.biome === card.biome) hits.push(i);
    }
    const need = card.double ? 1 : 0;
    if (hits[need] != null) return { to: hits[need]!, stuck: false, looped: false };
    if (hits[0] != null) return { to: hits[0]!, stuck: false, looped: false };
    return { to: PATH.length - 1, stuck: false, looped: false };
  }
  return { to: from, stuck: false, looped: false };
}

export function spaceLabel(space: PathSpace) {
  if (space.landmark) return space.landmark;
  if (space.silk) return "Silk";
  if (space.rare) return "Print";
  return space.biome;
}

/** @deprecated old 8-stop trail — landmarks still used as names */
export const TRAIL = PATH.filter((s) => s.landmark).map((s) => ({
  id: s.id,
  label: s.landmark ?? s.id,
  biome: s.biome,
  art: BIOME_ART[s.biome],
}));

export const FIELD_SPOTS = TRAIL.slice(0, 3).map((s) => ({ id: s.id, label: s.label, x: 0, z: 0 }));
export const FLIPS_PER_DAY = DRAWS_PER_DAY;

const BIOME_POOL: Record<Biome, string[]> = {
  dry: [
    "tliltocatl-albopilosus",
    "grammostola-pulchripes",
    "brachypelma-hamorii",
    "grammostola-quirogai",
    "ceratogyrus-darlingi",
    "monocentropus-balfouri",
    "phrixotrichus-vulpinus",
  ],
  leaf: [
    "avicularia-avicularia",
    "avicularia-geroldi",
    "avicularia-lynnae",
    "caribena-versicolor",
    "davus-pentaloris",
    "acanthoscurria-geniculata",
    "avicularia-purpurea",
  ],
  cave: [
    "dolichothele-diamantinensis",
    "theraphosinae-highland-blue",
    "heteroscodra-maculata",
    "anqasha-picta",
  ],
  cork: [
    "psalmopoeus-cambridgei",
    "psalmopoeus-reduncus",
    "phormingochilus-hati-hati",
    "phormingochilus-everetti",
    "poecilotheria-rufilata",
    "poecilotheria-metallica",
    "psalmopoeus-victori",
  ],
};

export function forageRoll(
  profit: number,
  serial: number,
  day: number,
  biome: Biome = "leaf",
  opts?: { chance?: number; forceWild?: boolean },
): OwnedSpider | null {
  const chance = opts?.chance ?? 0.34;
  if (!opts?.forceWild && Math.random() > chance) return null;
  const pool = BIOME_POOL[biome] ?? BIOME_POOL.leaf;
  const known = pool.filter((id) => isUnlocked(id, profit));
  const wild = pool.filter((id) => !isUnlocked(id, profit));
  const pickPool = opts?.forceWild && wild.length
    ? wild
    : !known.length
      ? wild
      : Math.random() < 0.08 && wild.length
        ? wild
        : known;
  const speciesId = pickPool[Math.floor(Math.random() * pickPool.length)] ?? pool[0];
  if (!speciesId) return null;
  return {
    ...makeSling(speciesId, day, "sling", serial, "u"),
    enclosureScore: 5,
    listed: false,
    wild: true,
  };
}

export function forageLabel(speciesId: string) {
  return spiderById(speciesId)?.common ?? speciesId.replace(/-/g, " ");
}

export function cardBlurb(card: TrailCard, from: number) {
  const hop = hopPawn(from, card);
  const dest = PATH[hop.to]!;
  if (card.kind === "silk") return "Sticky silk. Stuck — that's the walk for today.";
  if (card.kind === "print") {
    return hop.to === from
      ? "Pink print — hunt the rare square right here."
      : "Pink print — hop to the rare square.";
  }
  if (card.kind === "picture") {
    if (hop.to === from) return `Already at or past ${card.landmark}. Stay put and search here.`;
    return `Picture card — hop straight to ${card.landmark}.`;
  }
  if (card.double) return `Double ${card.label.replace(/^Double /i, "").toLowerCase()} — skip ahead to ${spaceLabel(dest)}.`;
  if (hop.to === from) return `${card.label} — no more of that color ahead. Search here.`;
  return `${card.label} — hop to ${spaceLabel(dest)}.`;
}

export function cardColor(card: TrailCard) {
  if (card.kind === "print") return "#e8a0b8";
  if (card.kind === "silk") return "#c8c4be";
  if (card.kind === "picture") return "#c47858";
  return BIOME_HEX[card.biome ?? "leaf"];
}
