import { useState } from "react";
import { portraitFor, feltCardArt } from "@/lib/game/look";
import { careDue } from "@/lib/game/care";
import { PATH, PATH_COLS, pathCell, DRAWS_PER_DAY, BIOME_HEX, BIOME_ART, spaceLabel, cardColor, cardBlurb, hopPawn, type TrailCard } from "@/lib/game/field";
import { windowSlots, type DisplayPin } from "@/lib/game/progress";
import { spiderById, fairAsk, pairNick, type OwnedSpider } from "@/lib/game/spiders";
import { useGame } from "@/lib/game/store";
import { Button } from "@/components/ui/button";
import { SexMark } from "./SexMark";

function stackKey(s: OwnedSpider) {
  return `${s.speciesId}:${s.stage}:${s.sex}:${s.wild ? "w" : "c"}`;
}

function groupStacks(list: OwnedSpider[]) {
  const m = new Map<string, OwnedSpider[]>();
  for (const s of list) {
    const k = stackKey(s);
    const arr = m.get(k) ?? [];
    arr.push(s);
    m.set(k, arr);
  }
  return [...m.values()];
}

function ChipStack({ spiders, onTop }: { spiders: OwnedSpider[]; onTop: (id: string) => void }) {
  const top = spiders[0];
  if (!top) return null;
  const n = spiders.length;
  return (
    <button type="button" className="relative" onClick={() => onTop(top.id)}>
      {n > 1 ? (
        <span className="absolute top-1 left-1 h-[110px] w-[88px] rounded-[12px] border-2 border-[#efe6d8] bg-[#d8cfc0] shadow-[0_8px_0_#8a8680]" />
      ) : null}
      {n > 2 ? (
        <span className="absolute top-0.5 left-0.5 h-[110px] w-[88px] rounded-[12px] border-2 border-[#efe6d8] bg-[#e4d8c8]" />
      ) : null}
      <span className="relative block">
        <CardFace spider={top} small />
      </span>
      {n > 1 ? (
        <span className="absolute -top-1 -right-1 z-10 rounded-full bg-[#c47858] px-1.5 py-0.5 font-mono text-[10px] text-[#efe6d8] shadow-[0_2px_0_#8a8680]">
          ×{n}
        </span>
      ) : null}
    </button>
  );
}

function CardFace({ spider, small }: { spider: OwnedSpider; small?: boolean }) {
  const spec = spiderById(spider.speciesId);
  const day = useGame((s) => s.day);
  if (!spec) return null;
  const due = careDue(spider, spec, day).length > 0;
  return (
    <article className={`overflow-hidden rounded-[12px] border-2 border-[#efe6d8] bg-[#efe6d8] shadow-[0_8px_0_#8a8680] ${small ? "w-[88px]" : "w-[128px]"}`}>
      <img src={portraitFor(spec, spider.stage)} alt="" className={small ? "h-16 w-full object-contain" : "h-24 w-full object-contain"} />
      <div className="bg-[#efe6d8] px-1.5 py-1">
        <p className="truncate text-[11px] font-medium leading-tight text-[#3a3a3c]">{spec.common}</p>
        <p className="font-mono text-[9px] uppercase tracking-wide text-[#6a6560]">
          {spider.stage} · <SexMark sex={spider.sex} />
          {spider.listed ? " · sale" : ""}
          {spider.wild ? " · wild" : ""}
          {due ? " · due" : ""}
        </p>
      </div>
    </article>
  );
}

function WallFace({ pin, onUnpin }: { pin: DisplayPin; onUnpin: () => void }) {
  const spec = spiderById(pin.speciesId);
  if (!spec) return null;
  const sale = pin.kind === "sale";
  const frame = sale ? "#5aa8a0" : "#c45c6a";
  return (
    <button
      type="button"
      onClick={onUnpin}
      title="Take off the wall"
      className="relative h-52 w-36 shrink-0 overflow-hidden rounded-[16px] border-4 object-cover shadow-[0_14px_0_#4a524e]"
      style={{ borderColor: frame }}
    >
      <img src={feltCardArt(spec.id, pin.kind)} alt="" className="size-full object-cover" />
      <span className="absolute inset-x-0 bottom-0 bg-[#efe6d8]/90 py-1 font-mono text-[9px] uppercase text-[#3a3a3c]">
        {sale ? spec.common : pairNick(spec)}
      </span>
    </button>
  );
}

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="relative h-[118px] w-[88px] overflow-hidden rounded-[12px] border-2 border-[#efe6d8] shadow-[0_6px_0_#8a8680]">
      <img src="/game/felt/slot-empty.webp" alt="" className="size-full object-cover" />
      <span className="absolute inset-x-1 bottom-1 text-center font-mono text-[8px] uppercase text-[#3a3a3c]">{label}</span>
    </div>
  );
}

