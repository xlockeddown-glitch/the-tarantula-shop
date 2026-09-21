import { create } from "zustand";
import { femaleRestDays, pairRisk, restLeft } from "./breed";
import { applyTendAll, careDue, defaultWall, needsMist, needsWaterBowl, atRisk, wouldDie, type WallBay } from "./care";
import { passScore } from "./enclosure";
import { forageRoll, forageLabel, hopPawn, shuffleDeck, DRAWS_PER_DAY, PATH, spaceLabel, TRAIL, FLIPS_PER_DAY, type TrailCard } from "./field";
import { packToColony, type StarterPack } from "./packs";
import {
  BAY_UNITS,
  dailyGuests,
  displaySlots,
  emptyStats,
  expandCost,
  isUnlocked,
  loftUpgrade,
  missingUpgrade,
  shopCaps,
  SLING_SHELF,
  usedWall,
  wallUnits,
  windowSlots,
  type DisplayPin,
  type LoftStats,
} from "./progress";
import { bookDepartures, pullDue, toFloorCustomer } from "./returns";
import {
  askCeiling,
  clutchNights,
  countStage,
  fairAsk,
  FEEDER_CRATE,
  FEEDER_PACK,
  hatchExpect,
  hasStockRoom,
  husbandryNeed,
  makeSling,
  migrateOwned,
  moltIfReady,
  packLabel,
  RENT_PER_NIGHT,
  rollCustomers,
  rollShipOrders,
  saleChance,
  shipMatch,
  shopSpiders,
  shopStock,
  spiderById,
  TANK_COST,
  type Clutch,
  type JournalEntry,
  type OwnedSpider,
  type ShipOrder,
  type ShopCustomer,
  type SpiderSex,
  type SpiderStage,
  type TankSize,
  type WholesaleTicket,
} from "./spiders";
import type { ReturningGuest } from "./spiders";

export type GameView = "title" | "pack" | "world" | "shop" | "loft" | "wholesale" | "notes" | "ledger" | "field" | "binder";

const SAVE = "spinneret-save-v5";

function nid(p: string) {
  return `${p}-${Math.random().toString(36).slice(2, 8)}`;
}

function unlockTrack(list: string[] | undefined, id: string, ready: boolean) {
  const next = Array.isArray(list) ? [...list] : [];
  const unlocked = ready && !next.includes(id);
  if (unlocked) next.push(id);
  return { list: next, unlocked };
}

function sexStarterPair(colony: OwnedSpider[]): OwnedSpider[] {
  const adults = colony.filter((c) => c.stage === "adult" && !c.personal);
  if (adults.length < 2) return colony;
  const speciesId = adults[0]!.speciesId;
  const pair = adults.filter((c) => c.speciesId === speciesId).slice(0, 2);
  if (pair.length < 2) return colony;
  return colony.map((c) => {
    if (c.id === pair[0]!.id) return { ...c, sex: "f" as const };
    if (c.id === pair[1]!.id) return { ...c, sex: "m" as const };
    return c;
  });
}

function persist(s: GameState) {
  try {
    const { toasts: _t, ...rest } = s;
    localStorage.setItem(SAVE, JSON.stringify(rest));
  } catch {
    /* private mode */
  }
}

function nextCoach(beat: number | undefined, to: number) {
  const b = beat ?? 4;
  if (b >= 4) return b;
  return Math.max(b, to);
}

function buildDayLine(s: GameState): { customers: ShopCustomer[]; returning: ReturningGuest[]; signNote: string } {
  const n = dailyGuests(s.shopTier);
  const listed = s.colony.filter((c) => c.listed && !c.personal);
  const windowTake = Math.min(listed.length, Math.max(0, Math.ceil(n * 0.5)));
  const fromWindow: ShopCustomer[] = listed.slice(0, windowTake).map((sp, i) => {
    const spec = spiderById(sp.speciesId)!;
    const name = ["Hana", "Ken", "Sora", "Yui", "Taro", "Aoi"][(s.day + i) % 6]!;
    return {
      id: `win-${s.day}-${i}`,
      name,
      husbandry: spec.ow ? 8 : 5,
      want: sp.speciesId,
      offer: Math.max(8, Math.round(fairAsk(sp) * 0.92)),
      follow: i === 0,
      kind: "order" as const,
      returning: false,
      visits: 0,
    };
  });
  const { floor, rest } = pullDue(s.returning, s.day);
  const back = floor.map(toFloorCustomer);
  const used = new Set([...fromWindow, ...back].map((c) => c.want));
  const featured = (s.displayPins ?? []).map((p) => p.speciesId).filter(Boolean);
  const signWant = featured.find((id) => spiderById(id));
  const extra = rollCustomers(s.day, 6)
    .filter((c) => isUnlocked(c.want, s.profit) && !used.has(c.want))
    .slice(0, Math.max(0, n - fromWindow.length - back.length));
  let customers = [...fromWindow, ...back, ...extra].slice(0, n);
  let signNote = "";
  if (signWant) {
    const spec = spiderById(signWant)!;
    if (used.has(signWant)) {
      signNote = `Signboard: ${spec.common} already in the line.`;
    } else {
      const board: ShopCustomer = {
        id: `sign-${s.day}`,
        name: ["Mira", "Ned", "Priya", "Owen"][s.day % 4]!,
        husbandry: spec.ow ? 8 : 6,
        want: signWant,
        offer: Math.max(8, Math.round(spec.price * 0.95)),
        follow: true,
        kind: "order",
        returning: false,
        visits: 0,
      };
      if (customers.length >= n) customers = [board, ...customers.slice(0, n - 1)];
      else customers = [board, ...customers];
      signNote = `Signboard brought a ${spec.common} guest.`;
    }
  }
  return { customers, returning: rest, signNote };
}

function sheWontSell(cust: ShopCustomer, sp: OwnedSpider) {
  const spec = spiderById(sp.speciesId);
  if (!spec) return true;
  if (spec.temper === "defensive" && cust.husbandry < husbandryNeed(spec)) return true;
  return false;
}

