import { useEffect, useMemo, useState } from "react";
import { BookOpen, Bug, Eye, Home, MoreHorizontal, Store, Truck, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeltTable } from "./FeltTable";
import { FeltBinder } from "./FeltBinder";
import { HelpGuide } from "./HelpGuide";
import { RevealDeck } from "./RevealDeck";
import { TankView } from "./TankView";
import { SexMark } from "./SexMark";
import { portraitFor } from "@/lib/game/look";
import { rollStarterPacks } from "@/lib/game/packs";
import { careDue } from "@/lib/game/care";
import { bookLine } from "@/lib/game/returns";
import {
  BAY_UNITS,
  expandCost,
  loftUpgrade,
  missingUpgrade,
  nextUnlock,
  shopCaps,
  SLING_SHELF,
  usedWall,
  wallUnits,
  windowSlots,
} from "@/lib/game/progress";
import {
  countStage,
  fairAsk,
  FEEDER_CRATE,
  FEEDER_PACK,
  RENT_PER_NIGHT,
  shopSpiders,
  soldToday,
  spiderById,
  STAGE_LABEL,
  TANK_COST,
} from "@/lib/game/spiders";
import { useGame, wholesaleToday, type GameView } from "@/lib/game/store";
import { GAME_VERSION } from "@/lib/game/version";
import { cn } from "@/lib/utils";

export function GameApp() {
  const hydrate = useGame((s) => s.hydrate);
  const started = useGame((s) => s.started);
  const packChosen = useGame((s) => s.packChosen);
  const ended = useGame((s) => s.ended);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  if (!started) return <TitleScreen />;
  if (ended) return <EvictedScreen />;
  if (!packChosen) return <PackScreen />;
  return <Tabletop />;
}

function TitleScreen() {
  const startNew = useGame((s) => s.startNew);
  const hydrate = useGame((s) => s.hydrate);
  const [shop, setShop] = useState("The Tarantula Shop");
  const [keeper, setKeeper] = useState("");
  const [hasSave, setHasSave] = useState(false);
  useEffect(() => {
    setHasSave(!!localStorage.getItem("spinneret-save-v5"));
  }, []);
  const peek = [
    "/game/felt-gbb-example.webp",
    "/game/felt-curly-example.webp",
    "/game/felt-pinktoe-example.webp",
    "/game/felt-chaco-example.webp",
    "/game/felt-redknee-example.webp",
  ];
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#7a8480] text-[#3a3a3c]">
      <div className="pointer-events-none absolute -right-8 top-10 hidden sm:flex">
        {peek.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className="h-44 w-32 rounded-[14px] border-4 object-cover shadow-[0_12px_0_#8a8680]"
            style={{
              borderColor: i % 2 ? "#e8a0b8" : "#5aa8a0",
              transform: `rotate(${(i - 1.5) * 6}deg) translateY(${i % 2 ? 16 : 0}px)`,
            }}
          />
        ))}
      </div>
      <div className="relative mx-auto flex min-h-dvh max-w-6xl items-center px-5 py-12">
        <div className="w-full max-w-lg rounded-[22px] border-4 border-[#5aa8a0] bg-[#efe6d8] p-7 shadow-[0_16px_0_#7a8680]">
          <p className="font-mono text-[11px] tracking-[0.18em] text-[#5aa8a0] uppercase">
            A small shop · real species
          </p>
          <h1 className="font-display mt-2 text-4xl leading-[0.95] text-[#3a3a3c] sm:text-6xl">
            The Tarantula Shop
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-[#5a5652]">
            Open the shop, list tarantulas in the window, and breed a pair when you can. Felt
            portraits unlock as you sell and hatch — hang them on the wall or keep them in the
            binder.
          </p>
          <label className="mt-7 block text-[11px] font-medium tracking-wide text-[#6a6560] uppercase">
            Your name
            <input
              value={keeper}
              onChange={(e) => setKeeper(e.target.value)}
              placeholder="Keeper"
              className="mt-2 block h-11 w-full rounded-full border border-[#3a3a3c]/25 bg-[#f4eee6] px-4 text-base outline-none focus:border-[#5aa8a0]"
            />
          </label>
          <label className="mt-3 block text-[11px] font-medium tracking-wide text-[#6a6560] uppercase">
            Shop name
            <input
              value={shop}
              onChange={(e) => setShop(e.target.value)}
              className="mt-2 block h-11 w-full rounded-full border border-[#3a3a3c]/25 bg-[#f4eee6] px-4 text-base outline-none focus:border-[#5aa8a0]"
            />
          </label>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              className="rounded-full bg-[#c47858] px-6 text-[#efe6d8] hover:bg-[#b46848]"
              size="lg"
              onClick={() => startNew(shop, keeper)}
            >
              Open shop
            </Button>
            {hasSave ? (
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full"
                onClick={() => {
                  hydrate();
                  const s = useGame.getState();
                  if (s.started) useGame.setState({ view: "world" });
                }}
              >
                Continue
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <p className="pointer-events-none absolute bottom-4 left-5 font-mono text-[10px] tracking-[0.22em] text-[#d8dce0]/75">
        v{GAME_VERSION}
      </p>
    </main>
  );
}

function EvictedScreen() {
  const reset = useGame((s) => s.reset);
  const day = useGame((s) => s.day);
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#7a8480] px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#6a6560]">Day {day}</p>
      <h1 className="font-display mt-3 text-4xl">Locks changed</h1>
      <p className="mt-3 max-w-md text-[#5a5652]">
        Till's empty and the locks changed. Start another table when you're ready.
      </p>
      <Button className="mt-8 rounded-full" onClick={reset}>
        Start another table
      </Button>
    </main>
  );
}

