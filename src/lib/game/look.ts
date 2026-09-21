import { visualOf, type SpiderSpecies, type SpiderStage, type SpiderVisual } from "./spiders";

export type SpeciesPaint = {
  carapace: string;
  abdomen: string;
  legs: string;
  accent: string;
  toes: string;
};

const FALLBACK: SpeciesPaint = {
  carapace: "#3a2a1c",
  abdomen: "#2a1c14",
  legs: "#4a3424",
  accent: "#8a5a32",
  toes: "#c4a078",
};

export const SPECIES_PAINT: Record<string, SpeciesPaint> = {
  "ceratogyrus-darlingi": { carapace: "#6a4a28", abdomen: "#3a2414", legs: "#5a3a20", accent: "#c4a06a", toes: "#2a1c10" },
  "avicularia-avicularia": { carapace: "#3a2a22", abdomen: "#2a1c16", legs: "#241814", accent: "#5a4030", toes: "#e8d0c0" },
  "avicularia-purpurea": { carapace: "#4a2a58", abdomen: "#2e1a3a", legs: "#3a2448", accent: "#7a4a8a", toes: "#d48aa8" },
  "grammostola-pulchripes": { carapace: "#5a4030", abdomen: "#3a2a20", legs: "#4a3428", accent: "#d4b05a", toes: "#c4a070" },
  "tliltocatl-albopilosus": { carapace: "#4a3428", abdomen: "#3a281c", legs: "#5a4030", accent: "#c4b090", toes: "#8a7060" },
  "poecilotheria-rufilata": { carapace: "#3a3a40", abdomen: "#2a2428", legs: "#4a3a38", accent: "#b84838", toes: "#8a7068" },
  "caribena-versicolor": { carapace: "#2a6a6a", abdomen: "#c45a38", legs: "#3a7a68", accent: "#e8c060", toes: "#e890a8" },
  "nhandu-tripepii": { carapace: "#6a2820", abdomen: "#4a1814", legs: "#5a2018", accent: "#c43828", toes: "#8a4030" },
  "pamphobeteus-fortis": { carapace: "#c4b080", abdomen: "#8a7048", legs: "#b4a070", accent: "#e8d4a0", toes: "#6a5840" },
  "phormictopus-cancerides": { carapace: "#3a2a48", abdomen: "#2a1a30", legs: "#4a3458", accent: "#6a4a78", toes: "#8a7098" },
  "heteroscodra-maculata": { carapace: "#3a3428", abdomen: "#2a241c", legs: "#4a4030", accent: "#e8dcc0", toes: "#8a7a60" },
  "chromatopelma-cyaneopubescens": { carapace: "#1a4a58", abdomen: "#c45a28", legs: "#2a6a78", accent: "#3a8a98", toes: "#e8a060" },
  "davus-pentaloris": { carapace: "#3a2a1c", abdomen: "#2a1c14", legs: "#4a3424", accent: "#e8c040", toes: "#8a6040" },
  "thrixopelma-cyaneolum": { carapace: "#2a3a58", abdomen: "#1a2838", legs: "#3a4a68", accent: "#4a6a98", toes: "#8aa0c0" },
  "brachypelma-hamorii": { carapace: "#2a2218", abdomen: "#1c1610", legs: "#2a2218", accent: "#c44828", toes: "#8a4030" },
  "grammostola-quirogai": { carapace: "#6a5a50", abdomen: "#4a3a34", legs: "#5a4a44", accent: "#c4a090", toes: "#8a7068" },
  "megaphobema-robustum": { carapace: "#4a2a20", abdomen: "#3a1c14", legs: "#5a3024", accent: "#c43828", toes: "#8a4030" },
  "psalmopoeus-cambridgei": { carapace: "#3a4a30", abdomen: "#2a3420", legs: "#4a5a38", accent: "#c4b060", toes: "#8a8050" },
  "psalmopoeus-irminia": { carapace: "#2a2218", abdomen: "#1c1610", legs: "#3a2a1c", accent: "#e8a028", toes: "#c47020" },
  "tapinauchenius-cupreus": { carapace: "#6a3a20", abdomen: "#4a2814", legs: "#7a4a28", accent: "#c46830", toes: "#e89068" },
  "aphonopelma-seemanni": { carapace: "#4a3428", abdomen: "#3a2418", legs: "#5a4030", accent: "#e8e0d4", toes: "#f4ece4" },
  "psalmopoeus-victori": { carapace: "#3a2a22", abdomen: "#2a1c16", legs: "#4a3428", accent: "#8a5a40", toes: "#c48060" },
  "phormingochilus-hati-hati": { carapace: "#3a2820", abdomen: "#2a1c14", legs: "#4a3024", accent: "#c45838", toes: "#8a4030" },
  "avicularia-lynnae": { carapace: "#3a4a38", abdomen: "#2a3428", legs: "#4a5a40", accent: "#6a7a58", toes: "#e890a8" },
  "sericopelma-angustum": { carapace: "#4a3a28", abdomen: "#3a2a1c", legs: "#5a4a30", accent: "#c4a060", toes: "#8a6a40" },
  "acanthoscurria-chacoana": { carapace: "#3a2a20", abdomen: "#2a1c14", legs: "#4a3428", accent: "#8a5a38", toes: "#6a4030" },
  "anqasha-picta": { carapace: "#4a3420", abdomen: "#c44820", legs: "#5a4028", accent: "#e86028", toes: "#8a5030" },
  "nhandu-coloratovillosus": { carapace: "#1c1a18", abdomen: "#e8e0d4", legs: "#2a2420", accent: "#f4ece0", toes: "#4a4038" },
  "phormingochilus-everetti": { carapace: "#3a2a22", abdomen: "#2a1c16", legs: "#4a3428", accent: "#a85840", toes: "#8a5040" },
  "phrixotrichus-vulpinus": { carapace: "#8a5030", abdomen: "#6a3820", legs: "#7a4428", accent: "#c46838", toes: "#a05830" },
  "ephebopus-cyanognathus": { carapace: "#2a3a28", abdomen: "#1a2834", legs: "#3a4a38", accent: "#3a8ab0", toes: "#8ab0c8" },
  "dolichothele-diamantinensis": { carapace: "#2a4a68", abdomen: "#1a3048", legs: "#3a5a78", accent: "#4a7aa0", toes: "#80b0d0" },
  "avicularia-geroldi": { carapace: "#3a4a30", abdomen: "#2a3420", legs: "#4a5a38", accent: "#e8c040", toes: "#e890a8" },
  "aphonopelma-hentzi": { carapace: "#5a4030", abdomen: "#4a3020", legs: "#6a4a34", accent: "#8a6040", toes: "#c4a080" },
  "acanthoscurria-geniculata": { carapace: "#2a221c", abdomen: "#1c1612", legs: "#2a221c", accent: "#e8e0d4", toes: "#f4ece4" },
  "monocentropus-balfouri": { carapace: "#c4a070", abdomen: "#8a6848", legs: "#3a6a88", accent: "#5a8aa8", toes: "#d4b890" },
  "poecilotheria-metallica": { carapace: "#1a4a78", abdomen: "#163858", legs: "#2a6aa0", accent: "#4a9ad0", toes: "#e8dcc0" },
};

export function paintOf(id: string): SpeciesPaint {
  return SPECIES_PAINT[id] ?? FALLBACK;
}

export function portraitFor(species: SpiderSpecies, stage: SpiderStage): string {
  return `/game/felt/chips/${species.id}.webp`;
}

export function feltCardArt(speciesId: string, kind: "sale" | "breed"): string {
  return kind === "sale" ? `/game/felt/cards/${speciesId}-window.webp` : `/game/felt/cards/${speciesId}-pair.webp`;
}
