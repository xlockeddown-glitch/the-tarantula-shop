export type SpiderKind = "terrestrial" | "arboreal" | "semi" | "dwarf" | "jumper";
export type SpiderLife = "arboreal" | "terrestrial" | "fossorial";
export type SpiderRarity = "common" | "uncommon" | "rare";
export type SpiderHumidity = "arid" | "dry" | "slight" | "crossvent";
export type SpiderTemper = "docile" | "skittish" | "defensive";
export type ShopMode = "open" | "closed" | "shipping";

export type SpiderSpecies = {
  id: string;
  latin: string;
  common: string;
  origin: string;
  kind: SpiderKind;
  life: SpiderLife;
  rarity: SpiderRarity;
  ow: boolean;
  beginner: boolean;
  humidity: SpiderHumidity;
  temper: SpiderTemper;
  price: number;
  note: string;
};

export const SPIDER_SPECIES: SpiderSpecies[] = [
  { id: "ceratogyrus-darlingi", latin: "Ceratogyrus darlingi", common: "Rear Horned Baboon", origin: "Zimbabwe, Mozambique, Botswana, South Africa", kind: "terrestrial", life: "fossorial", rarity: "uncommon", ow: true, beginner: false, humidity: "arid", temper: "defensive", price: 48, note: "Deep substrate, open water dish, hide." },
  { id: "avicularia-avicularia", latin: "Avicularia avicularia", common: "Pinktoe", origin: "Trinidad, Venezuela, Brazil, Guyana", kind: "arboreal", life: "arboreal", rarity: "common", ow: false, beginner: true, humidity: "crossvent", temper: "skittish", price: 18, note: "Humidity, open water dish, cross ventilation." },
  { id: "avicularia-purpurea", latin: "Avicularia purpurea", common: "Purple Pinktoe", origin: "Ecuador, Peru", kind: "arboreal", life: "arboreal", rarity: "uncommon", ow: false, beginner: false, humidity: "crossvent", temper: "skittish", price: 32, note: "Humidity, open water dish, cross ventilation." },
  { id: "grammostola-pulchripes", latin: "Grammostola pulchripes", common: "Chaco Golden Knee", origin: "Paraguay, Argentina", kind: "terrestrial", life: "terrestrial", rarity: "common", ow: false, beginner: true, humidity: "dry", temper: "docile", price: 22, note: "Deep substrate, open water dish, hide." },
  { id: "tliltocatl-albopilosus", latin: "Tliltocatl albopilosus", common: "Curly Hair", origin: "Honduras, Nicaragua, Costa Rica", kind: "terrestrial", life: "terrestrial", rarity: "common", ow: false, beginner: true, humidity: "dry", temper: "docile", price: 18, note: "Substrate, open water dish, hide." },
  { id: "poecilotheria-rufilata", latin: "Poecilotheria rufilata", common: "Red Slate Ornamental", origin: "India", kind: "arboreal", life: "arboreal", rarity: "rare", ow: true, beginner: false, humidity: "crossvent", temper: "defensive", price: 72, note: "Humidity, open water dish, cross ventilation." },
  { id: "caribena-versicolor", latin: "Caribena versicolor", common: "Martinique", origin: "Caribbean, Martinique, Lesser Antilles", kind: "arboreal", life: "arboreal", rarity: "uncommon", ow: false, beginner: true, humidity: "crossvent", temper: "skittish", price: 36, note: "Humidity, open water dish, cross ventilation, hide." },
  { id: "nhandu-tripepii", latin: "Nhandu tripepii", common: "Brazilian Giant Blonde", origin: "Brazil", kind: "terrestrial", life: "terrestrial", rarity: "uncommon", ow: false, beginner: false, humidity: "dry", temper: "skittish", price: 34, note: "Substrate, open water dish, hide." },
  { id: "pamphobeteus-fortis", latin: "Pamphobeteus fortis", common: "Columbia Giant Copperhead", origin: "Colombia, Venezuela, Panama", kind: "terrestrial", life: "terrestrial", rarity: "uncommon", ow: false, beginner: false, humidity: "slight", temper: "skittish", price: 38, note: "Substrate, open water dish, hide." },
  { id: "phormictopus-dominican-purple", latin: "Phormictopus sp. \"Dominican Purple\"", common: "Dominican Purple Birdeater", origin: "Dominican Republic", kind: "terrestrial", life: "terrestrial", rarity: "rare", ow: false, beginner: false, humidity: "dry", temper: "skittish", price: 52, note: "Substrate, open water dish, hide. Trade name, not a described species." },
  { id: "heteroscodra-maculata", latin: "Heteroscodra maculata", common: "Togo Starburst Baboon", origin: "Africa", kind: "arboreal", life: "arboreal", rarity: "rare", ow: true, beginner: false, humidity: "crossvent", temper: "defensive", price: 64, note: "Humidity, open water dish, cross ventilation." },
  { id: "chromatopelma-cyaneopubescens", latin: "Chromatopelma cyaneopubescens", common: "Green Bottle Blue", origin: "Venezuela", kind: "terrestrial", life: "terrestrial", rarity: "uncommon", ow: false, beginner: true, humidity: "arid", temper: "docile", price: 40, note: "Open water dish, cross ventilation, dry." },
  { id: "davus-pentaloris", latin: "Davus pentaloris", common: "Guatemalan Tiger Rump", origin: "Guatemala", kind: "terrestrial", life: "terrestrial", rarity: "common", ow: false, beginner: true, humidity: "slight", temper: "skittish", price: 20, note: "Substrate, open water dish, hide." },
  { id: "thrixopelma-cyaneolum", latin: "Thrixopelma cyaneolum", common: "Cobalt Red Rump", origin: "Peru", kind: "terrestrial", life: "terrestrial", rarity: "rare", ow: false, beginner: false, humidity: "arid", temper: "skittish", price: 56, note: "Substrate, open water dish, hide, dry." },
  { id: "brachypelma-hamorii", latin: "Brachypelma hamorii", common: "Mexican Red Knee", origin: "Mexico", kind: "terrestrial", life: "terrestrial", rarity: "uncommon", ow: false, beginner: true, humidity: "arid", temper: "docile", price: 44, note: "Substrate, open water dish, hide." },
  { id: "grammostola-quirogai", latin: "Grammostola quirogai", common: "Uruguayan Black Beauty", origin: "Uruguay", kind: "terrestrial", life: "terrestrial", rarity: "uncommon", ow: false, beginner: true, humidity: "dry", temper: "docile", price: 28, note: "Deep substrate, open water dish, hide." },
  { id: "megaphobema-robustum", latin: "Megaphobema robustum", common: "Columbian Red Leg", origin: "Colombia", kind: "terrestrial", life: "fossorial", rarity: "rare", ow: false, beginner: false, humidity: "slight", temper: "skittish", price: 58, note: "Deep substrate, open water dish, hide." },
  { id: "psalmopoeus-cambridgei", latin: "Psalmopoeus cambridgei", common: "Trinidad Chevron", origin: "Trinidad", kind: "arboreal", life: "arboreal", rarity: "uncommon", ow: false, beginner: false, humidity: "crossvent", temper: "skittish", price: 34, note: "Humidity, open water dish, cross ventilation." },
  { id: "psalmopoeus-reduncus", latin: "Psalmopoeus reduncus", common: "Costa Rican Orange Mouth", origin: "Costa Rica, Panama, Nicaragua", kind: "arboreal", life: "arboreal", rarity: "uncommon", ow: false, beginner: false, humidity: "crossvent", temper: "skittish", price: 32, note: "Humidity, open water dish, cross ventilation." },
  { id: "sericopelma-santa-catalina", latin: "Sericopelma sp. \"Santa Catalina\"", common: "Santa Catalina", origin: "Panama", kind: "terrestrial", life: "terrestrial", rarity: "uncommon", ow: false, beginner: false, humidity: "dry", temper: "skittish", price: 36, note: "Substrate, open water dish, hide. Locale trade name." },
  { id: "psalmopoeus-victori", latin: "Psalmopoeus victori", common: "Darth Maul", origin: "Mexico", kind: "arboreal", life: "arboreal", rarity: "rare", ow: false, beginner: false, humidity: "crossvent", temper: "defensive", price: 54, note: "Open water dish, cross ventilation, hide." },
  { id: "phormingochilus-hati-hati", latin: "Phormingochilus hati hati", common: "Purple Earth Tiger", origin: "Indonesia", kind: "arboreal", life: "arboreal", rarity: "rare", ow: true, beginner: false, humidity: "slight", temper: "defensive", price: 68, note: "Open water dish, humidity, cross ventilation, hide." },
  { id: "avicularia-lynnae", latin: "Avicularia lynnae", common: "West's Black Stripe Pink Toe", origin: "Peru", kind: "arboreal", life: "arboreal", rarity: "uncommon", ow: false, beginner: true, humidity: "crossvent", temper: "skittish", price: 34, note: "Cross ventilation, humidity, open water dish, hide." },
  { id: "sericopelma-angustum", latin: "Sericopelma angustum", common: "Costa Rican Red Rump", origin: "Central America, Costa Rica", kind: "terrestrial", life: "terrestrial", rarity: "uncommon", ow: false, beginner: false, humidity: "dry", temper: "skittish", price: 32, note: "Open water dish, substrate, hide." },
  { id: "acanthoscurria-chacoana", latin: "Acanthoscurria chacoana", common: "Bolivian Red Rump", origin: "Brazil, Bolivia", kind: "terrestrial", life: "terrestrial", rarity: "uncommon", ow: false, beginner: false, humidity: "dry", temper: "skittish", price: 30, note: "Substrate, open water dish, hide." },
  { id: "anqasha-picta", latin: "Anqasha picta", common: "Anqasha Tiger Rump", origin: "Peru", kind: "terrestrial", life: "terrestrial", rarity: "rare", ow: false, beginner: false, humidity: "slight", temper: "skittish", price: 46, note: "Substrate, open water dish, hide, cooler temps." },
  { id: "nhandu-coloratovillosus", latin: "Nhandu coloratovillosus", common: "Brazilian Black & White", origin: "Paraguay, Brazil", kind: "terrestrial", life: "terrestrial", rarity: "uncommon", ow: false, beginner: false, humidity: "dry", temper: "skittish", price: 36, note: "Substrate, open water dish, hide." },
  { id: "phormingochilus-everetti", latin: "Phormingochilus everetti", common: "Sarawak Red Tiger", origin: "Malaysia", kind: "arboreal", life: "arboreal", rarity: "rare", ow: true, beginner: false, humidity: "slight", temper: "defensive", price: 70, note: "Humidity, open water dish, cross ventilation, hide." },
  { id: "phrixotrichus-vulpinus", latin: "Phrixotrichus vulpinus", common: "Chilean Ocelot", origin: "Chile, Argentina", kind: "terrestrial", life: "terrestrial", rarity: "common", ow: false, beginner: true, humidity: "dry", temper: "docile", price: 20, note: "Substrate, open water dish, hide." },
  { id: "theraphosinae-highland-blue", latin: "Theraphosinae sp. \"Blue\"", common: "Highland Blue", origin: "Peru", kind: "terrestrial", life: "terrestrial", rarity: "rare", ow: false, beginner: false, humidity: "dry", temper: "skittish", price: 50, note: "Substrate, open water dish, hide. Undescribed highland trade name." },
  { id: "dolichothele-diamantinensis", latin: "Dolichothele diamantinensis", common: "Brazilian Blue Dwarf Beauty", origin: "Brazil", kind: "dwarf", life: "terrestrial", rarity: "rare", ow: false, beginner: false, humidity: "slight", temper: "skittish", price: 42, note: "Deep substrate, open water dish, hide." },
  { id: "avicularia-geroldi", latin: "Avicularia geroldi", common: "Brazilian Blue-Green Pink Toe", origin: "Brazil", kind: "arboreal", life: "arboreal", rarity: "uncommon", ow: false, beginner: true, humidity: "crossvent", temper: "skittish", price: 34, note: "Humidity, open water dish, cross ventilation." },
  { id: "acanthoscurria-geniculata", latin: "Acanthoscurria geniculata", common: "Brazilian White Knee", origin: "Brazil", kind: "terrestrial", life: "terrestrial", rarity: "uncommon", ow: false, beginner: true, humidity: "slight", temper: "skittish", price: 30, note: "Substrate, open water dish, hide. Fast grower, heavy hair-kicker." },
  { id: "monocentropus-balfouri", latin: "Monocentropus balfouri", common: "Socotra Island Blue", origin: "Socotra, Yemen", kind: "terrestrial", life: "terrestrial", rarity: "rare", ow: true, beginner: false, humidity: "arid", temper: "skittish", price: 62, note: "Dry, hide, silk tubes. Old World baboon, calmer than most." },
  { id: "poecilotheria-metallica", latin: "Poecilotheria metallica", common: "Gooty Sapphire", origin: "India, Andhra Pradesh", kind: "arboreal", life: "arboreal", rarity: "rare", ow: true, beginner: false, humidity: "crossvent", temper: "defensive", price: 96, note: "Humidity, open water dish, cross ventilation. CITES ornamental." },
];

