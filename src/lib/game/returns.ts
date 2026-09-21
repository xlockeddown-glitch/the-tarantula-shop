import type { ReturningGuest, ShopCustomer } from "./spiders";
import { spiderById } from "./spiders";

/** Max names kept in the book. */
export const BOOK_CAP = 8;
/** Returning guests allowed on the floor in one open day. */
export const FLOOR_RETURN_CAP = 2;
/** After this many empty visits they stop checking. */
export const MAX_VISITS = 3;

const WAIT = [2, 3, 4];

export function waitDays(visits: number) {
  return WAIT[Math.min(visits, WAIT.length - 1)] ?? 4;
}

export function bumpedOffer(guest: ReturningGuest) {
  const spec = spiderById(guest.want);
  const cap = spec ? Math.round(spec.price * 1.25) : guest.offer;
  const next = Math.round(guest.offer * (1 + 0.08 * Math.min(guest.visits, 2)));
  return Math.min(cap, Math.max(guest.offer, next));
}

export function guestKey(name: string, want: string) {
  return `${name.toLowerCase()}::${want}`;
}

/** Close-of-day: order customers who did not buy go in the book. */
export function bookDepartures(
  book: ReturningGuest[],
  leftovers: ShopCustomer[],
  day: number,
): { book: ReturningGuest[]; noted: number; dropped: number } {
  let dropped = 0;
  const next = [...book];
  for (const c of leftovers) {
    if (c.kind !== "order") continue;
    const prior = c.visits || next.find((g) => g.id === c.id || guestKey(g.name, g.want) === guestKey(c.name, c.want))?.visits || 0;
    const visits = prior + 1;
    if (visits > MAX_VISITS) {
      dropped += 1;
      continue;
    }
    const extra = c.follow ? 1 : 0;
    const row: ReturningGuest = {
      id: c.id,
      name: c.name,
      want: c.want,
      offer: c.offer,
      nextDay: day + waitDays(visits - 1) + extra,
      visits,
    };
    const key = guestKey(row.name, row.want);
    const idx = next.findIndex((g) => guestKey(g.name, g.want) === key || g.id === row.id);
    if (idx >= 0) next[idx] = row;
    else next.push(row);
  }
  next.sort((a, b) => a.nextDay - b.nextDay || a.name.localeCompare(b.name));
  return { book: next.slice(0, BOOK_CAP), noted: leftovers.filter((c) => c.kind === "order").length - dropped, dropped };
}

/** Open-of-day: due guests take floor slots; the rest stay on the book. */
export function pullDue(
  book: ReturningGuest[],
  day: number,
): { floor: ReturningGuest[]; rest: ReturningGuest[] } {
  const due = book.filter((g) => g.nextDay <= day);
  const later = book.filter((g) => g.nextDay > day);
  const floor = due.slice(0, FLOOR_RETURN_CAP);
  const overflow = due.slice(FLOOR_RETURN_CAP).map((g) => ({ ...g, nextDay: day }));
  return { floor, rest: [...overflow, ...later] };
}

export function toFloorCustomer(g: ReturningGuest): ShopCustomer {
  return {
    id: g.id,
    name: g.name,
    husbandry: 5,
    want: g.want,
    offer: bumpedOffer(g),
    follow: true,
    kind: "order",
    returning: true,
    visits: g.visits,
  };
}

export function bookLine(g: ReturningGuest, day: number) {
  const spec = spiderById(g.want);
  const when = g.nextDay <= day ? "due today" : `day ${g.nextDay}`;
  return `${g.name} · ${spec?.common ?? g.want} · ${when} · visit ${g.visits}/${MAX_VISITS}`;
}
