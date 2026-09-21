import { useState } from "react";
import { FeltPlate } from "./FeltCard";
import { SPIDER_SPECIES } from "@/lib/game/spiders";
import { displaySlots } from "@/lib/game/progress";
import { useGame } from "@/lib/game/store";
import { Button } from "@/components/ui/button";

export function FeltBinder() {
  const sales = useGame((s) => (Array.isArray(s.feltSales) ? s.feltSales : Array.isArray(s.feltAlbum) ? s.feltAlbum : []));
  const breeds = useGame((s) => (Array.isArray(s.feltBreeds) ? s.feltBreeds : []));
  const breedN = useGame((s) => s.breedCounts ?? {});
  const soldN = useGame((s) => s.soldCounts ?? {});
  const pins = useGame((s) => s.displayPins ?? []);
  const shopTier = useGame((s) => s.shopTier);
  const pinDisplay = useGame((s) => s.pinDisplay);
  const setView = useGame((s) => s.setView);
  const [page, setPage] = useState(0);
  const per = 2;
  const pages = Math.max(1, Math.ceil(SPIDER_SPECIES.length / per));
  const slice = SPIDER_SPECIES.slice(page * per, page * per + per);
  const hung = (id: string, kind: "sale" | "breed") => pins.some((p) => p.speciesId === id && p.kind === kind);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-[28px] border-8 border-[#6a6560] bg-[#9a9690] p-3 shadow-[0_20px_0_#5a5652]">
        <div className="rounded-[20px] bg-[#efe6d8] p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#6a6560]">Keeper binder</p>
              <h2 className="font-display text-3xl text-[#3a3a3c]">Two cards each</h2>
              <p className="mt-1 text-sm text-[#6a6560]">
                Window = 3 sales · Pair = 5 clutches · hanging {pins.length}/{displaySlots(shopTier)}
              </p>
            </div>
            <Button size="sm" className="rounded-full" variant="secondary" onClick={() => setView("world")}>
              Table
            </Button>
          </div>
          <div className="space-y-6">
            {slice.map((spec) => (
              <div key={spec.id} className="flex flex-wrap justify-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <FeltPlate spec={spec} kind="sale" unlocked={sales.includes(spec.id)} progress={soldN[spec.id] ?? 0} />
                  {sales.includes(spec.id) ? (
                    <Button size="sm" className="rounded-full" variant={hung(spec.id, "sale") ? "paper" : "secondary"} onClick={() => pinDisplay(spec.id, "sale")}>
                      {hung(spec.id, "sale") ? "On the wall" : "Pin to wall"}
                    </Button>
                  ) : null}
                </div>
                <div className="flex flex-col items-center gap-2">
                  <FeltPlate spec={spec} kind="breed" unlocked={breeds.includes(spec.id)} progress={breedN[spec.id] ?? 0} />
                  {breeds.includes(spec.id) ? (
                    <Button size="sm" className="rounded-full" variant={hung(spec.id, "breed") ? "paper" : "secondary"} onClick={() => pinDisplay(spec.id, "breed")}>
                      {hung(spec.id, "breed") ? "On the wall" : "Pin to wall"}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between">
            <Button
              size="sm"
              className="rounded-full border-0 bg-[#c47858] text-[#efe6d8] hover:bg-[#b46848]"
              disabled={page <= 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev page
            </Button>
            <p className="font-mono text-[11px] uppercase text-[#6a6560]">
              Page {page + 1} / {pages}
            </p>
            <Button
              size="sm"
              className="rounded-full border-0 bg-[#c4a04a] text-[#3a3a3c] hover:bg-[#b4903a]"
              disabled={page >= pages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}