export const CLUTCH_EGGS: Record<string, number> = {
  "ceratogyrus-darlingi": 80,
  "avicularia-purpurea": 100,
  "grammostola-pulchripes": 300,
  "tliltocatl-albopilosus": 600,
  "poecilotheria-rufilata": 150,
  "caribena-versicolor": 120,
  "nhandu-tripepii": 250,
  "pamphobeteus-fortis": 150,
  "phormictopus-dominican-purple": 400,
  "heteroscodra-maculata": 100,
  "chromatopelma-cyaneopubescens": 150,
  "davus-pentaloris": 250,
  "thrixopelma-cyaneolum": 120,
  "brachypelma-hamorii": 400,
  "grammostola-quirogai": 200,
  "megaphobema-robustum": 120,
  "psalmopoeus-cambridgei": 120,
  "psalmopoeus-reduncus": 100,
  "sericopelma-santa-catalina": 200,
  "psalmopoeus-victori": 100,
  "phormingochilus-hati-hati": 90,
  "avicularia-lynnae": 100,
  "sericopelma-angustum": 200,
  "acanthoscurria-chacoana": 800,
  "anqasha-picta": 80,
  "nhandu-coloratovillosus": 250,
  "phormingochilus-everetti": 90,
  "phrixotrichus-vulpinus": 200,
  "theraphosinae-highland-blue": 80,
  "dolichothele-diamantinensis": 40,
  "avicularia-geroldi": 100,
  "acanthoscurria-geniculata": 800,
  "monocentropus-balfouri": 80,
  "poecilotheria-metallica": 120,
};

