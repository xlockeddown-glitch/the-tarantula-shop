import { spiderById, type SpiderSpecies, type StockCaps } from "./spiders";

/** Starter wholesale: cheap, hardy beginners only. */
export const STARTER_IDS = [
  "tliltocatl-albopilosus",
  "avicularia-avicularia",
  "grammostola-pulchripes",
] as const;

export const TIER_UNLOCKS: { profit: number; ids: string[] }[] = [
  { profit: 0, ids: [...STARTER_IDS] },
  {
    profit: 70,
    ids: ["brachypelma-hamorii", "avicularia-purpurea", "grammostola-quirogai", "caribena-versicolor", "avicularia-geroldi", "phrixotrichus-vulpinus"],
  },
  {
    profit: 160,
    ids: [
      "chromatopelma-cyaneopubescens",
      "avicularia-lynnae",
      "psalmopoeus-cambridgei",
      "psalmopoeus-reduncus",
      "davus-pentaloris",
    ],
  },
  {
    profit: 280,
    ids: [
      "nhandu-tripepii",
      "pamphobeteus-fortis",
      "sericopelma-angustum",
      "sericopelma-santa-catalina",
      "acanthoscurria-chacoana",
      "acanthoscurria-geniculata",
      "nhandu-coloratovillosus",
    ],
  },
  {
    profit: 420,
    ids: [
      "poecilotheria-rufilata",
      "heteroscodra-maculata",
      "ceratogyrus-darlingi",
      "monocentropus-balfouri",
      "thrixopelma-cyaneolum",
      "megaphobema-robustum",
      "phormictopus-dominican-purple",
    ],
  },
  {
    profit: 560,
    ids: [
      "psalmopoeus-victori",
      "phormingochilus-hati-hati",
      "phormingochilus-everetti",
      "anqasha-picta",
      "dolichothele-diamantinensis",
      "theraphosinae-highland-blue",
      "poecilotheria-metallica",
    ],
  },
];

export function unlockedIds(profit: number): Set<string> {
  const out = new Set<string>();
  for (const t of TIER_UNLOCKS) {
    if (profit >= t.profit) for (const id of t.ids) out.add(id);
  }
  return out;
}

export function nextUnlock(profit: number): { need: number; hint: string } | null {
  const nxt = TIER_UNLOCKS.find((t) => t.profit > profit);
  if (!nxt) return null;
  const spec = spiderById(nxt.ids[0]!);
  return { need: nxt.profit - profit, hint: spec?.common ?? "new stock" };
}

export function isUnlocked(id: string, profit: number) {
  return unlockedIds(profit).has(id);
}

export const BAY_UNITS = { sling: 1, juvenile: 2, adult: 4 } as const;

export function wallUnits(tier: number) {
  if (tier <= 0) return 12;
  if (tier === 1) return 16;
  if (tier === 2) return 20;
  return 24;
}

export function usedWall(wall: { kind: keyof typeof BAY_UNITS }[]) {
  return wall.reduce((n, b) => n + BAY_UNITS[b.kind], 0);
}

export const SLING_SHELF = { extra: 8, cost: 18, max: 3 } as const;

export function shopCaps(tier: number, shelves = 1): StockCaps {
  const extra = Math.max(0, shelves) * SLING_SHELF.extra;
  if (tier <= 0) return { sling: 8 + extra, juvenile: 5, adult: 4 };
  if (tier === 1) return { sling: 12 + extra, juvenile: 7, adult: 6 };
  if (tier === 2) return { sling: 16 + extra, juvenile: 8, adult: 8 };
  return { sling: 72 + extra, juvenile: 36, adult: 18 };
}

/** Listed window panes. Demand (dailyGuests) stays smaller on purpose. */
export function windowSlots(tier: number) {
  if (tier <= 0) return 4;
  if (tier === 1) return 6;
  if (tier === 2) return 10;
  return 18;
}

export function dailyGuests(tier: number) {
  if (tier <= 0) return 3;
  if (tier === 1) return 4;
  if (tier === 2) return 5;
  return 7;
}

/** Felt portraits on the shop wall. Not for sale. */
export type DisplayPin = { speciesId: string; kind: "sale" | "breed" };

export function displaySlots(tier: number) {
  if (tier <= 0) return 5;
  if (tier === 1) return 7;
  if (tier === 2) return 9;
  return 12;
}

export function expandCost(tier: number) {
  return loftUpgrade(tier)?.cost ?? 220;
}

export type LoftStats = {
  sales: number;
  hatches: number;
  cleanNights: number;
  losses: number;
  goodBuilds: number;
};

export function emptyStats(): LoftStats {
  return { sales: 0, hatches: 0, cleanNights: 0, losses: 0, goodBuilds: 0 };
}

export type LoftNeed = {
  sales: number;
  cleanNights: number;
  hatches: number;
  goodBuilds: number;
};

export type LoftUpgrade = {
  from: number;
  label: string;
  cost: number;
  need: LoftNeed;
  blurb: string;
};

export const LOFT_UPGRADES: LoftUpgrade[] = [
  {
    from: 0,
    label: "Overnight glass",
    cost: 40,
    need: { sales: 1, cleanNights: 1, hatches: 2, goodBuilds: 0 },
    blurb: "After two good hatches (and a sale), wake up to six window panes.",
  },
  {
    from: 1,
    label: "Back counter",
    cost: 90,
    need: { sales: 8, cleanNights: 5, hatches: 2, goodBuilds: 0 },
    blurb: "Ten panes and a proper back counter. Feeder crates show up here.",
  },
  {
    from: 2,
    label: "Second address",
    cost: 320,
    need: { sales: 24, cleanNights: 14, hatches: 6, goodBuilds: 0 },
    blurb: "A second address: eighteen panes, warehouse racks (72 slings / 36 juveniles / 18 adults). Guests still come as a short line.",
  },
];

export function loftUpgrade(tier: number) {
  return LOFT_UPGRADES.find((u) => u.from === tier) ?? null;
}

export function missingUpgrade(stats: LoftStats, cash: number, tier: number): string[] {
  const u = loftUpgrade(tier);
  if (!u) return ["Lease is maxed."];
  const miss: string[] = [];
  if (stats.sales < u.need.sales) miss.push(`${u.need.sales - stats.sales} more sale${u.need.sales - stats.sales === 1 ? "" : "s"}`);
  if (stats.cleanNights < u.need.cleanNights) miss.push(`${u.need.cleanNights - stats.cleanNights} clean night${u.need.cleanNights - stats.cleanNights === 1 ? "" : "s"}`);
  if (stats.hatches < u.need.hatches) miss.push(`${u.need.hatches - stats.hatches} hatch${u.need.hatches - stats.hatches === 1 ? "" : "es"}`);
  if (stats.goodBuilds < u.need.goodBuilds) miss.push(`${u.need.goodBuilds - stats.goodBuilds} solid enclosure${u.need.goodBuilds - stats.goodBuilds === 1 ? "" : "s"}`);
  if (cash < u.cost) miss.push(`${u.cost - cash} more chips`);
  return miss;
}

export function neglectDays(spec: SpiderSpecies): number {
  if (spec.ow || spec.price >= 60) return 2;
  if (spec.price >= 36 || spec.rarity === "rare") return 3;
  return 5;
}

export function careStrictness(spec: SpiderSpecies): "soft" | "mid" | "hard" {
  if (spec.ow || spec.price >= 54) return "hard";
  if (spec.price >= 30) return "mid";
  return "soft";
}