export type GameState = {
  started: boolean;
  packChosen: boolean;
  ended: string | null;
  view: GameView;
  shopName: string;
  playerName: string;
  day: number;
  hour: number;
  cash: number;
  profit: number;
  feeders: number;
  serial: number;
  shopMode: "open" | "closed";
  openedDay: number;
  openedBy: "player" | "elizabeth" | null;
  shopTier: number;
  elizabethHired: boolean;
  slingShelves: number;
  wall: WallBay[];
  colony: OwnedSpider[];
  selectedId: string | null;
  clutches: Clutch[];
  customers: ShopCustomer[];
  served: string[];
  returning: ReturningGuest[];
  orders: ShipOrder[];
  inbound: WholesaleTicket[];
  dealsToday: number;
  journal: JournalEntry[];
  stats: LoftStats;
  toasts: { id: string; text: string }[];
  feltAlbum: string[];
  feltSales: string[];
  feltBreeds: string[];
  soldCounts: Record<string, number>;
  breedCounts: Record<string, number>;
  fieldSearched: string[];
  trailAt: number;
  trailPawn: number;
  trailDeck: TrailCard[];
  trailDraws: number;
  trailLastCard: TrailCard | null;
  trailPending: TrailCard | null;
  trailFind: { kind: "empty" | "full" | "silk" | "sling"; space: string; speciesId?: string; wild?: boolean } | null;
  displayPins: DisplayPin[];
  coachBeat: number;
  hydrate: () => void;
  startNew: (shop: string, keeper: string) => void;
  reset: () => void;
  choosePack: (pack: StarterPack) => void;
  setView: (view: GameView) => void;
  toast: (text: string) => void;
  dismissToast: (id: string) => void;
  openShop: () => void;
  closeShop: () => void;
  talkTo: (customerId: string) => void;
  tend: (id: string, kind: "feed" | "water" | "mist" | "clean") => void;
  feed: (id: string) => void;
  careAll: () => void;
  careRack: () => void;
  listSpider: (id: string, listed: boolean) => void;
  dumpListed: (id: string) => void;
  nameSpider: (id: string, name: string) => void;
  buyWholesale: (speciesId: string, stage: SpiderStage) => void;
  buyFeeders: () => void;
  buyFeederCrate: () => void;
  buySlingShelf: () => void;
  addBay: (kind: SpiderStage) => void;
  removeBay: (id: string) => void;
  cycleBay: (id: string) => void;
  orderSlingLot: (speciesId: string) => void;
  sellSlingLot: (speciesId: string) => void;
  serveCustomer: (customerId: string, spiderId: string, ask: number) => void;
  refuseCustomer: (customerId: string) => void;
  fillOrder: (orderId: string, spiderId: string) => void;
  startBreed: (femaleId: string, maleId: string) => void;
  collectClutch: (femaleId: string) => void;
  expandShop: () => void;
  hireElizabeth: () => void;
  elizabethCover: () => void;
  enterField: () => void;
  drawTrailCard: () => void;
  resolveTrailCard: () => void;
  dismissTrailFind: () => void;
  walkTrail: (dir: number) => void;
  searchField: (spotId?: string) => void;
  leaveField: () => void;
  pinDisplay: (speciesId: string, kind: "sale" | "breed") => void;
  unpinDisplay: (index: number) => void;
  skipCoach: () => void;
  endDay: () => void;
};

const blank = (): Omit<
  GameState,
  | "hydrate" | "startNew" | "reset" | "choosePack" | "setView" | "toast" | "dismissToast"
  | "openShop" | "closeShop" | "talkTo" | "tend" | "feed" | "careAll" | "careRack"
  | "listSpider" | "dumpListed" | "nameSpider" | "buyWholesale" | "buyFeeders" | "buyFeederCrate"
  | "buySlingShelf" | "addBay" | "removeBay" | "cycleBay" | "orderSlingLot" | "sellSlingLot"
  | "serveCustomer" | "refuseCustomer" | "fillOrder" | "startBreed" | "collectClutch"
  | "expandShop" | "hireElizabeth" | "elizabethCover" | "enterField" | "drawTrailCard" | "resolveTrailCard" | "dismissTrailFind" | "walkTrail" | "searchField" | "leaveField"
  | "pinDisplay" | "unpinDisplay" | "skipCoach" | "endDay"
> => ({
  started: false,
  packChosen: false,
  ended: null,
  view: "title",
  shopName: "The Tarantula Shop",
  playerName: "",
  day: 1,
  hour: 0,
  cash: 180,
  profit: 0,
  feeders: 12,
  serial: 8,
  shopMode: "closed",
  openedDay: 0,
  openedBy: null,
  shopTier: 0,
  elizabethHired: false,
  slingShelves: 1,
  wall: defaultWall(),
  colony: [],
  selectedId: null,
  clutches: [],
  customers: [],
  served: [],
  returning: [],
  orders: [],
  inbound: [],
  dealsToday: 0,
  journal: [],
  stats: emptyStats(),
  toasts: [],
  feltAlbum: [],
  feltSales: [],
  feltBreeds: [],
  soldCounts: {},
  breedCounts: {},
  fieldSearched: [],
  trailAt: 0,
  trailPawn: 0,
  trailDeck: [],
  trailDraws: 0,
  trailLastCard: null,
  trailPending: null,
  trailFind: null,
  displayPins: [],
  coachBeat: 0,
});