export const GBB_ID = "chromatopelma-cyaneopubescens";
export const HOUSE_AVIC = "avicularia-purpurea";
export const STOCK_CAP = { sling: 25, juvenile: 10, adult: 5 } as const;
export const TANK_COST = { sling: 4, juvenile: 8, adult: 16, breed: 22 } as const;
export const FEEDER_PACK = { qty: 6, cost: 2 } as const;
export const FEEDER_CRATE = { qty: 28, cost: 8 } as const;
export const RENT_PER_NIGHT = 4;

export function spiderById(id: string) {
  return SPIDER_SPECIES.find((s) => s.id === id);
}

export function shopStock(day: number, count = 8): SpiderSpecies[] {
  const n = Math.max(1, SPIDER_SPECIES.length);
  const start = ((Math.max(1, day) - 1) * 7) % n;
  const out: SpiderSpecies[] = [];
  const seen = new Set<string>();
  const gbb = spiderById(GBB_ID);
  if (gbb) {
    out.push(gbb);
    seen.add(gbb.id);
  }
  for (let i = 0; out.length < count && i < n * 2; i++) {
    const s = SPIDER_SPECIES[(start + i) % n]!;
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    out.push(s);
  }
  return out;
}

export function soldToday(day: number): string | null {
  const stock = shopStock(day);
  const pick = stock[(Math.max(1, day) * 3) % stock.length];
  if (!pick || pick.id === GBB_ID) return stock.find((s) => s.id !== GBB_ID)?.id ?? null;
  return pick.id;
}