function TrailFindFace({
  find,
  onDone,
}: {
  find: { kind: "empty" | "full" | "silk" | "sling"; space: string; speciesId?: string; wild?: boolean };
  onDone: () => void;
}) {
  const spec = find.speciesId ? spiderById(find.speciesId) : null;
  const title =
    find.kind === "sling" ? "Wild sling" : find.kind === "silk" ? "Sticky silk" : find.kind === "full" ? "Racks full" : "Empty";
  const body =
    find.kind === "sling" && spec
      ? `${spec.common} · ${spec.latin}. On the rack until it molts.`
      : find.kind === "silk"
        ? "That's the walk for today."
        : find.kind === "full"
          ? `${find.space} had something — no room for another sling.`
          : `${find.space}. Nothing under the felt.`;
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#3a3a3c]/45 p-4">
      <div className="flex max-w-sm flex-col items-center rounded-[20px] border-4 border-[#efe6d8] bg-[#efe6d8] p-5 text-center shadow-[0_16px_0_#8a8680]">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#6a6560]">{find.space}</p>
        <h3 className="font-display mt-1 text-3xl text-[#3a3a3c]">{title}</h3>
        {spec ? (
          <img src={portraitFor(spec, "sling")} alt="" className="mt-3 size-28 rounded-[14px] border-4 border-[#5aa8a0] object-contain bg-[#f4eee6]" />
        ) : (
          <div className="mt-3 flex size-28 items-center justify-center rounded-[14px] border-4 border-[#efe6d8] bg-[#c8c4be] font-mono text-[11px] uppercase text-[#6a6560]">
            {find.kind === "silk" ? "Silk" : "—"}
          </div>
        )}
        <p className="mt-3 text-base text-[#3a3a3c]">{body}</p>
        <Button className="mt-4 rounded-full bg-[#5aa8a0] px-6 text-[#efe6d8] hover:bg-[#4a9890]" onClick={onDone}>
          {find.kind === "sling" ? "Keep it" : "Alright"}
        </Button>
      </div>
    </div>
  );
}