function PackScreen() {
  const choosePack = useGame((s) => s.choosePack);
  const reset = useGame((s) => s.reset);
  const packs = useMemo(() => rollStarterPacks(), []);
  return (
    <main className="min-h-dvh bg-[#7a8480] px-5 py-10 text-[#3a3a3c]">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#6a6560]">
          Day 0 · gift from the truck
        </p>
        <h1 className="font-display mt-2 text-4xl">Pick a starter pack</h1>
        <p className="mt-2 max-w-lg text-sm text-[#6a6560]">
          Adult pair stays on the rack to breed. Juveniles fill the window so you can sell on day
          one.
        </p>
        <Button className="mt-4 rounded-full" size="sm" variant="ghost" onClick={reset}>
          Back
        </Button>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {packs.map((p) => {
            const ids = [...new Set(p.lines.map((l) => l.speciesId))];
            const windowJuvs = p.lines.filter((l) => l.stage === "juvenile");
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => choosePack(p)}
                className="rounded-[16px] border border-[#3a3a3c]/15 bg-[#efe6d8] p-4 text-left"
              >
                <p className="font-display text-xl">{p.label}</p>
                <div className="mt-3 flex gap-1">
                  {ids.map((id) => {
                    const spec = spiderById(id);
                    if (!spec) return null;
                    return (
                      <img
                        key={id}
                        src={portraitFor(spec, "adult")}
                        alt={spec.common}
                        className="size-12 rounded-[10px] border-2 border-[#efe6d8] object-contain bg-[#f4eee6]"
                      />
                    );
                  })}
                </div>
                <p className="mt-2 text-sm text-[#5a5652]">{p.note}</p>
                {windowJuvs.length ? (
                  <p className="mt-1 font-mono text-[10px] uppercase text-[#c47858]">
                    {windowJuvs.length} juveniles already in the window
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function Tabletop() {
  const view = useGame((s) => s.view);
  const toasts = useGame((s) => s.toasts);
  const dismissToast = useGame((s) => s.dismissToast);
  const setView = useGame((s) => s.setView);
  const desk = view !== "world" && view !== "field";
  return (
    <div className="min-h-dvh bg-[#7a8480] text-[#3a3a3c]">
      <HUD />
      <div className="mx-auto max-w-6xl overflow-visible px-3 pb-28 pt-3">
        <FeltTable />
        {desk ? (
          <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-[#4a524e]/75 px-3 pt-16 pb-24">
            <div className="w-full max-w-4xl rounded-[20px] border border-[#3a3a3c]/20 bg-[#d8dce0] p-4 shadow-[0_16px_0_#4a524e]">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-mono text-[11px] uppercase text-[#5a605c]">Table drawer</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setView("world")}
                >
                  Felt table
                </Button>
              </div>
              {view === "shop" && <ShopView />}
              {view === "loft" && <LoftView />}
              {view === "wholesale" && <WholesaleView />}
              {view === "notes" && <NotesView />}
              {view === "ledger" && <LedgerView />}
              {view === "binder" && <FeltBinder />}
            </div>
          </div>
        ) : null}
      </div>
      <Nav />
      <HelpGuide />
      <TankView />
      <RevealDeck />
      <div className="pointer-events-none fixed right-3 bottom-24 z-40 flex w-[min(100%-1.5rem,280px)] flex-col-reverse gap-2">
        {toasts.slice(-3).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => dismissToast(t.id)}
            className="pointer-events-auto rounded-[14px] border border-[#3a3a3c]/15 bg-[#d8dce0] px-3 py-2 text-left text-sm"
          >
            {t.text}
          </button>
        ))}
      </div>
    </div>
  );
}

function HUD() {
  const shopName = useGame((s) => s.shopName);
  const day = useGame((s) => s.day);
  const cash = useGame((s) => s.cash);
  const feeders = useGame((s) => s.feeders);
  const shopMode = useGame((s) => s.shopMode);
  const openedDay = useGame((s) => s.openedDay ?? 0);
  const enterField = useGame((s) => s.enterField);
  const openedBy = useGame((s) => s.openedBy);
  const elizabethHired = useGame((s) => s.elizabethHired);
  const elizabethCover = useGame((s) => s.elizabethCover);
  const profit = useGame((s) => s.profit);
  const colony = useGame((s) => s.colony);
  const customers = useGame((s) => s.customers);
  const endDay = useGame((s) => s.endDay);
  const openShop = useGame((s) => s.openShop);
  const closeShop = useGame((s) => s.closeShop);
  const careAll = useGame((s) => s.careAll);
  const setView = useGame((s) => s.setView);
  const reset = useGame((s) => s.reset);
  const [menu, setMenu] = useState(false);
  const [wipe, setWipe] = useState(false);
  const nxt = nextUnlock(profit);
  // What Tend all can actually fix right now. Hungry jars with an empty bin don't count.
  let dueN = 0;
  let hungryN = 0;
  for (const c of colony) {
    if (c.personal) continue;
    const spec = spiderById(c.speciesId);
    if (!spec) continue;
    const due = careDue(c, spec, day);
    if (!due.length) continue;
    if (due.some((k) => k !== "feed") || feeders > 0) dueN += 1;
    else hungryN += 1;
  }
  const open = shopMode === "open";
  const opened = openedDay === day;
  const sheHasTill = openedBy === "elizabeth" && opened;

  // One main button: whatever the day needs next.
  const primary = open
    ? {
        label: customers.length ? `Close shop · ${customers.length} waiting` : "Close shop",
        go: closeShop,
      }
    : !opened
      ? { label: "Open shop", go: openShop }
      : dueN
        ? { label: `Tend all · ${dueN}`, go: careAll }
        : { label: "Sleep", go: endDay };
  const side: { label: string; go: () => void }[] = [];
  if (!open && !opened && dueN) side.push({ label: `Tend · ${dueN}`, go: careAll });
  if (!open && !opened && elizabethHired)
    side.push({ label: "Elizabeth opens", go: elizabethCover });
  if (sheHasTill) side.push({ label: "Trail", go: enterField });
  if (!open && opened && dueN) side.push({ label: "Sleep", go: endDay });
  if (!open && hungryN && feeders < 1)
    side.push({ label: `Buy crickets · ${hungryN} hungry`, go: () => setView("wholesale") });

  const closeMenu = () => {
    setMenu(false);
    setWipe(false);
  };
  return (
    <header className="sticky top-0 z-30 border-b border-[#3a3a3c]/20 bg-[#6e7874]/94 text-[#efe6d8] backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={() => setView("world")}
          >
            <p className="font-display truncate text-lg leading-none">{shopName}</p>
            <p className="mt-1 truncate font-mono text-[11px] uppercase text-[#d8dce0]">
              Day {day} · {open ? "open" : opened ? "closed" : "morning"}
              {sheHasTill ? " · Elizabeth has the till" : ""} · feed {feeders} · stock{" "}
              {shopSpiders(colony).length}
            </p>
          </button>
          <span
            key={cash}
            className="chip-bump shrink-0 rounded-full border border-[#3a3a3c]/20 bg-[#c5ccc8] px-3 py-1 font-mono text-sm text-[#3a3a3c]"
          >
            {cash} chips
          </span>
          <div className="relative shrink-0">
            <button
              type="button"
              aria-label="Menu"
              aria-expanded={menu}
              onClick={() => (menu ? closeMenu() : setMenu(true))}
              className="flex size-9 items-center justify-center rounded-full text-[#efe6d8] hover:bg-white/10"
            >
              <MoreHorizontal className="size-5" />
            </button>
            {menu ? (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={closeMenu}
                />
                <div className="absolute right-0 z-50 mt-1 w-56 rounded-[14px] border border-[#3a3a3c]/20 bg-[#efe6d8] p-1.5 text-[#3a3a3c] shadow-[0_8px_0_#4a524e]">
                  {!open && !opened ? (
                    <button
                      type="button"
                      className="block w-full rounded-[10px] px-3 py-2 text-left text-sm hover:bg-[#e4d8c8]"
                      onClick={() => {
                        closeMenu();
                        endDay();
                      }}
                    >
                      Sleep without opening
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="block w-full rounded-[10px] px-3 py-2 text-left text-sm hover:bg-[#e4d8c8]"
                    onClick={() => {
                      closeMenu();
                      setView("ledger");
                    }}
                  >
                    Ledger
                  </button>
                  {wipe ? (
                    <div className="rounded-[10px] bg-[#f3e0e4] px-3 py-2">
                      <p className="text-sm">
                        Wipe this shop and start over? This can't be undone.
                      </p>
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="danger"
                          className="rounded-full"
                          onClick={() => {
                            closeMenu();
                            reset();
                          }}
                        >
                          Wipe it
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-full"
                          onClick={() => setWipe(false)}
                        >
                          Keep
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="block w-full rounded-[10px] px-3 py-2 text-left text-sm text-[#c45c6a] hover:bg-[#e4d8c8]"
                      onClick={() => setWipe(true)}
                    >
                      New table…
                    </button>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate font-mono text-[11px] uppercase text-[#d8dce0]/85">
            {nxt ? `${nxt.need} chips to ${nxt.hint}` : ""}
          </p>
          {side.map((b) => (
            <Button
              key={b.label}
              size="sm"
              variant="secondary"
              className="shrink-0 rounded-full"
              onClick={b.go}
            >
              {b.label}
            </Button>
          ))}
          <Button
            key={primary.label}
            size="sm"
            className="guest-in h-10 shrink-0 rounded-full px-5 text-base shadow-[0_3px_0_#4a524e]"
            onClick={primary.go}
          >
            {primary.label}
          </Button>
        </div>
      </div>
    </header>
  );
}

const NAV: { id: GameView; label: string; icon: typeof Store }[] = [
  { id: "world", label: "Table", icon: Home },
  { id: "loft", label: "Racks", icon: Store },
  { id: "wholesale", label: "Truck", icon: Truck },
  { id: "binder", label: "Binder", icon: BookOpen },
  { id: "notes", label: "Notes", icon: BookOpen },
];

function Nav() {
  const view = useGame((s) => s.view);
  const setView = useGame((s) => s.setView);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#3a3a3c]/20 bg-[#6e7874]/95 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-lg justify-between">
        {NAV.map((n) => {
          const Icon = n.icon;
          const on = view === n.id;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => setView(n.id)}
              className={cn(
                "flex min-w-12 flex-col items-center gap-1 rounded-full px-2 py-1 text-[11px]",
                on ? "bg-[#3a3a3c] text-[#efe6d8]" : "text-[#d8dce0]",
              )}
            >
              <Icon className="size-5" />
              {n.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function ShopView() {
  const shopMode = useGame((s) => s.shopMode);
  const openedDay = useGame((s) => s.openedDay ?? 0);
  const day = useGame((s) => s.day);
  const customers = useGame((s) => s.customers);
  const openShop = useGame((s) => s.openShop);
  return (
    <div className="space-y-3">
      <h2 className="font-display text-2xl">Front of house</h2>
      {shopMode === "open" ? (
        <p>{customers.length} at the table.</p>
      ) : openedDay === day ? (
        <p className="text-sm text-[#6a6560]">Closed for the day. Sleep to open tomorrow.</p>
      ) : (
        <Button className="rounded-full" onClick={openShop}>
          Open shop
        </Button>
      )}
    </div>
  );
}

function LoftView() {
  const colony = useGame((s) => s.colony);
  const careAll = useGame((s) => s.careAll);
  const day = useGame((s) => s.day);
  const clutches = useGame((s) => s.clutches);
  const collect = useGame((s) => s.collectClutch);
  const shopTier = useGame((s) => s.shopTier);
  const expandShop = useGame((s) => s.expandShop);
  const hireElizabeth = useGame((s) => s.hireElizabeth);
  const elizabethHired = useGame((s) => s.elizabethHired);
  const cash = useGame((s) => s.cash);
  const stats = useGame((s) => s.stats);
  const shelves = useGame((s) => s.slingShelves);
  const wall = useGame((s) => s.wall) ?? [];
  const addBay = useGame((s) => s.addBay);
  const removeBay = useGame((s) => s.removeBay);
  const cycleBay = useGame((s) => s.cycleBay);
  const buySlingShelf = useGame((s) => s.buySlingShelf);
  const listSpider = useGame((s) => s.listSpider);
  const tend = useGame((s) => s.tend);
  const openTank = useGame((s) => s.openTank);
  const caps = shopCaps(shopTier, shelves);
  const plan = loftUpgrade(shopTier);
  const miss = missingUpgrade(stats, cash, shopTier);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Racks</h2>
          <p className="text-sm text-[#6a6560]">
            Window {colony.filter((c) => c.listed).length}/{windowSlots(shopTier)} · slings{" "}
            {countStage(colony, "sling")}/{caps.sling} · juv {countStage(colony, "juvenile")}/
            {caps.juvenile} · adults {countStage(colony, "adult")}/{caps.adult}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {plan ? (
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={expandShop}
              disabled={miss.length > 0}
            >
              {plan.label} · {plan.cost}
            </Button>
          ) : null}
          {!elizabethHired ? (
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={hireElizabeth}
              disabled={shopTier < 1 || stats.hatches < 2 || cash < 35}
            >
              Hire Elizabeth · 35
            </Button>
          ) : (
            <span className="self-center text-xs text-[#6a6560]">Elizabeth: till + jars</span>
          )}
          {shelves < SLING_SHELF.max ? (
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={buySlingShelf}
              disabled={cash < SLING_SHELF.cost}
            >
              Sling shelf · {SLING_SHELF.cost}
            </Button>
          ) : null}
          <Button className="rounded-full" variant="paper" onClick={careAll}>
            <Utensils className="size-4" /> Tend all
          </Button>
        </div>
      </div>
      {clutches
        .filter((c) => c.readyDay <= day)
        .map((c) => (
          <Button key={c.femaleId} className="rounded-full" onClick={() => collect(c.femaleId)}>
            Collect sac · {spiderById(c.speciesId)?.common}
          </Button>
        ))}
      <div className="grid gap-2 sm:grid-cols-2">
        {colony
          .filter((c) => !c.personal)
          .map((sp) => {
            const spec = spiderById(sp.speciesId);
            if (!spec) return null;
            const due = careDue(sp, spec, day);
            return (
              <article
                key={sp.id}
                className="flex gap-3 rounded-[14px] border border-[#3a3a3c]/15 bg-[#eceef0] p-3"
              >
                <img
                  src={portraitFor(spec, sp.stage)}
                  alt=""
                  className="size-16 rounded-lg bg-[#efe6d8] object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {spec.common} {sp.wild ? "· wild" : ""}
                  </p>
                  <p className="font-mono text-[11px] uppercase text-[#6a6560]">
                    {STAGE_LABEL[sp.stage]} · <SexMark sex={sp.sex} /> · {fairAsk(sp)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      className="rounded-full"
                      variant="secondary"
                      onClick={() => openTank(sp.id)}
                    >
                      <Eye className="size-4" /> Look
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-full"
                      variant={sp.listed ? "secondary" : "paper"}
                      onClick={() => listSpider(sp.id, !sp.listed)}
                    >
                      {sp.listed ? "Unlist" : "List"}
                    </Button>
                    {due.map((k) => (
                      <Button
                        key={k}
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        onClick={() => tend(sp.id, k)}
                      >
                        {k}
                      </Button>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
      </div>
      <p className="text-xs text-[#6a6560]">
        Bay wall {usedWall(wall)}/{wallUnits(shopTier)} · adult bay costs {BAY_UNITS.adult} · next
        glass {expandCost(shopTier)}
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" className="rounded-full" onClick={() => addBay("sling")}>
          Add sling bay
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full"
          onClick={() => addBay("juvenile")}
        >
          Add juv bay
        </Button>
        {wall[0] ? (
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full"
            onClick={() => cycleBay(wall[0]!.id)}
          >
            Cycle bay
          </Button>
        ) : null}
        {wall[1] ? (
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full"
            onClick={() => removeBay(wall[1]!.id)}
          >
            Remove bay
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function WholesaleView() {
  const day = useGame((s) => s.day);
  const buy = useGame((s) => s.buyWholesale);
  const buyFeeders = useGame((s) => s.buyFeeders);
  const buyFeederCrate = useGame((s) => s.buyFeederCrate);
  const shopTier = useGame((s) => s.shopTier);
  const orderLot = useGame((s) => s.orderSlingLot);
  const sellLot = useGame((s) => s.sellSlingLot);
  const cash = useGame((s) => s.cash);
  const profit = useGame((s) => s.profit);
  const inbound = useGame((s) => s.inbound);
  const colony = useGame((s) => s.colony);
  const gone = soldToday(day);
  const stock = wholesaleToday(day, profit);
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl">Truck</h2>
      <p className="text-sm text-[#6a6560]">
        {cash} chips. Inbound {inbound.length}.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="paper" className="rounded-full" onClick={buyFeeders}>
          <Bug className="size-4" /> Pack · {FEEDER_PACK.qty} / {FEEDER_PACK.cost}
        </Button>
        {shopTier >= 2 ? (
          <Button variant="paper" className="rounded-full" onClick={buyFeederCrate}>
            <Bug className="size-4" /> Crate · {FEEDER_CRATE.qty} / {FEEDER_CRATE.cost}
          </Button>
        ) : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {stock.map((s) => (
          <article
            key={s.id}
            className="rounded-[14px] border border-[#3a3a3c]/15 bg-[#eceef0] p-3"
          >
            <div className="flex gap-3">
              <img
                src={portraitFor(s, "adult")}
                alt=""
                className="size-16 rounded-lg bg-[#efe6d8] object-contain"
              />
              <div>
                <p className="font-medium">{s.common}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    className="rounded-full"
                    disabled={gone === s.id}
                    onClick={() => buy(s.id, "sling")}
                  >
                    Sling {Math.round(s.price * 0.62) + TANK_COST.sling}
                  </Button>
                  <Button size="sm" className="rounded-full" onClick={() => buy(s.id, "juvenile")}>
                    Juv {Math.round(s.price * 0.9) + TANK_COST.juvenile}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => orderLot(s.id)}
                  >
                    Lot
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => sellLot(s.id)}
                  >
                    Sell 3 slings
                  </Button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function NotesView() {
  const journal = useGame((s) => s.journal);
  return (
    <div className="space-y-3">
      <h2 className="font-display text-2xl">Notes</h2>
      {journal.map((e) => (
        <article key={e.id} className="rounded-[14px] border border-[#3a3a3c]/15 bg-[#eceef0] p-3">
          <p className="font-mono text-[11px] uppercase text-[#6a6560]">Day {e.day}</p>
          <p className="font-medium">{e.title}</p>
          <p className="text-sm text-[#5a5652]">{e.body}</p>
        </article>
      ))}
    </div>
  );
}

function LedgerView() {
  const stats = useGame((s) => s.stats);
  const returning = useGame((s) => s.returning);
  const day = useGame((s) => s.day);
  const orders = useGame((s) => s.orders);
  return (
    <div className="space-y-3">
      <h2 className="font-display text-2xl">Ledger</h2>
      <p className="text-sm text-[#6a6560]">
        Sales {stats.sales} · hatches {stats.hatches} · rent {RENT_PER_NIGHT} a night
      </p>
      <h3 className="font-mono text-[11px] uppercase text-[#6a6560]">Requests</h3>
      {orders.length === 0 ? <p className="text-sm text-[#6a6560]">None open.</p> : null}
      {orders.map((o) => (
        <p key={o.id} className="text-sm">
          {o.name} wants {o.stage === "adult" ? "an adult" : "a juvenile"}{" "}
          {o.sex === "any" ? "" : o.sex === "f" ? "♀ " : "♂ "}
          {spiderById(o.speciesId)?.common} · pays {o.pay} · by day {o.dueDay}
        </p>
      ))}
      <h3 className="font-mono text-[11px] uppercase text-[#6a6560]">Coming back</h3>
      {returning.length === 0 ? (
        <p className="text-sm text-[#6a6560]">Nobody's left a number.</p>
      ) : null}
      {returning.map((g) => (
        <p key={g.id} className="text-sm">
          {bookLine(g, day)}
        </p>
      ))}
    </div>
  );
}