export const PAIR_NICK: Record<string, string> = {
  "ceratogyrus-darlingi": "Horned Baboon",
  "avicularia-avicularia": "Guyana Pinktoe",
  "avicularia-purpurea": "Ecuador Pinktoe",
  "grammostola-pulchripes": "Golden Knee",
  "tliltocatl-albopilosus": "Honduran Curly",
  "poecilotheria-rufilata": "Red Slate",
  "caribena-versicolor": "Antilles Pinktoe",
  "nhandu-tripepii": "Giant Blonde",
  "pamphobeteus-fortis": "Copperhead",
  "phormictopus-dominican-purple": "Dominican Purple",
  "heteroscodra-maculata": "Togo Starburst",
  "chromatopelma-cyaneopubescens": "Greenbottle",
  "davus-pentaloris": "Tiger Rump",
  "thrixopelma-cyaneolum": "Cobalt Rump",
  "brachypelma-hamorii": "Mexican Redknee",
  "grammostola-quirogai": "Black Beauty",
  "megaphobema-robustum": "Colombian Redleg",
  "psalmopoeus-cambridgei": "Trinidad Chevron",
  "psalmopoeus-reduncus": "Orange Mouth",
  "sericopelma-santa-catalina": "Santa Catalina",
  "psalmopoeus-victori": "Mexican Redrump",
  "phormingochilus-hati-hati": "Purple Earth Tiger",
  "avicularia-lynnae": "Black Stripe Pinktoe",
  "sericopelma-angustum": "Costa Rican Redrump",
  "acanthoscurria-chacoana": "Bolivian Redrump",
  "anqasha-picta": "Anqasha",
  "nhandu-coloratovillosus": "Black & White",
  "phormingochilus-everetti": "Sarawak Tiger",
  "phrixotrichus-vulpinus": "Chilean Ocelot",
  "theraphosinae-highland-blue": "Highland Blue",
  "dolichothele-diamantinensis": "Blue Dwarf",
  "avicularia-geroldi": "Blue-Green Pinktoe",
  "acanthoscurria-geniculata": "White Knee",
  "monocentropus-balfouri": "Socotra Blue",
  "poecilotheria-metallica": "Gooty Sapphire",
};