function TrailCardFace({ card, large }: { card: TrailCard; large?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-[16px] border-4 border-[#efe6d8] px-3 text-center shadow-[0_8px_0_#8a8680] ${large ? "h-52 w-36" : "h-24 w-[4.4rem]"}`}
      style={{ backgroundColor: cardColor(card) }}
    >
      <p className={`font-mono uppercase tracking-wide text-[#efe6d8] ${large ? "text-[11px]" : "text-[8px]"}`}>
        {card.kind === "color" ? (card.double ? "Double" : "Color") : card.kind}
      </p>
      <p className={`font-display leading-tight text-[#efe6d8] ${large ? "mt-2 text-3xl" : "text-sm"}`}>{card.label}</p>
    </div>
  );
}

function CoachCard({ beat, onSkip }: { beat: number; onSkip: () => void }) {
  const copy = [
    { kicker: "1 / 4", title: "Window vs rack", body: "The window is already stocked. Guests only buy those. Tap a rack chip to list another, then Open shop." },
    { kicker: "2 / 4", title: "Guests", body: "They only buy what's in the window. Trade or Pass. Close when you're done." },
    { kicker: "3 / 4", title: "Night", body: "Tend all (feed and water), then Sleep in the top bar." },
    { kicker: "4 / 4", title: "That's a day", body: "Breed when you have an adult pair. Truck, Binder, and Notes are in the bottom bar. ? is everything else." },
  ][Math.min(3, Math.max(0, beat))]!;
  return (
    <div className="mb-3 flex items-start justify-between gap-3 rounded-[14px] border-2 border-[#c47858] bg-[#efe6d8] px-3 py-2.5">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wide text-[#c47858]">{copy.kicker} · {copy.title}</p>
        <p className="mt-1 text-sm text-[#3a3a3c]">{copy.body}</p>
      </div>
      <Button size="sm" variant="ghost" className="shrink-0 rounded-full" onClick={onSkip}>
        {beat >= 3 ? "Got it" : "Skip"}
      </Button>
    </div>
  );
}

export function FeltTable() {
  const colony = useGame((s) => s.colony);
  const shopTier = useGame((s) => s.shopTier);
  const shopMode = useGame((s) => s.shopMode);
  const openedDay = useGame((s) => s.openedDay ?? 0);
  const openedBy = useGame((s) => s.openedBy);
  const customers = useGame((s) => s.customers);
  const day = useGame((s) => s.day);
  const view = useGame((s) => s.view);
  const trailPawn = useGame((s) => s.trailPawn) ?? 0;
  const trailDraws = useGame((s) => s.trailDraws) ?? 0;
  const trailDeck = useGame((s) => s.trailDeck) ?? [];
  const trailLastCard = useGame((s) => s.trailLastCard);
  const trailPending = useGame((s) => s.trailPending);
  const trailFind = useGame((s) => s.trailFind);
  const drawTrailCard = useGame((s) => s.drawTrailCard);
  const resolveTrailCard = useGame((s) => s.resolveTrailCard);
  const dismissTrailFind = useGame((s) => s.dismissTrailFind);
  const careAll = useGame((s) => s.careAll);
  const displayPins = useGame((s) => s.displayPins) ?? [];
  const unpinDisplay = useGame((s) => s.unpinDisplay);
  const elizabethHired = useGame((s) => s.elizabethHired);
  const elizabethCover = useGame((s) => s.elizabethCover);
  const listSpider = useGame((s) => s.listSpider);
  const startBreed = useGame((s) => s.startBreed);
  const serve = useGame((s) => s.serveCustomer);
  const refuse = useGame((s) => s.refuseCustomer);
  const openShop = useGame((s) => s.openShop);
  const closeShop = useGame((s) => s.closeShop);
  const enterField = useGame((s) => s.enterField);
  const leaveField = useGame((s) => s.leaveField);

  const windows = windowSlots(shopTier);
  const listedSpiders = colony.filter((c) => c.listed && !c.personal);
  const rack = colony.filter((c) => !c.personal && !c.listed && !c.inBreed);
  const females = colony.filter((c) => c.stage === "adult" && c.sex === "f" && !c.personal && !c.inBreed);
  const pairs = females
    .map((female) => {
      const male = colony.find((c) => c.stage === "adult" && c.sex === "m" && !c.personal && !c.inBreed && c.speciesId === female.speciesId);
      const rest = Math.max(0, (female.breedRestUntil ?? 0) - day);
      return { female, male, rest };
    })
    .filter((p) => p.male);
  const [pick, setPick] = useState(0);
  const pair = pairs[Math.min(pick, Math.max(0, pairs.length - 1))];
  const queue = customers;
  const closedForDay = openedDay === day;
  const sheHasTill = openedBy === "elizabeth" && closedForDay;
  const coachBeat = useGame((s) => s.coachBeat) ?? 4;
  const skipCoach = useGame((s) => s.skipCoach);

  if (view === "field") {
    const here = PATH[trailPawn] ?? PATH[0]!;
    const left = Math.max(0, DRAWS_PER_DAY - trailDraws);
    const dest = trailPending ? hopPawn(trailPawn, trailPending).to : -1;
    return (
      <div
        className="relative overflow-hidden rounded-[20px] border border-[#3a3a3c]/15 p-4 shadow-inner"
        style={{ backgroundImage: "url(/game/felt/mat.webp)", backgroundSize: "cover" }}
      >
        <div className="rounded-[16px] bg-[#c8c4be] p-4 ring-1 ring-[#3a3a3c]/10">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#3a3a3c]/70">Felt trail · Candy path</p>
            <Button size="sm" variant="secondary" className="rounded-full" onClick={leaveField}>
              Back to shop
            </Button>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl text-[#3a3a3c]">{spaceLabel(here)}</h2>
              <p className="mt-1 text-sm text-[#6a6560]">
                {left} card{left === 1 ? "" : "s"} left today. Draw, read it, then hop.
              </p>
            </div>
            {trailLastCard && !trailPending ? <TrailCardFace card={trailLastCard} /> : null}
          </div>
          <div
            className="mt-4 grid gap-2"
            style={{ gridTemplateColumns: `repeat(${PATH_COLS}, minmax(0, 1fr))` }}
          >
            {PATH.map((space, i) => {
              const pos = pathCell(i);
              const on = i === trailPawn;
              const aim = i === dest;
              return (
                <div
                  key={space.id}
                  className={`relative aspect-square overflow-hidden rounded-[14px] border-4 shadow-[0_5px_0_#7a8680] ${on ? "border-[#c47858]" : aim ? "border-[#c4a04a]" : "border-[#efe6d8]"}`}
                  style={{
                    gridRow: pos.row,
                    gridColumn: pos.col,
                    backgroundColor: space.rare ? "#e8a0b8" : space.silk ? "#b8b4ae" : BIOME_HEX[space.biome],
                  }}
                >
                  <img src={BIOME_ART[space.biome]} alt="" className="size-full object-cover opacity-55" />
                  <span className="absolute inset-x-0 bottom-0 bg-[#efe6d8]/90 py-0.5 text-center font-mono text-[8px] uppercase text-[#3a3a3c]">
                    {spaceLabel(space)}
                  </span>
                  {on ? (
                    <span className="absolute left-1/2 top-1/3 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#efe6d8] bg-[#c47858] shadow-[0_3px_0_#8a8680]" />
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              className="rounded-full bg-[#c47858] px-6 text-[#efe6d8] hover:bg-[#b46848]"
              disabled={left <= 0 || !!trailPending}
              onClick={drawTrailCard}
            >
              {left <= 0 ? "Drawn out" : "Draw a card"}
            </Button>
            <p className="font-mono text-[11px] uppercase text-[#6a6560]">
              Deck {trailDeck.length || 12} · pawn on {spaceLabel(here)}
            </p>
          </div>
        </div>
        {trailPending ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#3a3a3c]/45 p-4">
            <div className="flex max-w-sm flex-col items-center rounded-[20px] border-4 border-[#efe6d8] bg-[#efe6d8] p-5 text-center shadow-[0_16px_0_#8a8680]">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#6a6560]">You drew</p>
              <div className="mt-3">
                <TrailCardFace card={trailPending} large />
              </div>
              <p className="mt-4 text-base text-[#3a3a3c]">{cardBlurb(trailPending, trailPawn)}</p>
              <Button className="mt-4 rounded-full bg-[#c47858] px-6 text-[#efe6d8] hover:bg-[#b46848]" onClick={resolveTrailCard}>
                {trailPending.kind === "silk" ? "Stay put" : "Hop"}
              </Button>
            </div>
          </div>
        ) : null}
        {trailFind && !trailPending ? <TrailFindFace find={trailFind} onDone={dismissTrailFind} /> : null}
      </div>
    );
  }

  return (
    <div className="relative">
      {displayPins.length ? (
        <div className="mb-3 flex justify-center pt-2">
          {displayPins.map((pin, i) => {
            const mid = (displayPins.length - 1) / 2;
            return (
              <div
                key={`${pin.speciesId}-${pin.kind}`}
                className="-ml-3 first:ml-0"
                style={{
                  transform: `rotate(${(i - mid) * 8}deg) translateY(${Math.abs(i - mid) * 6}px)`,
                  zIndex: 10 - Math.abs(i - mid),
                }}
              >
                <WallFace pin={pin} onUnpin={() => unpinDisplay(i)} />
              </div>
            );
          })}
        </div>
      ) : null}
    <div
      className="relative z-10 overflow-hidden rounded-[20px] border border-[#3a3a3c]/15 p-4 shadow-inner"
      style={{ backgroundImage: "url(/game/felt/mat.webp)", backgroundSize: "cover" }}
    >
      <div className="rounded-[16px] bg-[#c8c4be] p-4 ring-1 ring-[#3a3a3c]/10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#3a3a3c]/70">The Tarantula Shop · window / rack</p>
          <div className="flex flex-wrap gap-2">
            {shopMode === "open" ? (
              <Button size="sm" className="rounded-full bg-[#e8a0b8] text-[#3a3a3c] hover:bg-[#e090b0]" onClick={closeShop}>
                Close
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  className="rounded-full bg-[#c47858] text-[#efe6d8] hover:bg-[#b46848]"
                  disabled={closedForDay}
                  onClick={openShop}
                >
                  {closedForDay ? (sheHasTill ? "She ran today" : "Closed today") : "Open shop"}
                </Button>
                {elizabethHired ? (
                  <Button
                    size="sm"
                    className="rounded-full bg-[#5aa8a0] text-[#efe6d8] hover:bg-[#4a9890]"
                    disabled={closedForDay}
                    onClick={elizabethCover}
                  >
                    {closedForDay ? "Till's done" : "Elizabeth has the till"}
                  </Button>
                ) : null}
              </>
            )}
            <Button size="sm" variant="paper" className="rounded-full" onClick={careAll}>
              Tend all
            </Button>
            {elizabethHired ? (
              <Button size="sm" variant="secondary" className="rounded-full" onClick={enterField}>
                Trail
              </Button>
            ) : null}
          </div>
        </div>

        {sheHasTill ? (
          <p className="mb-3 rounded-[12px] bg-[#efe6d8]/80 px-3 py-2 text-sm text-[#3a3a3c]">
            Elizabeth has the till. Trail is yours until you Sleep.
          </p>
        ) : null}

        {coachBeat < 4 ? <CoachCard beat={coachBeat} onSkip={skipCoach} /> : null}

        <section className="mb-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-[#3a3a3c]/70">
            Window · listed {listedSpiders.length}/{windows}
          </p>
          <div className="flex flex-wrap gap-2">
            {groupStacks(listedSpiders).map((stack) => (
              <ChipStack key={stackKey(stack[0]!)} spiders={stack} onTop={(id) => listSpider(id, false)} />
            ))}
            {Array.from({ length: Math.max(0, windows - listedSpiders.length) }).map((_, i) => (
              <EmptySlot key={`win-empty-${i}`} label={`Window`} />
            ))}
          </div>
        </section>

        <section className="mb-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-[#3a3a3c]/70">Rack · click to list</p>
          <div className="flex flex-wrap gap-2">
            {rack.length === 0 ? (
              <EmptySlot label="Empty rack" />
            ) : (
              groupStacks(rack).map((stack) => (
                <ChipStack key={stackKey(stack[0]!)} spiders={stack} onTop={(id) => listSpider(id, true)} />
              ))
            )}
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-2">
          <section className="rounded-[14px] bg-[#efe6d8]/70 p-3">
            <p className="font-mono text-[10px] uppercase tracking-wide text-[#6a6560]">Breed pair</p>
            {pairs.length > 1 ? (
              <select className="mt-2 w-full rounded-full border border-[#3a3a3c]/20 bg-white px-2 py-1 text-sm" value={pick} onChange={(e) => setPick(Number(e.target.value))}>
                {pairs.map((p, i) => (
                  <option key={p.female.id} value={i}>
                    {spiderById(p.female.speciesId)?.common}
                  </option>
                ))}
              </select>
            ) : null}
            {pair?.female && pair.male ? (
              <div className="mt-2 flex items-end gap-2">
                <CardFace spider={pair.female} small />
                <CardFace spider={pair.male} small />
                <Button
                  size="sm"
                  className="rounded-full"
                  disabled={pair.rest > 0}
                  onClick={() => startBreed(pair.female.id, pair.male!.id)}
                >
                  {pair.rest > 0 ? `Rest ${pair.rest}` : "Introduce"}
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-sm text-[#6a6560]">Need an adult ♀ and ♂ of the same species on the rack.</p>
            )}
          </section>

          <section className="rounded-[14px] bg-[#efe6d8]/70 p-3">
            <p className="font-mono text-[10px] uppercase tracking-wide text-[#6a6560]">Across the table</p>
            {shopMode !== "open" ? (
              <p className="mt-2 text-sm text-[#6a6560]">
                {sheHasTill ? "Elizabeth already ran the line. Notes has her slip." : "Open the shop to deal, or let Elizabeth have the till."}
              </p>
            ) : queue.length === 0 ? (
              <p className="mt-2 text-sm text-[#6a6560]">No one sitting yet.</p>
            ) : (
              <div className="mt-2 space-y-3">
                {queue.map((g) => (
                  <div key={g.id}>
                    <p className="font-medium text-[#3a3a3c]">{g.name}</p>
                    <p className="text-sm text-[#6a6560]">
                      {g.kind === "browse" ? "Browsing the window" : `Wants ${spiderById(g.want)?.common ?? g.want}`}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {listedSpiders
                        .filter((s) => g.kind === "browse" || s.speciesId === g.want)
                        .map((s) => (
                          <Button key={s.id} size="sm" className="rounded-full" onClick={() => serve(g.id, s.id, fairAsk(s))}>
                            Trade {spiderById(s.speciesId)?.common}
                          </Button>
                        ))}
                      <Button size="sm" variant="ghost" className="rounded-full" onClick={() => refuse(g.id)}>
                        Pass
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="mt-4 rounded-[14px] bg-[#efe6d8]/70 p-3">
          <p className="font-mono text-[10px] uppercase tracking-wide text-[#6a6560]">Binder · pin a portrait behind the shop</p>
          <p className="mt-2 text-xs text-[#6a6560]">3 sales unlocks Window. 5 clutches unlocks Pair. Pin from Binder — it hangs in the background like the title cards. Click a hanging card to take it down.</p>
        </section>
      </div>
    </div>
    </div>
  );
}