export const useGame = create<GameState>((set, get) => ({
  ...blank(),

  hydrate: () => {
    try {
      const raw = localStorage.getItem(SAVE);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<GameState>;
      const day = parsed.day ?? 1;
      const colony = sexStarterPair(
        ((parsed.colony as OwnedSpider[] | undefined) ?? []).map((c, i) => migrateOwned({ ...c, wild: (c as OwnedSpider).wild }, day, i + 1)),
      );
      set({
        ...blank(),
        ...parsed,
        colony,
        wall: Array.isArray(parsed.wall) && parsed.wall.length ? parsed.wall : defaultWall(),
        stats: parsed.stats ?? emptyStats(),
        journal: Array.isArray(parsed.journal) ? parsed.journal : [],
        returning: Array.isArray(parsed.returning) ? parsed.returning : [],
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        inbound: Array.isArray(parsed.inbound) ? parsed.inbound : [],
        clutches: Array.isArray(parsed.clutches) ? parsed.clutches : [],
        feltAlbum: Array.isArray(parsed.feltAlbum) ? parsed.feltAlbum : [],
        feltSales: Array.isArray(parsed.feltSales) ? parsed.feltSales : [],
        feltBreeds: Array.isArray(parsed.feltBreeds) ? parsed.feltBreeds : [],
        soldCounts: parsed.soldCounts ?? {},
        breedCounts: parsed.breedCounts ?? {},
        fieldSearched: Array.isArray(parsed.fieldSearched) ? parsed.fieldSearched : [],
        trailAt: parsed.trailAt ?? 0,
        trailPawn: parsed.trailPawn ?? 0,
        trailDeck: Array.isArray(parsed.trailDeck) ? parsed.trailDeck : [],
        trailDraws: parsed.trailDraws ?? 0,
        trailLastCard: parsed.trailLastCard ?? null,
        trailPending: parsed.trailPending ?? null,
        trailFind: parsed.trailFind ?? null,
        displayPins: Array.isArray(parsed.displayPins) ? parsed.displayPins : [],
        coachBeat: typeof parsed.coachBeat === "number" ? parsed.coachBeat : 4,
        elizabethHired: parsed.elizabethHired ?? false,
        slingShelves: parsed.slingShelves ?? 1,
        shopTier: parsed.shopTier ?? 0,
        openedDay: parsed.openedDay ?? 0,
        openedBy: parsed.openedBy === "elizabeth" || parsed.openedBy === "player" ? parsed.openedBy : null,
        toasts: [],
        customers: parsed.shopMode === "open" ? parsed.customers ?? [] : [],
        view: parsed.started ? "world" : "title",
      });
    } catch {
      /* ignore */
    }
  },

  startNew: (shop, keeper) => {
    set({
      ...blank(),
      started: true,
      packChosen: false,
      shopName: shop.trim() || "The Tarantula Shop",
      playerName: keeper.trim(),
      view: "pack",
    });
    persist({ ...get() });
  },

  reset: () => {
    try {
      localStorage.removeItem(SAVE);
    } catch {
      /* */
    }
    set({ ...blank() });
  },

  choosePack: (pack) => {
    const colony = packToColony(pack);
    set({
      packChosen: true,
      colony,
      serial: colony.length + 1,
      view: "world",
      journal: [
        {
          id: nid("j"),
          day: 1,
          title: pack.label,
          body: pack.note,
        },
      ],
    });
    persist({ ...get() });
  },

  setView: (view) => set({ view }),

  toast: (text) => {
    const id = nid("t");
    set((s) => ({ toasts: [...s.toasts.slice(-4), { id, text }] }));
    setTimeout(() => get().dismissToast(id), 3200);
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  skipCoach: () => {
    set({ coachBeat: 4 });
    persist({ ...get() });
  },

  openShop: () => {
    const s = get();
    if (s.shopMode === "open") return;
    if (s.openedDay === s.day) {
      get().toast("Sign already flipped today. Sleep to open again.");
      return;
    }
    if (!s.colony.length) {
      get().toast("Pick a starter pack first.");
      return;
    }
    const { customers, returning, signNote } = buildDayLine(s);
    const fromWindow = customers.filter((c) => c.id.startsWith("win-")).length;
    set({ shopMode: "open", openedDay: s.day, openedBy: "player", customers, served: [], hour: 0, returning, view: "world", coachBeat: nextCoach(s.coachBeat, 1) });
    get().toast(
      signNote ||
        (fromWindow
          ? `${fromWindow} guest${fromWindow === 1 ? "" : "s"} here for the window.`
          : "Sign flipped. List something if you want a sale."),
    );
    persist({ ...get() });
  },

  closeShop: () => {
    const s = get();
    if (s.shopMode !== "open") return;
    let served = [...s.served];
    let cash = s.cash;
    let colony = s.colony;
    let deals = s.dealsToday;
    let stats = s.stats;
    if (s.elizabethHired) {
      for (const cust of s.customers) {
        if (served.includes(cust.id)) continue;
        const matches =
          cust.kind === "browse"
            ? shopSpiders(colony).filter((c) => c.listed)
            : listedMatches(colony, cust.want);
        const pick = matches[0];
        if (!pick) continue;
        colony = colony.filter((c) => c.id !== pick.id);
        cash += cust.offer;
        deals += 1;
        served.push(cust.id);
        stats = { ...stats, sales: stats.sales + 1 };
      }
    }
    const leftovers = s.customers.filter((c) => !served.includes(c.id));
    const { book, noted, dropped } = bookDepartures(s.returning, leftovers, s.day);
    let feeders = s.feeders;
    let tended = 0;
    let hungry = 0;
    if (s.elizabethHired) {
      const care = applyTendAll(colony, feeders, s.day);
      colony = care.colony;
      feeders = care.feeders;
      tended = care.tended;
      hungry = care.hungry;
    }
    set({
      shopMode: "closed",
      customers: [],
      returning: book,
      colony,
      cash,
      feeders,
      dealsToday: deals,
      stats,
      served,
      view: "world",
      coachBeat: nextCoach(s.coachBeat, 2),
    });
    const sold = served.length - s.served.length;
    if (s.elizabethHired) {
      const bits = [
        sold ? `rang ${sold}` : null,
        tended ? `tended ${tended}` : null,
        hungry ? `${hungry} still hungry (bin empty)` : null,
      ].filter(Boolean);
      get().toast(bits.length ? `Elizabeth ${bits.join(", ")}.` : "Elizabeth: till's quiet, racks current.");
    } else if (dropped) get().toast(`${dropped} stopped checking.`);
    else if (noted) get().toast(`${noted} will look in again. Prep or sleep.`);
    else get().toast("Sign says closed. Prep the racks.");
    persist({ ...get() });
  },

  talkTo: (customerId) => {
    const s = get();
    const cust = s.customers.find((c) => c.id === customerId);
    if (!cust) return;
    const matches =
      cust.kind === "browse"
        ? shopSpiders(s.colony).filter((c) => c.listed)
        : listedMatches(s.colony, cust.want);
    if (matches.length) {
      get().serveCustomer(cust.id, matches[0]!.id, cust.offer);
      return;
    }
    const spec = spiderById(cust.want);
    get().toast(
      cust.kind === "browse"
        ? `${cust.name} is just looking.`
        : `${cust.name} wants ${spec?.common ?? "a species"}. Close up to buy or breed it.`,
    );
  },

  careRack: () => {
    get().toast("Walk up to a tank. E on the jar.");
  },

  tend: (id, kind) => {
    const s = get();
    const sp = s.colony.find((c) => c.id === id);
    if (!sp || sp.personal) return;
    const spec = spiderById(sp.speciesId);
    if (!spec) return;
    if (kind === "water" && !needsWaterBowl(spec)) {
      get().toast("No water dish in this crib.");
      return;
    }
    if (kind === "mist" && !needsMist(spec)) {
      get().toast("This one isn't a mist tank.");
      return;
    }
    if (kind === "feed") {
      if (s.feeders < 1) {
        get().toast("Feeder bin is empty.");
        return;
      }
      if ((sp.fedDay ?? 0) === s.day) {
        get().toast("Already fed.");
        return;
      }
    }
    set({
      feeders: kind === "feed" ? s.feeders - 1 : s.feeders,
      hour: Math.min(8, s.hour + 1),
      colony: s.colony.map((c) => {
        if (c.id !== id) return c;
        const next = { ...c, caredDay: s.day };
        if (kind === "feed") next.fedDay = s.day;
        if (kind === "water") next.waterDay = s.day;
        if (kind === "mist") next.mistDay = s.day;
        if (kind === "clean") next.cleanDay = s.day;
        return next;
      }),
    });
    const label = kind === "feed" ? "Fed" : kind === "water" ? "Filled the dish" : kind === "mist" ? "Misted" : "Wiped the glass";
    get().toast(`${label} · ${spec.common}`);
    persist({ ...get() });
  },

  feed: (id) => {
    get().tend(id, "feed");
  },

  careAll: () => {
    const s = get();
    const care = applyTendAll(s.colony, s.feeders, s.day);
    set({ colony: care.colony, feeders: care.feeders });
    get().toast(
      care.tended
        ? `Tended ${care.tended} jar${care.tended === 1 ? "" : "s"}.${care.hungry ? ` ${care.hungry} still hungry.` : ""}`
        : "Racks are current.",
    );
    persist({ ...get() });
  },

  listSpider: (id, listed) => {
    const s = get();
    const sp = s.colony.find((c) => c.id === id);
    if (!sp || sp.personal || sp.inBreed) return;
    if (listed && sp.wild && sp.stage === "sling") {
      get().toast("Wild slings stay on the rack until they molt.");
      return;
    }
    if (listed) {
      const cap = windowSlots(s.shopTier);
      const used = s.colony.filter((c) => c.listed && c.id !== id && !c.personal).length;
      if (used >= cap) {
        get().toast(`Shop window is ${used}/${cap}. Unlist one first.`);
        return;
      }
    }
    set({
      colony: s.colony.map((c) =>
        c.id === id ? { ...c, listed, listedDay: listed ? s.day : undefined } : c,
      ),
    });
    get().toast(listed ? "In the window." : "Back on the rack.");
    persist({ ...get() });
  },

  dumpListed: (id) => {
    const s = get();
    const sp = s.colony.find((c) => c.id === id);
    if (!sp || !sp.listed) return;
    const daysOut = s.day - (sp.listedDay ?? 0);
    if (daysOut < 2) {
      get().toast("Give the window two days before the truck takes it.");
      return;
    }
    const pay = Math.max(6, Math.round(fairAsk(sp) * 0.7));
    set({
      cash: s.cash + pay,
      colony: s.colony.filter((c) => c.id !== id),
      stats: { ...s.stats, sales: s.stats.sales + 1 },
    });
    get().toast(`Truck took it for ${pay}. Pane is free.`);
    persist({ ...get() });
  },

  nameSpider: (id, name) => {
    set((s) => ({ colony: s.colony.map((c) => (c.id === id ? { ...c, name } : c)) }));
    persist({ ...get() });
  },

  buyWholesale: (speciesId, stage) => {
    const s = get();
    const spec = spiderById(speciesId);
    if (!spec) return;
    if (!isUnlocked(speciesId, s.profit)) {
      get().toast("The truck won't carry that until the shop is known.");
      return;
    }
    const caps = shopCaps(s.shopTier, s.slingShelves);
    if (!hasStockRoom(s.colony, stage, caps)) {
      get().toast(`No ${stage} crib. Expand the loft.`);
      return;
    }
    let price = spec.price;
    if (stage === "sling") price = Math.round(price * 0.62);
    if (stage === "juvenile") price = Math.round(price * 0.9);
    price += TANK_COST[stage];
    if (s.cash < price) {
      get().toast(`Need ${price}.`);
      return;
    }
    const serial = s.serial;
    const sex: SpiderSex = stage === "sling" ? "u" : Math.random() < 0.5 ? "f" : "m";
    const born = makeSling(speciesId, s.day, stage, serial, sex);
    const bought: OwnedSpider = {
      ...born,
      stage,
      tank: stage as TankSize,
      sex,
      days: stage === "adult" ? 20 : 0,
      enclosureScore: 8,
    };
    set({
      cash: s.cash - price,
      serial: serial + 1,
      colony: [...s.colony, bought],
      selectedId: bought.id,
    });
    get().toast(`${spec.common} on the rack.`);
    persist({ ...get() });
  },

  buyFeeders: () => {
    const s = get();
    if (s.cash < FEEDER_PACK.cost) {
      get().toast("Can't cover the cricket pack.");
      return;
    }
    set({ cash: s.cash - FEEDER_PACK.cost, feeders: s.feeders + FEEDER_PACK.qty });
    persist({ ...get() });
  },

  buyFeederCrate: () => {
    const s = get();
    if (s.shopTier < 2) {
      get().toast("Crate comes with the back counter.");
      return;
    }
    if (s.cash < FEEDER_CRATE.cost) {
      get().toast("Need more chips for a crate.");
      return;
    }
    set({ cash: s.cash - FEEDER_CRATE.cost, feeders: s.feeders + FEEDER_CRATE.qty });
    get().toast(`+${FEEDER_CRATE.qty} feeders.`);
    persist({ ...get() });
  },

  buySlingShelf: () => {
    const s = get();
    if (s.slingShelves >= SLING_SHELF.max) {
      get().toast("No wall left for another vial rack.");
      return;
    }
    if (s.cash < SLING_SHELF.cost) {
      get().toast(`Shelf is ${SLING_SHELF.cost}.`);
      return;
    }
    set({ cash: s.cash - SLING_SHELF.cost, slingShelves: s.slingShelves + 1 });
    get().toast(`Vial shelf up. +${SLING_SHELF.extra} sling cups.`);
    persist({ ...get() });
  },

  addBay: (kind) => {
    const s = get();
    const cap = wallUnits(s.shopTier);
    if (usedWall(s.wall) + BAY_UNITS[kind] > cap) {
      get().toast(`Wall is ${usedWall(s.wall)}/${cap} units. Need ${BAY_UNITS[kind]} for a ${kind}.`);
      return;
    }
    set({ wall: [...s.wall, { id: nid("bay"), kind }] });
    persist({ ...get() });
  },

  removeBay: (id) => {
    const s = get();
    if (s.wall.length <= 1) {
      get().toast("Keep at least one crib on the wall.");
      return;
    }
    set({ wall: s.wall.filter((b) => b.id !== id) });
    persist({ ...get() });
  },

  cycleBay: (id) => {
    const s = get();
    const order: SpiderStage[] = ["sling", "juvenile", "adult"];
    const nextWall = s.wall.map((b) => {
      if (b.id !== id) return b;
      const nxt = order[(order.indexOf(b.kind) + 1) % order.length]!;
      return { ...b, kind: nxt };
    });
    if (usedWall(nextWall) > wallUnits(s.shopTier)) {
      get().toast("Not enough wall for a bigger crib. Split or expand.");
      return;
    }
    set({ wall: nextWall });
    persist({ ...get() });
  },

  orderSlingLot: (speciesId) => {
    const s = get();
    const spec = spiderById(speciesId);
    if (!spec || !isUnlocked(speciesId, s.profit)) {
      get().toast("Truck won't book that yet.");
      return;
    }
    const qty = 3;
    const unit = Math.round(spec.price * 0.5) + TANK_COST.sling;
    const paid = unit * qty;
    if (s.cash < paid) {
      get().toast(`Lot is ${paid}.`);
      return;
    }
    if (s.inbound.length >= 4) {
      get().toast("Four slips on the hook is enough.");
      return;
    }
    const ticket: WholesaleTicket = {
      id: nid("wh"),
      speciesId,
      qty,
      arriveDay: s.day + 2,
      paid,
    };
    set({ cash: s.cash - paid, inbound: [...s.inbound, ticket] });
    get().toast(`${qty} ${spec.common} slings booked. Truck in 2 mornings.`);
    persist({ ...get() });
  },

  sellSlingLot: (speciesId) => {
    const s = get();
    const spec = spiderById(speciesId);
    const lot = shopSpiders(s.colony).filter((c) => c.speciesId === speciesId && c.stage === "sling" && !c.inBreed);
    if (!spec || lot.length < 3) {
      get().toast("Need 3 slings of one species to sell a lot.");
      return;
    }
    const take = lot.slice(0, 3);
    const ids = new Set(take.map((c) => c.id));
    const pay = Math.round(spec.price * 0.45) * 3;
    set({
      cash: s.cash + pay,
      profit: s.profit + pay,
      stats: { ...s.stats, sales: s.stats.sales + 1 },
      colony: s.colony.filter((c) => !ids.has(c.id)),
    });
    get().toast(`Sold 3 ${spec.common} slings wholesale · ${pay}.`);
    persist({ ...get() });
  },

  serveCustomer: (customerId, spiderId, ask) => {
    const s = get();
    const cust = s.customers.find((c) => c.id === customerId);
    const sp = s.colony.find((c) => c.id === spiderId);
    if (!cust || !sp || sp.personal || sp.inBreed) return;
    const spec = spiderById(sp.speciesId);
    if (!spec) return;
    const skill = husbandryNeed(spec);
    const askedForIt = cust.want === sp.speciesId;
    if (spec.ow && !askedForIt && cust.husbandry < skill) {
      get().toast(`${cust.name} isn't ready for an old-world. Keep it for a specialist.`);
      return;
    }
    const fair = fairAsk(sp);
    const ceiling = askCeiling(fair, cust.offer);
    if (ask > ceiling) {
      set({
        served: [...s.served, customerId],
        customers: s.customers.filter((c) => c.id !== customerId),
      });
      get().toast(`${cust.name} walked. ${ceiling} was the ceiling.`);
      persist({ ...get() });
      return;
    }
    const chance = saleChance(ask, fair);
    const ok = ask <= cust.offer || ask <= fair || (askedForIt && ask <= ceiling) || Math.random() < chance;
    if (!ok) {
      set({
        served: [...s.served, customerId],
        customers: s.customers.filter((c) => c.id !== customerId),
      });
      get().toast(`${cust.name} walked. Ask was high.`);
      persist({ ...get() });
      return;
    }
    const soldCounts = { ...s.soldCounts };
    soldCounts[sp.speciesId] = (soldCounts[sp.speciesId] ?? 0) + 1;
    const sale = unlockTrack(s.feltSales ?? [], sp.speciesId, (soldCounts[sp.speciesId] ?? 0) >= 3);
    set({
      cash: s.cash + ask,
      profit: s.profit + ask,
      dealsToday: s.dealsToday + 1,
      stats: { ...s.stats, sales: s.stats.sales + 1 },
      served: [...s.served, customerId],
      customers: s.customers.filter((c) => c.id !== customerId),
      colony: s.colony.filter((c) => c.id !== spiderId),
      soldCounts,
      feltSales: sale.list,
      feltAlbum: sale.unlocked ? [...new Set([...(s.feltAlbum ?? []), sp.speciesId])] : s.feltAlbum,
      journal: [
        {
          id: nid("j"),
          day: s.day,
          title: `${cust.name} took ${spec.common}`,
          body: `${sp.tag} left in a ${packLabel(spec)}. ${ask} chips.`,
        },
        ...s.journal,
      ].slice(0, 40),
    });
    get().toast(
      sale.unlocked
        ? `Window card · ${spec.common}`
        : `${cust.name} paid ${ask} chips · ${soldCounts[sp.speciesId]}/3 toward Window card.`,
    );
    persist({ ...get() });
  },

  refuseCustomer: (customerId) => {
    const s = get();
    set({
      served: [...s.served, customerId],
      customers: s.customers.filter((c) => c.id !== customerId),
    });
    persist({ ...get() });
  },

  fillOrder: (orderId, spiderId) => {
    const s = get();
    const order = s.orders.find((o) => o.id === orderId);
    const sp = s.colony.find((c) => c.id === spiderId);
    if (!order || !sp || !shipMatch(sp, order)) {
      get().toast("That animal doesn't match the slip.");
      return;
    }
    const spec = spiderById(sp.speciesId);
    set({
      cash: s.cash + order.pay,
      profit: s.profit + order.pay,
      stats: { ...s.stats, sales: s.stats.sales + 1 },
      colony: s.colony.filter((c) => c.id !== spiderId),
      orders: s.orders.filter((o) => o.id !== orderId),
      journal: [
        {
          id: nid("j"),
          day: s.day,
          title: `Shipped ${spec?.common ?? "stock"}`,
          body: `${order.name} paid ${order.pay}. Packed ${order.pack}.`,
        },
        ...s.journal,
      ].slice(0, 40),
    });
    persist({ ...get() });
  },

  startBreed: (femaleId, maleId) => {
    const s = get();
    const f = s.colony.find((c) => c.id === femaleId);
    const m = s.colony.find((c) => c.id === maleId);
    if (!f || !m) return;
    const spec = spiderById(f.speciesId);
    if (!spec || f.speciesId !== m.speciesId) {
      get().toast("Same species only.");
      return;
    }
    if (f.stage !== "adult" || m.stage !== "adult" || f.sex !== "f" || m.sex !== "m") {
      get().toast("Need an adult female and male.");
      return;
    }
    if (f.listed || m.listed) {
      get().toast("Pull them from the window first.");
      return;
    }
    if (f.personal || m.personal || f.inBreed || m.inBreed) return;
    if (restLeft(f, s.day) > 0) {
      get().toast(`She rests ${restLeft(f, s.day)} more night${restLeft(f, s.day) === 1 ? "" : "s"}.`);
      return;
    }
    if (s.clutches.some((c) => c.femaleId === f.id)) {
      get().toast("She already has a sac going.");
      return;
    }
    const risk = pairRisk(f, m, spec);
    if (Math.random() < risk.fail) {
      const ate = Math.random() < risk.eat;
      set({
        colony: s.colony
          .filter((c) => !(ate && c.id === m.id))
          .map((c) =>
            c.id === f.id
              ? { ...c, mates: (c.mates ?? 0) + 1, lastMateId: m.id, breedRestUntil: s.day + femaleRestDays(spec) }
              : c.id === m.id
                ? { ...c, mates: (c.mates ?? 0) + 1, spentUntil: s.day + 4 }
                : c,
          ),
      });
      get().toast(ate ? "Introduce failed. She ate him." : "Introduce failed. They refused.");
      persist({ ...get() });
      return;
    }
    const ate = Math.random() < risk.eat;
    const nights = clutchNights(spec);
    const clutch: Clutch = {
      speciesId: f.speciesId,
      readyDay: s.day + nights,
      femaleId: f.id,
      maleId: m.id,
      ateMale: ate,
      expect: hatchExpect(f.speciesId),
      collapse: risk.sacCollapse,
    };
    set({
      clutches: [...s.clutches, clutch],
      colony: s.colony
        .filter((c) => !(ate && c.id === m.id))
        .map((c) => {
          if (c.id === f.id) {
            return {
              ...c,
              listed: false,
              inBreed: true,
              mates: (c.mates ?? 0) + 1,
              lastMateId: m.id,
              breedRestUntil: s.day + nights + femaleRestDays(spec),
            };
          }
          if (c.id === m.id) {
            return { ...c, listed: false, mates: (c.mates ?? 0) + 1, spentUntil: s.day + 6 };
          }
          return c;
        }),
    });
    get().toast(ate ? `Sac started. Male didn't make it. ${nights} night${nights === 1 ? "" : "s"}.` : `Sac started. ${nights} night${nights === 1 ? "" : "s"}.`);
    persist({ ...get() });
  },

  collectClutch: (femaleId) => {
    const s = get();
    const clutch = s.clutches.find((c) => c.femaleId === femaleId && c.readyDay <= s.day);
    if (!clutch) return;
    const spec = spiderById(clutch.speciesId);
    if (Math.random() < (clutch.collapse ?? 0)) {
      set({
        clutches: s.clutches.filter((c) => c.femaleId !== femaleId),
        colony: s.colony.map((c) => (c.id === femaleId ? { ...c, inBreed: false } : c)),
      });
      get().toast("The sac collapsed.");
      persist({ ...get() });
      return;
    }
    const caps = shopCaps(s.shopTier, s.slingShelves);
    const room = caps.sling - countStage(s.colony, "sling");
    const n = Math.max(1, Math.min(clutch.expect, Math.max(0, room)));
    if (n < 1) {
      get().toast("Sling cups are full. Sell or expand first.");
      return;
    }
    let serial = s.serial;
    let colony = s.colony.map((c) => (c.id === femaleId ? { ...c, inBreed: false } : c));
    for (let i = 0; i < n; i++) {
      const sl = makeSling(clutch.speciesId, s.day, "sling", serial);
      colony = [...colony, { ...sl, enclosureScore: 6 }];
      serial += 1;
    }
    const counts = { ...s.breedCounts };
    counts[clutch.speciesId] = (counts[clutch.speciesId] ?? 0) + 1;
    const pair = unlockTrack(s.feltBreeds ?? [], clutch.speciesId, (counts[clutch.speciesId] ?? 0) >= 5);
    set({
      clutches: s.clutches.filter((c) => c.femaleId !== femaleId),
      colony,
      serial,
      breedCounts: counts,
      feltBreeds: pair.list,
      feltAlbum: pair.unlocked ? [...new Set([...(s.feltAlbum ?? []), clutch.speciesId])] : s.feltAlbum,
      stats: { ...s.stats, hatches: s.stats.hatches + 1 },
      journal: [
        {
          id: nid("j"),
          day: s.day,
          title: pair.unlocked ? `Pair card · ${spec?.common}` : `${spec?.common ?? "Sac"} hatched`,
          body: pair.unlocked
            ? `${n} slings. Fifth clutch — the pair card is in the binder.`
            : `${n} slings. Set vials on the bench if you want them listed.`,
        },
        ...s.journal,
      ].slice(0, 40),
    });
    get().toast(
      pair.unlocked
        ? `Pair card · ${spec?.common}`
        : `${n} slings pulled · ${counts[clutch.speciesId]}/5 toward Pair card.`,
    );
    persist({ ...get() });
  },

  expandShop: () => {
    const s = get();
    if (s.shopTier >= 3) {
      get().toast("Loft is as wide as the lease.");
      return;
    }
    const miss = missingUpgrade(s.stats, s.cash, s.shopTier);
    if (miss.length) {
      get().toast(`Landlord wants ${miss[0]}.`);
      return;
    }
    const next = loftUpgrade(s.shopTier);
    const cost = next?.cost ?? expandCost(s.shopTier);
    set({ cash: s.cash - cost, shopTier: s.shopTier + 1 });
    get().toast(next ? `${next.label} overnight.` : "Another bay of racks.");
    persist({ ...get() });
  },

  hireElizabeth: () => {
    const s = get();
    if (s.elizabethHired) {
      get().toast("Elizabeth already has a key.");
      return;
    }
    if ((s.shopTier ?? 0) < 1 || (s.stats?.hatches ?? 0) < 2) {
      get().toast("She'll come after the extra glass and a second hatch.");
      return;
    }
    if ((s.cash ?? 0) < 35) {
      get().toast("Elizabeth wants 35 to start.");
      return;
    }
    const journal = Array.isArray(s.journal) ? s.journal : [];
    set({
      cash: s.cash - 35,
      elizabethHired: true,
      journal: [
        {
          id: nid("j"),
          day: s.day ?? 1,
          title: "Elizabeth",
          body: "She can run the till so you can leave. Fill the window, then hand her the day.",
        },
        ...journal,
      ].slice(0, 40),
    });
    get().toast("Elizabeth hangs her coat. Fill the window, then she can have the till.");
    try {
      persist({ ...get() });
    } catch {
      get().toast("Saved in memory. Binder will catch up next refresh.");
    }
  },

  elizabethCover: () => {
    const s = get();
    if (!s.elizabethHired) {
      get().toast("Hire Elizabeth first.");
      return;
    }
    if (s.shopMode === "open") {
      get().toast("Close first, or finish the line yourself.");
      return;
    }
    if (s.openedDay === s.day) {
      get().toast("Someone already ran today. Sleep.");
      return;
    }
    if (!s.colony.length) {
      get().toast("Pick a starter pack first.");
      return;
    }
    const { customers, returning, signNote } = buildDayLine(s);
    let colony = s.colony;
    let cash = s.cash;
    let profit = s.profit;
    let deals = s.dealsToday;
    let stats = s.stats;
    let soldCounts = { ...s.soldCounts };
    let feltSales = s.feltSales ?? [];
    let feltAlbum = s.feltAlbum ?? [];
    let sold = 0;
    let refused = 0;
    const taken = new Set<string>();
    const soldCust = new Set<string>();
    for (const cust of customers) {
      const matches =
        cust.kind === "browse"
          ? shopSpiders(colony).filter((c) => c.listed && !taken.has(c.id))
          : listedMatches(colony, cust.want).filter((c) => !taken.has(c.id));
      const pick = matches.find((sp) => !sheWontSell(cust, sp));
      if (!pick) {
        if (matches.length) refused += 1;
        continue;
      }
      taken.add(pick.id);
      soldCust.add(cust.id);
      cash += cust.offer;
      profit += cust.offer;
      deals += 1;
      sold += 1;
      stats = { ...stats, sales: stats.sales + 1 };
      soldCounts[pick.speciesId] = (soldCounts[pick.speciesId] ?? 0) + 1;
      const sale = unlockTrack(feltSales, pick.speciesId, (soldCounts[pick.speciesId] ?? 0) >= 3);
      feltSales = sale.list;
      if (sale.unlocked) feltAlbum = [...new Set([...feltAlbum, pick.speciesId])];
    }
    colony = colony.filter((c) => !taken.has(c.id));
    const leftoverGuests = customers.filter((c) => !soldCust.has(c.id));
    const { book, noted, dropped } = bookDepartures(returning, leftoverGuests, s.day);
    const care = applyTendAll(colony, s.feeders, s.day);
    colony = care.colony;
    const journal = [
      {
        id: nid("j"),
        day: s.day,
        title: "Elizabeth's slip",
        body: [
          sold ? `sold ${sold}` : "sold none",
          refused ? `wouldn't pass ${refused} hot ones` : null,
          care.tended ? `tended ${care.tended}` : "jars current",
          care.hungry ? `${care.hungry} still hungry` : null,
          signNote || null,
        ]
          .filter(Boolean)
          .join(" · "),
      },
      ...s.journal,
    ].slice(0, 40);
    set({
      shopMode: "closed",
      openedDay: s.day,
      openedBy: "elizabeth",
      customers: [],
      returning: book,
      colony,
      cash,
      profit,
      feeders: care.feeders,
      dealsToday: deals,
      stats,
      soldCounts,
      feltSales,
      feltAlbum,
      served: [],
      journal,
      view: "world",
      coachBeat: nextCoach(s.coachBeat, 2),
    });
    const bits = [
      sold ? `sold ${sold}` : "till quiet",
      refused ? `passed ${refused} aggressive` : null,
      care.tended ? `tended ${care.tended}` : null,
      care.hungry ? `${care.hungry} hungry (bin empty)` : null,
    ].filter(Boolean);
    get().toast(`Elizabeth ${bits.join(", ")}. Trail is open.`);
    if (dropped) get().toast(`${dropped} stopped checking.`);
    else if (noted) get().toast(`${noted} will look in again.`);
    persist({ ...get() });
  },

  enterField: () => {
    const s = get();
    if (!s.elizabethHired) {
      get().toast("Hire Elizabeth before you leave the table.");
      return;
    }
    if (s.openedBy !== "elizabeth" || s.openedDay !== s.day) {
      if (s.openedBy === "player" && s.openedDay === s.day) {
        get().toast("You ran the line. Sleep, or let her cover tomorrow.");
      } else {
        get().toast("Fill the window, then let Elizabeth have the till.");
      }
      return;
    }
    set({ view: "field" });
    get().toast("Draw a color. Three cards, then home.");
  },

  drawTrailCard: () => {
    const s = get();
    if (s.view !== "field") {
      get().toast("Leave the shop first.");
      return;
    }
    if (s.trailPending) {
      get().toast("Hop that card first.");
      return;
    }
    if ((s.trailDraws ?? 0) >= DRAWS_PER_DAY) {
      get().toast("Three cards today. Sleep and draw again.");
      return;
    }
    let deck = [...(s.trailDeck ?? [])];
    if (!deck.length) deck = shuffleDeck();
    const card = deck.shift();
    if (!card) return;
    set({ trailDeck: deck, trailLastCard: card, trailPending: card });
    persist({ ...get() });
  },

  resolveTrailCard: () => {
    const s = get();
    const card = s.trailPending;
    if (!card) return;
    const from = s.trailPawn ?? 0;
    const hop = hopPawn(from, card);
    const space = PATH[hop.to] ?? PATH[0]!;
    let trailDraws = (s.trailDraws ?? 0) + 1;
    if (hop.stuck) trailDraws = DRAWS_PER_DAY;

    if (hop.stuck) {
      set({
        trailDraws,
        trailPawn: hop.to,
        trailPending: null,
        trailFind: { kind: "silk", space: spaceLabel(space) },
      });
      persist({ ...get() });
      return;
    }

    const caps = shopCaps(s.shopTier, s.slingShelves);
    const slings = s.colony.filter((c) => c.stage === "sling" && !c.personal).length;
    const landmark = !!space.landmark && card.kind === "picture";
    const chance = space.rare || card.kind === "print" ? 1 : landmark ? 0.72 : card.double ? 0.5 : 0.34;
    const find = slings >= caps.sling
      ? null
      : forageRoll(s.profit, s.serial, s.day, space.biome, {
          chance,
          forceWild: !!(space.rare || card.kind === "print"),
        });

    let pawn = hop.to;
    let looped = false;
    if (pawn >= PATH.length - 1) {
      pawn = 0;
      looped = true;
    }
    const at = looped ? `${spaceLabel(space)} · back to Yard` : spaceLabel(space);

    if (slings >= caps.sling) {
      set({
        trailDraws,
        trailPawn: pawn,
        trailPending: null,
        trailFind: { kind: "full", space: at },
      });
      persist({ ...get() });
      return;
    }
    if (!find) {
      set({
        trailDraws,
        trailPawn: pawn,
        trailPending: null,
        trailFind: { kind: "empty", space: at },
      });
      persist({ ...get() });
      return;
    }
    set({
      trailDraws,
      trailPawn: pawn,
      trailPending: null,
      trailFind: { kind: "sling", space: at, speciesId: find.speciesId, wild: true },
      colony: [...s.colony, find],
      serial: s.serial + 1,
    });
    persist({ ...get() });
  },

  dismissTrailFind: () => {
    set({ trailFind: null });
    persist({ ...get() });
  },

  walkTrail: (dir) => {
    const s = get();
    const next = Math.max(0, Math.min(TRAIL.length - 1, (s.trailAt ?? 0) + dir));
    set({ trailAt: next });
    get().toast(TRAIL[next]!.label);
  },

  searchField: (spotId) => {
    const s = get();
    const stop = TRAIL[s.trailAt ?? 0] ?? TRAIL[0]!;
    const id = spotId ?? stop.id;
    if ((s.fieldSearched?.length ?? 0) >= FLIPS_PER_DAY) {
      get().toast("Three flips today. Sleep and try again.");
      return;
    }
    if (s.fieldSearched.includes(id)) {
      get().toast("Already turned that stop.");
      return;
    }
    const caps = shopCaps(s.shopTier, s.slingShelves);
    const slings = s.colony.filter((c) => c.stage === "sling" && !c.personal).length;
    const find = forageRoll(s.profit, s.serial, s.day, stop.biome);
    const searched = [...s.fieldSearched, id];
    if (!find) {
      set({ fieldSearched: searched });
      get().toast(`${stop.label}: empty.`);
      persist({ ...get() });
      return;
    }
    if (slings >= caps.sling) {
      set({ fieldSearched: searched });
      get().toast("Sling racks are full. Leave it.");
      persist({ ...get() });
      return;
    }
    set({
      fieldSearched: searched,
      colony: [...s.colony, find],
      serial: s.serial + 1,
    });
    get().toast(`Wild sling · ${forageLabel(find.speciesId)}. Rack it until it molts.`);
    persist({ ...get() });
  },

  leaveField: () => {
    set({ view: "world" });
    get().toast("Back at the shop.");
  },

  pinDisplay: (speciesId, kind) => {
    const s = get();
    const unlocked = kind === "sale" ? (s.feltSales ?? []).includes(speciesId) : (s.feltBreeds ?? []).includes(speciesId);
    if (!unlocked) {
      get().toast("Unlock that portrait first.");
      return;
    }
    const pins = [...(s.displayPins ?? [])];
    const same = pins.findIndex((p) => p.speciesId === speciesId && p.kind === kind);
    if (same >= 0) {
      pins.splice(same, 1);
      set({ displayPins: pins });
      get().toast("Off the wall.");
      persist({ ...get() });
      return;
    }
    const cap = displaySlots(s.shopTier);
    if (pins.length >= cap) {
      get().toast(`Wall is full (${cap}). Take one down first.`);
      return;
    }
    pins.push({ speciesId, kind });
    set({ displayPins: pins });
    const spec = spiderById(speciesId);
    get().toast(`On the wall · ${spec?.common ?? "portrait"}. Opens will pull that guest.`);
    persist({ ...get() });
  },

  unpinDisplay: (index) => {
    const s = get();
    const pins = (s.displayPins ?? []).filter((_, i) => i !== index);
    set({ displayPins: pins });
    get().toast("Off the wall.");
    persist({ ...get() });
  },

  endDay: () => {
    if (get().shopMode === "open") get().closeShop();
    let s = get();
    if (s.elizabethHired) {
      const care = applyTendAll(s.colony, s.feeders, s.day);
      set({ colony: care.colony, feeders: care.feeders });
      s = get();
    }
    const caps = shopCaps(s.shopTier, s.slingShelves);
    let colony = s.colony.map((c) => ({ ...c, days: c.days + 1 }));
    const notes: JournalEntry[] = [];
    for (const sp of [...colony]) {
      const spec = spiderById(sp.speciesId);
      const blockedByHouse = spec ? sp.enclosureScore < passScore(spec) && spec.ow : false;
      if (blockedByHouse && spec) {
        notes.push({
          id: nid("j"),
          day: s.day,
          title: `${sp.tag} held a molt`,
          body: `${spec.common} didn't like the setup. Rebuild on the bench.`,
        });
        continue;
      }
      const res = moltIfReady(sp, colony, caps);
      colony = colony.map((c) => (c.id === sp.id ? res.spider : c));
      if (res.molt) {
        notes.push({
          id: nid("j"),
          day: s.day,
          title: `${spec?.common ?? "Stock"} molted`,
          body: `${sp.tag} is a ${res.molt}${res.spider.sex !== "u" ? ` (${res.spider.sex})` : ""}.`,
        });
      } else if (res.blocked) {
        notes.push({
          id: nid("j"),
          day: s.day,
          title: "Molt waiting",
          body: `${sp.tag} needs a bigger crib. Expand or sell.`,
        });
      }
    }
    const lost: OwnedSpider[] = [];
    const lateJars: OwnedSpider[] = [];
    for (const c of colony) {
      if (c.personal) continue;
      const spec = spiderById(c.speciesId);
      if (!spec) continue;
      if (wouldDie(c, spec, s.day)) lost.push(c);
      else if (atRisk(c, spec, s.day)) lateJars.push(c);
    }
    if (lost.length) {
      colony = colony.filter((c) => !lost.some((l) => l.id === c.id));
      notes.push({
        id: nid("j"),
        day: s.day,
        title: "Quiet tanks",
        body: `${lost.length} didn't make the night after days of skip. Tend all before sleep.`,
      });
    } else if (lateJars.length) {
      notes.push({
        id: nid("j"),
        day: s.day,
        title: "Late jars",
        body: `${lateJars.length} due. Tend before another skip.`,
      });
    }
    let cash = s.cash;
    if (s.day >= 3) {
      cash -= s.cash < 8 ? 0 : RENT_PER_NIGHT;
      if (s.cash < 8) {
        notes.push({ id: nid("j"), day: s.day, title: "Rent waived", body: "Landlord saw the empty till." });
      }
    }
    if (cash < 10 && colony.filter((c) => !c.personal).length <= 2) {
      cash += 25;
      notes.push({ id: nid("j"), day: s.day, title: "A neighbor", body: "Slipped 25 chips under the door." });
    }
    const late = s.orders.filter((o) => o.dueDay < s.day);
    const keepOrders = s.orders.filter((o) => o.dueDay >= s.day);
    if (late.length) {
      const penalty = late.length * 6;
      cash -= penalty;
      notes.push({
        id: nid("j"),
        day: s.day,
        title: "Late slip",
        body: `${late.length} ship order aged out. Docked ${penalty}.`,
      });
    }
    const nextDay = s.day + 1;
    const capsNow = shopCaps(s.shopTier, s.slingShelves);
    let serial = s.serial;
    const stillIn: WholesaleTicket[] = [];
    for (const t of s.inbound) {
      if (t.arriveDay > nextDay) {
        stillIn.push(t);
        continue;
      }
      const room = capsNow.sling - countStage(colony, "sling");
      const n = Math.min(t.qty, Math.max(0, room));
      if (n < 1) {
        stillIn.push({ ...t, arriveDay: nextDay + 1 });
        notes.push({
          id: nid("j"),
          day: s.day,
          title: "Truck waited",
          body: "Sling cups were full. Lot sits on the dock until you clear vials.",
        });
        continue;
      }
      const spec = spiderById(t.speciesId);
      for (let i = 0; i < n; i++) {
        const sl = makeSling(t.speciesId, nextDay, "sling", serial);
        colony = [...colony, { ...sl, enclosureScore: 6 }];
        serial += 1;
      }
      notes.push({
        id: nid("j"),
        day: nextDay,
        title: "Wholesale lot",
        body: `${n} ${spec?.common ?? "slings"} off the truck.`,
      });
      if (n < t.qty) stillIn.push({ ...t, qty: t.qty - n, arriveDay: nextDay + 1 });
    }
    const ended = cash <= -40 ? ("evicted" as const) : null;
    const orderN = s.shopTier === 0 ? 1 : 2;
    const stock = s.colony.filter((c) => !c.personal);
    const allCared =
      stock.length > 0 &&
      stock.every((c) => {
        const spec = spiderById(c.speciesId);
        return spec ? careDue(c, spec, s.day).length === 0 : true;
      });
    const stats = {
      ...s.stats,
      cleanNights: s.stats.cleanNights + (allCared && !lost.length ? 1 : 0),
      losses: s.stats.losses + lost.length,
    };
    const nextOrders = [...keepOrders, ...rollShipOrders(nextDay, orderN).filter((o) => isUnlocked(o.speciesId, s.profit))].slice(0, 4);
    set({
      ...s,
      day: nextDay,
      cash,
      shopMode: "closed",
      customers: [],
      served: [],
      colony,
      serial,
      inbound: stillIn,
      orders: nextOrders,
      journal: [...notes, ...s.journal].slice(0, 40),
      stats,
      dealsToday: 0,
      fieldSearched: [],
      trailDraws: 0,
      trailDeck: shuffleDeck(),
      trailLastCard: null,
      trailPending: null,
      trailFind: null,
      openedBy: null,
      ended,
      hour: 0,
      view: "world",
      coachBeat: nextCoach(s.coachBeat, 3),
    });
    if (ended) get().toast("Locks changed.");
    else if (lost.length) get().toast(`${lost.length} didn't make the night.`);
    else get().toast(`Day ${nextDay}.`);
    persist({ ...get() });
  },
}));

export function wholesaleToday(day: number, profit = 0) {
  return shopStock(day, 6).filter((s) => isUnlocked(s.id, profit));
}

export function listedMatches(colony: OwnedSpider[], want: string) {
  return shopSpiders(colony).filter((c) => c.listed && c.speciesId === want);
}