export function pairNick(spec: { id: string; common: string }) {
  return PAIR_NICK[spec.id] ?? spec.common;
}

export const KIND_LABEL: Record<SpiderKind, string> = {
  terrestrial: "Terrestrial",
  arboreal: "Arboreal",
  semi: "Semi-arboreal",
  dwarf: "Dwarf",
  jumper: "Jumper",
};

export const HUMIDITY_LABEL: Record<SpiderHumidity, string> = {
  arid: "keep dry",
  dry: "dry corner",
  slight: "mist a wall",
  crossvent: "air, not swamp",
};

export const TEMPER_LABEL: Record<SpiderTemper, string> = {
  docile: "Mild",
  skittish: "Timid",
  defensive: "Aggressive",
};

export function lifeType(s: SpiderSpecies): "Arboreal" | "Terrestrial" | "Fossorial" {
  if (s.life === "fossorial") return "Fossorial";
  if (s.life === "arboreal" || s.kind === "arboreal") return "Arboreal";
  return "Terrestrial";
}

export function listingTitle(s: SpiderSpecies) {
  return `${s.latin} (${s.common})`;
}

export type RackFilter = "all" | "terrestrial" | "arboreal" | "old-world" | "beginner";

export function matchesFilter(s: SpiderSpecies, f: RackFilter) {
  if (f === "all") return true;
  if (f === "old-world") return s.ow;
  if (f === "beginner") return s.beginner;
  if (f === "arboreal") return s.life === "arboreal" || s.kind === "arboreal" || s.kind === "semi";
  if (f === "terrestrial") return s.life !== "arboreal";
  return true;
}

