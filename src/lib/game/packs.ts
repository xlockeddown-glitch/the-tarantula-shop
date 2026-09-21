import { STARTER_IDS } from "./progress";
import { makeSling, spiderById, type OwnedSpider, type SpiderSex, type SpiderStage } from "./spiders";

export type PackLine = { speciesId: string; stage: SpiderStage; sex?: SpiderSex };
export type StarterPack = { id: string; label: string; note: string; pairId: string; lines: PackLine[] };

const PACK_LABELS = ["Dry rack", "Loft mix", "Beginner three"];

export function rollStarterPacks(): StarterPack[] {
  const pool = [...STARTER_IDS];
  return [0, 1, 2].map((i) => {
    const pairId = pool[i % pool.length]!;
    const lines: PackLine[] = [
      { speciesId: pairId, stage: "adult", sex: "f" },
      { speciesId: pairId, stage: "adult", sex: "m" },
      ...pool.map((speciesId) => ({ speciesId, stage: "juvenile" as const })),
      ...pool.map((speciesId) => ({ speciesId, stage: "sling" as const })),
    ];
    const pairName = spiderById(pairId)?.common ?? pairId;
    return {
      id: `pack-${i}`,
      label: PACK_LABELS[i]!,
      pairId,
      note: `Adult ${pairName} pair · a juvenile of each · 3 slings`,
      lines,
    };
  });
}

export function packToColony(pack: StarterPack): OwnedSpider[] {
  let panes = 0;
  return pack.lines.map((line, i) => {
    const sex = line.sex ?? (line.stage === "sling" ? "u" : Math.random() < 0.5 ? "f" : "m");
    const base = makeSling(line.speciesId, 1, line.stage, i + 1, sex);
    const canList = line.stage !== "adult" && panes < 4;
    if (canList) panes += 1;
    return {
      ...base,
      stage: line.stage,
      tank: line.stage,
      days: line.stage === "adult" ? 36 : line.stage === "juvenile" ? 14 : 2,
      listed: canList,
      enclosureScore: 8,
    };
  });
}