export type SpiderStage = "sling" | "juvenile" | "adult";
export type TankSize = "sling" | "juvenile" | "adult";
export type SpiderVisual = "pinktoe" | "gbb" | "terrestrial" | "oldworld" | "jumper";
export type SpiderSex = "m" | "f" | "u";

export type OwnedSpider = {
  id: string;
  tag: string;
  speciesId: string;
  stage: SpiderStage;
  days: number;
  tank: TankSize;
  caredDay: number;
  fedDay?: number;
  waterDay?: number;
  mistDay?: number;
  cleanDay?: number;
  sex: SpiderSex;
  listed: boolean;
  listedDay?: number;
  personal: boolean;
  name: string;
  inBreed: boolean;
  enclosureScore: number;
  mates?: number;
  lastMateId?: string;
  breedRestUntil?: number;
  spentUntil?: number;
  wild?: boolean;
};

export type Clutch = {
  speciesId: string;
  readyDay: number;
  femaleId: string;
  maleId: string;
  ateMale: boolean;
  expect: number;
  collapse: number;
};

export type ShipOrder = {
  id: string;
  name: string;
  speciesId: string;
  stage: "juvenile" | "adult";
  sex: "m" | "f" | "any";
  dueDay: number;
  pay: number;
  pack: string;
};

export type WholesaleTicket = {
  id: string;
  speciesId: string;
  qty: number;
  arriveDay: number;
  paid: number;
};

export type JournalEntry = { id: string; day: number; title: string; body: string };

export const STAGE_ORDER: SpiderStage[] = ["sling", "juvenile", "adult"];
export const STAGE_DAYS: Record<SpiderStage, number> = { sling: 6, juvenile: 12, adult: 999 };
export const STAGE_LABEL: Record<SpiderStage, string> = { sling: "Sling", juvenile: "Juvenile", adult: "Adult" };
export const TANK_RANK: Record<TankSize, number> = { sling: 0, juvenile: 1, adult: 2 };
export const SEX_LABEL: Record<SpiderSex, string> = { m: "♂", f: "♀", u: "unsexed" };

export function visualOf(speciesId: string): SpiderVisual {
  const s = spiderById(speciesId);
  if (!s) return "terrestrial";
  if (s.ow) return "oldworld";
  if (s.kind === "arboreal") return "pinktoe";
  if (s.id === GBB_ID) return "gbb";
  return "terrestrial";
}

export function minTankFor(stage: SpiderStage): TankSize {
  return stage;
}

export function tankFits(stage: SpiderStage, tank: TankSize) {
  return TANK_RANK[tank] >= TANK_RANK[minTankFor(stage)];
}

export function nextStage(stage: SpiderStage): SpiderStage | null {
  if (stage === "sling") return "juvenile";
  if (stage === "juvenile") return "adult";
  return null;
}

export type StockCaps = { sling: number; juvenile: number; adult: number };

export function shopSpiders(colony: OwnedSpider[]) {
  return colony.filter((c) => !c.personal && !c.inBreed);
}

export function countStage(colony: OwnedSpider[], stage: SpiderStage) {
  return shopSpiders(colony).filter((c) => c.stage === stage).length;
}

export function hasStockRoom(colony: OwnedSpider[], stage: SpiderStage, caps: StockCaps) {
  return countStage(colony, stage) < caps[stage];
}

export function clutchNights(s: SpiderSpecies): number {
  if (s.rarity === "rare") return s.ow ? 5 : 4;
  if (s.rarity === "uncommon") return s.beginner ? 2 : 3;
  return 1;
}

export function eatMaleChance(s: SpiderSpecies): number {
  if (s.ow) return 0.55;
  if (s.temper === "defensive") return 0.4;
  if (s.kind === "arboreal") return 0.08;
  if (s.temper === "skittish") return 0.18;
  return 0.08;
}

export function hatchExpect(speciesId: string): number {
  const eggs = CLUTCH_EGGS[speciesId] ?? 120;
  return Math.max(2, Math.min(10, Math.round(eggs / 40)));
}

export function packLabel(s: SpiderSpecies): string {
  if (s.ow) return "lockbox";
  if (s.kind === "arboreal") return "cork tube";
  if (s.kind === "dwarf") return "vial";
  return "deli cup";
}

export function moltIfReady(
  sp: OwnedSpider,
  colony: OwnedSpider[],
  caps: StockCaps,
): { spider: OwnedSpider; molt: SpiderStage | null; blocked: boolean } {
  const nxt = nextStage(sp.stage);
  if (!nxt || sp.days < STAGE_DAYS[sp.stage]) return { spider: sp, molt: null, blocked: false };
  if (sp.personal) {
    const sexed: OwnedSpider =
      sp.stage === "sling" ? { ...sp, stage: nxt, days: 0, tank: nxt, sex: sp.sex === "u" ? "f" : sp.sex } : { ...sp, stage: nxt, days: 0, tank: nxt };
    return { spider: sexed, molt: nxt, blocked: false };
  }
  if (!hasStockRoom(colony.filter((c) => c.id !== sp.id), nxt, caps)) {
    return { spider: sp, molt: null, blocked: true };
  }
  let sex = sp.sex;
  if (sp.stage === "sling") sex = Math.random() < 0.5 ? "f" : "m";
  return { spider: { ...sp, stage: nxt, days: 0, tank: nxt, sex }, molt: nxt, blocked: false };
}

export function nextTag(serial: number) {
  return `SP-${String(Math.max(1, serial)).padStart(4, "0")}`;
}

export function makeSling(speciesId: string, day: number, tank: TankSize, serial: number, sex: SpiderSex = "u"): OwnedSpider {
  return {
    id: `sp-${speciesId}-${day}-${serial}`,
    tag: nextTag(serial),
    speciesId,
    stage: "sling",
    days: 0,
    tank,
    caredDay: day,
    fedDay: day,
    waterDay: day,
    mistDay: day,
    cleanDay: day,
    sex,
    listed: false,
    personal: false,
    name: "",
    inBreed: false,
    enclosureScore: 8,
  };
}

export function husbandryNeed(s: { beginner: boolean; ow: boolean; rarity: string; kind: string }): number {
  if (s.beginner) return 2;
  if (s.ow) return 7;
  if (s.rarity === "rare") return 5;
  if (s.rarity === "uncommon") return 4;
  return 3;
}

export function fairAsk(sp: OwnedSpider): number {
  const spec = spiderById(sp.speciesId);
  if (!spec) return 12;
  let p = spec.price;
  if (sp.stage === "sling") p = Math.round(p * 0.62);
  if (sp.stage === "juvenile") p = Math.round(p * 0.9);
  if (sp.stage === "adult") p = Math.round(p * 1.15);
  if (sp.sex === "f") p = Math.round(p * 1.5);
  if (sp.sex === "m") p = Math.round(p * 0.95);
  return Math.max(6, p);
}

export function saleChance(ask: number, fair: number): number {
  if (ask <= fair) return 0.88;
  if (ask <= fair * 1.25) return 0.48;
  if (ask <= fair * 1.6) return 0.18;
  return 0.05;
}

/** Hard ceiling so “they asked for it” cannot take any price. */
export function askCeiling(fair: number, offer: number) {
  return Math.round(Math.max(fair, offer) * 1.15);
}

export type ShopCustomer = {
  id: string;
  name: string;
  husbandry: number;
  want: string;
  offer: number;
  follow: boolean;
  kind: "order" | "browse";
  returning: boolean;
  visits: number;
};

export type ReturningGuest = {
  id: string;
  name: string;
  want: string;
  offer: number;
  nextDay: number;
  visits: number;
};

const CUST_NAMES = ["Hana", "Ken", "Sora", "Yui", "Taro", "Aoi", "Gin", "Kuma", "Mira", "Ned", "Priya", "Owen"];

export function rollCustomers(day: number, count = 3): ShopCustomer[] {
  const n = Math.max(1, SPIDER_SPECIES.length);
  const out: ShopCustomer[] = [];
  for (let i = 0; i < count; i++) {
    const spec = SPIDER_SPECIES[(day * 5 + i * 11) % n]!;
    const name = CUST_NAMES[(day + i * 3) % CUST_NAMES.length]!;
    const husbandry = 1 + ((day + i * 7) % 7);
    const fair = Math.round(spec.price * (0.85 + ((day + i) % 4) * 0.08));
    out.push({
      id: `c${day}-${i}`,
      name,
      husbandry,
      want: spec.id,
      offer: fair,
      follow: (day + i) % 3 === 1,
      kind: i === count - 1 ? "browse" : "order",
      returning: false,
      visits: 0,
    });
  }
  return out;
}

export function rollShipOrders(day: number, count = 2): ShipOrder[] {
  const pool = SPIDER_SPECIES;
  const n = Math.max(1, pool.length);
  const out: ShipOrder[] = [];
  for (let i = 0; i < count; i++) {
    const spec = pool[(day * 7 + i * 13) % n]!;
    const stage: "juvenile" | "adult" = (day + i) % 3 === 0 ? "adult" : "juvenile";
    const sexRoll = (day + i) % 3;
    const sex: ShipOrder["sex"] = sexRoll === 0 ? "f" : sexRoll === 1 ? "m" : "any";
    const name = CUST_NAMES[(day + i * 5) % CUST_NAMES.length]!;
    const base = spec.price * (stage === "adult" ? 1.15 : 0.9) * (sex === "f" ? 1.4 : 1);
    out.push({
      id: `sh-${day}-${i}`,
      name,
      speciesId: spec.id,
      stage,
      sex,
      dueDay: day + 2 + (i % 2),
      pay: Math.max(14, Math.round(base * 1.35)),
      pack: packLabel(spec),
    });
  }
  return out;
}

export function shipMatch(sp: OwnedSpider, o: ShipOrder) {
  if (sp.personal || sp.inBreed || sp.stage === "sling") return false;
  if (sp.speciesId !== o.speciesId) return false;
  if (sp.stage !== o.stage) return false;
  if (o.sex !== "any" && sp.sex !== o.sex) return false;
  return true;
}

export function migrateOwned(raw: Partial<OwnedSpider>, day: number, serial: number): OwnedSpider {
  const stage = raw.stage ?? "sling";
  const sex: SpiderSex =
    stage === "sling" ? "u" : raw.sex === "m" || raw.sex === "f" ? raw.sex : Math.random() < 0.5 ? "f" : "m";
  return {
    id: raw.id ?? `sp-mig-${day}-${serial}`,
    tag: raw.tag ?? nextTag(serial),
    speciesId: spiderById(raw.speciesId ?? "") ? raw.speciesId! : "tliltocatl-albopilosus",
    stage,
    days: typeof raw.days === "number" ? raw.days : 0,
    tank: raw.tank ?? stage,
    caredDay: typeof raw.caredDay === "number" ? raw.caredDay : day,
    fedDay: raw.fedDay ?? raw.caredDay ?? day,
    waterDay: raw.waterDay ?? raw.caredDay ?? day,
    mistDay: raw.mistDay ?? raw.caredDay ?? day,
    cleanDay: raw.cleanDay ?? raw.caredDay ?? day,
    sex,
    listed: !!raw.listed && !raw.personal,
    personal: !!raw.personal,
    name: raw.name ?? "",
    inBreed: !!raw.inBreed,
    enclosureScore: typeof raw.enclosureScore === "number" ? raw.enclosureScore : 8,
    mates: raw.mates,
    lastMateId: raw.lastMateId,
    breedRestUntil: raw.breedRestUntil,
    spentUntil: raw.spentUntil,
    wild: !!raw.wild,
  };
}

