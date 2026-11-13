/**
 * Live tank simulation. Top-down, one tarantula, an optional cricket.
 * No DOM here: TankView renders the world and feeds it input.
 *
 * Model: 8 legs on two-segment IK with an alternating tetrapod gait
 * (L1 R2 L3 R4 / R1 L2 R3 L4). Feet stay planted until they drift too far
 * from their rest spot, then step. Behaviour is a small state machine tuned
 * to how tarantulas actually act: mostly still, short walks, ambush feeding.
 */

export type Vec = { x: number; y: number };
export type Life = "terrestrial" | "arboreal" | "fossorial";
export type Temper = "docile" | "skittish" | "defensive";

export type Leg = {
  side: 1 | -1;
  idx: number;
  group: 0 | 1;
  foot: Vec;
  from: Vec;
  to: Vec;
  t: number;
  dur: number;
  stepping: boolean;
};

export type Mode =
  "idle" | "walk" | "hunt" | "lunge" | "eat" | "threat" | "bolt" | "flinch" | "flick";

export type Spider = {
  pos: Vec;
  heading: number;
  vel: Vec;
  scale: number;
  mode: Mode;
  timer: number;
  target: Vec | null;
  legs: Leg[];
  /** 0..1 front legs raised (threat pose). */
  raise: number;
  /** Chelicerae wiggle phase while eating. */
  chew: number;
  lookAt: Vec | null;
  pokes: number[];
};

export type Cricket = {
  pos: Vec;
  from: Vec;
  to: Vec;
  t: number;
  hopIn: number;
  heading: number;
  alive: boolean;
};

export type Hair = { pos: Vec; vel: Vec; life: number };

export type Layout = {
  w: number;
  h: number;
  life: Life;
  /** Hide (cork bark), burrow mouth, or perch (cork tube) depending on life. */
  home: Vec & { r: number; rot: number };
  dish: (Vec & { r: number }) | null;
};

export type World = {
  layout: Layout;
  spider: Spider;
  cricket: Cricket | null;
  hairs: Hair[];
  temper: Temper;
  hungry: boolean;
  premolt: boolean;
  caption: string;
  /** One-shot events for the UI (e.g. "ate" → spend a feeder). */
  events: ("ate" | "refused")[];
  time: number;
  rng: () => number;
};

export const STAGE_SCALE = { sling: 0.78, juvenile: 1.15, adult: 1.55 } as const;

/** Per-leg geometry in body space (forward = +x, side = ±y), adult size. */
export const LEG_GEO = [
  { hip: 38, rest: 42, reach: 37 },
  { hip: 76, rest: 82, reach: 31 },
  { hip: 104, rest: 114, reach: 31 },
  { hip: 142, rest: 152, reach: 39 },
] as const;

export const BODY = { carRx: 14, carRy: 12.5, absX: -25, absRx: 19, absRy: 15.5 } as const;

const DEG = Math.PI / 180;

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeedText(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (a: Vec, k: number): Vec => ({ x: a.x * k, y: a.y * k });
export const len = (a: Vec) => Math.hypot(a.x, a.y);
export const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);
export const lerp = (a: Vec, b: Vec, t: number): Vec => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

function wrapAngle(a: number) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/** Body-space point → world. */
export function toWorld(sp: { pos: Vec; heading: number }, lx: number, ly: number): Vec {
  const c = Math.cos(sp.heading);
  const s = Math.sin(sp.heading);
  return { x: sp.pos.x + lx * c - ly * s, y: sp.pos.y + lx * s + ly * c };
}

export function hipLocal(idx: number, side: 1 | -1, scale: number): Vec {
  const a = LEG_GEO[idx]!.hip * DEG;
  return {
    x: Math.cos(a) * BODY.carRx * 0.82 * scale,
    y: side * Math.sin(a) * BODY.carRy * 0.82 * scale,
  };
}

export function restLocal(idx: number, side: 1 | -1, scale: number): Vec {
  const g = LEG_GEO[idx]!;
  const h = hipLocal(idx, side, scale);
  const r = g.rest * DEG;
  return { x: h.x + Math.cos(r) * g.reach * scale, y: h.y + side * Math.sin(r) * g.reach * scale };
}

export function segLengths(idx: number, scale: number) {
  const reach = LEG_GEO[idx]!.reach * scale;
  return { a: reach * 0.62, b: reach * 0.72 };
}

/**
 * Knee position seen from above. A tarantula's knee bends up toward the
 * camera, so from the top each leg reads as nearly straight with a slight
 * outward bow. The bow grows when the foot is pulled in close (knee raised).
 */
export function kneeTopDown(hip: Vec, foot: Vec, reach: number, body: Vec): Vec {
  const d = sub(foot, hip);
  const L = Math.max(0.001, len(d));
  const mid = lerp(hip, foot, 0.44);
  let perp = { x: -d.y / L, y: d.x / L };
  if ((mid.x - body.x) * perp.x + (mid.y - body.y) * perp.y < 0) perp = mul(perp, -1);
  const bow = L * 0.09 + Math.max(0, reach - L) * 0.3;
  return add(mid, mul(perp, bow));
}

export function makeLayout(life: Life, hasDish: boolean, w = 360, h = 360): Layout {
  const home =
    life === "arboreal"
      ? { x: w * 0.68, y: h * 0.32, r: 30, rot: 0 }
      : life === "fossorial"
        ? { x: w * 0.7, y: h * 0.32, r: 22, rot: 0 }
        : { x: w * 0.68, y: h * 0.3, r: 40, rot: -0.45 };
  return { w, h, life, home, dish: hasDish ? { x: w * 0.25, y: h * 0.76, r: 21 } : null };
}

export function makeWorld(opts: {
  life: Life;
  temper: Temper;
  stage: keyof typeof STAGE_SCALE;
  hasDish: boolean;
  hungry: boolean;
  premolt: boolean;
  seed: number;
}): World {
  const rng = mulberry32(opts.seed);
  const layout = makeLayout(opts.life, opts.hasDish);
  const scale = STAGE_SCALE[opts.stage];
  const pos = { x: layout.w * 0.45, y: layout.h * 0.55 };
  const spider: Spider = {
    pos,
    heading: -2.2 + rng() * 0.6,
    vel: { x: 0, y: 0 },
    scale,
    mode: "idle",
    timer: 1.5,
    target: null,
    legs: [],
    raise: 0,
    chew: 0,
    lookAt: null,
    pokes: [],
  };
  for (const side of [-1, 1] as const) {
    for (let idx = 0; idx < 4; idx++) {
      const r = restLocal(idx, side, scale);
      const foot = toWorld(spider, r.x, r.y);
      const group = ((idx + (side === 1 ? 1 : 0)) % 2) as 0 | 1;
      spider.legs.push({
        side,
        idx,
        group,
        foot,
        from: foot,
        to: foot,
        t: 1,
        dur: 0.14,
        stepping: false,
      });
    }
  }
  return {
    layout,
    spider,
    cricket: null,
    hairs: [],
    temper: opts.temper,
    hungry: opts.hungry,
    premolt: opts.premolt,
    caption: opts.premolt
      ? "Sitting tight. The abdomen's gone dark. Premolt."
      : restCaption(opts.life),
    events: [],
    time: 0,
    rng,
  };
}

function restCaption(life: Life) {
  return life === "arboreal"
    ? "Up on the cork tube."
    : life === "fossorial"
      ? "Parked at the burrow mouth."
      : "Sitting by the hide.";
}

const SPEED: Record<Temper, number> = { docile: 16, skittish: 30, defensive: 22 };
const IDLE: Record<Temper, [number, number]> = {
  docile: [4, 10],
  skittish: [2.5, 6],
  defensive: [5, 12],
};

function margin(w: World) {
  return 18 + 44 * w.spider.scale;
}

/** Crickets are sized to the eater: pinheads for slings. */
export function cricketScale(spiderScale: number) {
  return Math.min(1.25, 0.45 + spiderScale * 0.45);
}

function clampIn(w: World, p: Vec): Vec {
  const m = margin(w);
  return {
    x: Math.min(w.layout.w - m, Math.max(m, p.x)),
    y: Math.min(w.layout.h - m, Math.max(m, p.y)),
  };
}

function pickWander(w: World): Vec {
  const { home } = w.layout;
  const r = w.rng();
  const homeBias = w.layout.life === "terrestrial" ? 0.55 : 0.65;
  if (r < homeBias) {
    const a = w.rng() * Math.PI * 2;
    const d = home.r * (0.4 + w.rng() * 0.9);
    return clampIn(w, { x: home.x + Math.cos(a) * d, y: home.y + Math.sin(a) * d });
  }
  return clampIn(w, { x: w.rng() * w.layout.w, y: w.rng() * w.layout.h });
}

function farPoint(w: World, from: Vec): Vec {
  let best = pickWander(w);
  for (let i = 0; i < 6; i++) {
    const p = clampIn(w, { x: w.rng() * w.layout.w, y: w.rng() * w.layout.h });
    if (dist(p, from) > dist(best, from)) best = p;
  }
  return best;
}

function setIdle(w: World, caption?: string) {
  const [lo, hi] = IDLE[w.temper];
  w.spider.mode = "idle";
  w.spider.timer = lo + w.rng() * (hi - lo);
  w.spider.target = null;
  if (caption) w.caption = caption;
}

/** Steer toward a point. Returns distance left. */
function steer(w: World, to: Vec, speed: number, dt: number, turnRate = 2.6): number {
  const sp = w.spider;
  const d = sub(to, sp.pos);
  const left = len(d);
  if (left < 0.5) {
    sp.vel = { x: 0, y: 0 };
    return 0;
  }
  const want = Math.atan2(d.y, d.x);
  const diff = wrapAngle(want - sp.heading);
  const turn = Math.max(-turnRate * dt, Math.min(turnRate * dt, diff));
  sp.heading = wrapAngle(sp.heading + turn);
  const facing = Math.abs(diff) < 0.5 ? 1 : 0.25;
  const v = Math.min(left / dt, speed * facing);
  sp.vel = { x: Math.cos(sp.heading) * v, y: Math.sin(sp.heading) * v };
  sp.pos = add(sp.pos, mul(sp.vel, dt));
  return left;
}

function turnToward(w: World, p: Vec, dt: number, rate = 1.6) {
  const sp = w.spider;
  const want = Math.atan2(p.y - sp.pos.y, p.x - sp.pos.x);
  const diff = wrapAngle(want - sp.heading);
  sp.heading = wrapAngle(sp.heading + Math.max(-rate * dt, Math.min(rate * dt, diff)));
  return Math.abs(diff);
}

/** Mouth position (between the chelicerae). */
export function mouth(sp: Spider): Vec {
  return toWorld(sp, (BODY.carRx + 4) * sp.scale, 0);
}

function stepCricket(w: World, dt: number) {
  const c = w.cricket;
  if (!c || !c.alive) return;
  const sp = w.spider;
  if (sp.mode === "eat") {
    c.pos = mouth(sp);
    return;
  }
  if (c.t < 1) {
    c.t = Math.min(1, c.t + dt / 0.22);
    c.pos = lerp(c.from, c.to, c.t);
    return;
  }
  c.hopIn -= dt;
  // Crickets react to movement, not to a spider sitting still.
  const near = dist(c.pos, sp.pos) < 30 * sp.scale + 14 && len(sp.vel) > 12;
  if (c.hopIn <= 0 || (near && w.rng() < dt * 3)) {
    let dir = w.rng() * Math.PI * 2;
    if (near) dir = Math.atan2(c.pos.y - sp.pos.y, c.pos.x - sp.pos.x) + (w.rng() - 0.5);
    const hop = 26 + w.rng() * 40;
    c.from = c.pos;
    const edge = 34;
    c.to = {
      x: Math.min(w.layout.w - edge, Math.max(edge, c.pos.x + Math.cos(dir) * hop)),
      y: Math.min(w.layout.h - edge, Math.max(edge, c.pos.y + Math.sin(dir) * hop)),
    };
    c.heading = Math.atan2(c.to.y - c.from.y, c.to.x - c.from.x);
    c.t = 0;
    c.hopIn = 0.8 + w.rng() * 1.8;
  }
}

function stepLegs(w: World, dt: number, moved: Vec, turned: number) {
  const sp = w.spider;
  // A lunge is a leap: the legs come along with the body.
  if (sp.mode === "lunge") {
    for (const leg of sp.legs) {
      leg.foot = add(leg.foot, moved);
      leg.from = add(leg.from, moved);
      leg.to = add(leg.to, moved);
    }
  }
  const spinning = Math.abs(turned) / Math.max(dt, 1e-6) > 1.2;
  const fast = sp.mode === "bolt" || sp.mode === "lunge" || spinning;
  const speed = len(sp.vel);
  for (const leg of sp.legs) {
    if (leg.stepping) {
      // A foot in the air keeps aiming at a spot that moves with the body.
      if (sp.mode !== "lunge") leg.to = add(leg.to, moved);
      leg.t = Math.min(1, leg.t + dt / leg.dur);
      const e = leg.t < 0.5 ? 2 * leg.t * leg.t : 1 - Math.pow(-2 * leg.t + 2, 2) / 2;
      leg.foot = lerp(leg.from, leg.to, e);
      if (leg.t >= 1) leg.stepping = false;
    }
  }
  const busy = [0, 1].map((g) => sp.legs.some((l) => l.group === g && l.stepping));
  for (const leg of sp.legs) {
    if (leg.stepping) continue;
    const reach = LEG_GEO[leg.idx]!.reach * sp.scale;
    const rl = restLocal(leg.idx, leg.side, sp.scale);
    const rest = toWorld(sp, rl.x, rl.y);
    const off = dist(leg.foot, rest);
    // Far behind (sprinting, sharp turn): step now, gait or not.
    const stranded = off > reach * 0.3;
    if (busy[1 - leg.group] && !stranded) continue;
    if (off > reach * (fast ? 0.22 : 0.26)) {
      const dur = fast ? (spinning && sp.mode !== "bolt" ? 0.09 : 0.06) : speed > 1 ? 0.13 : 0.2;
      // Land ahead of the rest spot by about one step's travel, never past reach.
      const ahead = mul(sp.vel, dur * 1.6);
      const al = len(ahead);
      const cap = reach * 0.45;
      const target = add(rest, al > cap ? mul(ahead, cap / al) : ahead);
      leg.from = leg.foot;
      leg.to = target;
      leg.t = 0;
      leg.dur = dur;
      leg.stepping = true;
      busy[leg.group] = true;
    }
  }
  // Idle leg adjustments: tarantulas fidget one leg at a time.
  if ((sp.mode === "idle" || sp.mode === "hunt") && !busy[0] && !busy[1] && w.rng() < dt * 0.35) {
    const leg = sp.legs[Math.floor(w.rng() * sp.legs.length)]!;
    const rl = restLocal(leg.idx, leg.side, sp.scale);
    const jitter = { x: (w.rng() - 0.5) * 7 * sp.scale, y: (w.rng() - 0.5) * 7 * sp.scale };
    leg.from = leg.foot;
    leg.to = add(toWorld(sp, rl.x, rl.y), jitter);
    leg.t = 0;
    leg.dur = 0.28;
    leg.stepping = true;
  }
}

function stepHairs(w: World, dt: number) {
  for (const h of w.hairs) {
    h.pos = add(h.pos, mul(h.vel, dt));
    h.vel = mul(h.vel, 1 - dt * 2.5);
    h.life -= dt;
  }
  w.hairs = w.hairs.filter((h) => h.life > 0);
}

export function step(w: World, dtRaw: number) {
  const dt = Math.min(0.05, Math.max(0, dtRaw));
  w.time += dt;
  const sp = w.spider;
  const pos0 = sp.pos;
  const head0 = sp.heading;
  sp.timer -= dt;
  sp.raise += ((sp.mode === "threat" ? 1 : 0) - sp.raise) * Math.min(1, dt * 9);
  sp.pokes = sp.pokes.filter((t) => w.time - t < 4);
  const c = w.cricket && w.cricket.alive ? w.cricket : null;

  switch (sp.mode) {
    case "idle": {
      sp.vel = { x: 0, y: 0 };
      if (sp.lookAt) {
        if (turnToward(w, sp.lookAt, dt) < 0.08) sp.lookAt = null;
      }
      if (c && w.hungry && !w.premolt && dist(c.pos, sp.pos) < 150) {
        sp.mode = "hunt";
        sp.timer = 0;
        w.caption = "Felt the cricket. Turning to face it…";
        break;
      }
      if (sp.timer <= 0) {
        sp.mode = "walk";
        sp.target = pickWander(w);
        w.caption = w.temper === "skittish" ? "Patrolling the glass." : "Taking a slow lap.";
      }
      break;
    }
    case "walk": {
      if (c && w.hungry && !w.premolt && dist(c.pos, sp.pos) < 150) {
        sp.mode = "hunt";
        break;
      }
      const left = steer(w, sp.target ?? sp.pos, SPEED[w.temper] * Math.sqrt(sp.scale), dt);
      if (left < 2) setIdle(w, restCaption(w.layout.life));
      break;
    }
    case "hunt": {
      if (!c) {
        setIdle(w);
        break;
      }
      const m = mouth(sp);
      const d = dist(c.pos, m);
      const off = turnToward(w, c.pos, dt, 1.5);
      sp.vel = { x: 0, y: 0 };
      if (off < 0.35 && d < 26 * sp.scale + 12) {
        sp.mode = "lunge";
        sp.timer = 0.22;
        sp.target = { ...c.pos };
        w.caption = "Lunge!";
      } else if (off < 0.5 && d > 110) {
        steer(w, c.pos, SPEED[w.temper] * 0.8 * Math.sqrt(sp.scale), dt, 1.4);
        w.caption = "Following the vibrations.";
      } else if (off < 0.5 && d > (26 * sp.scale + 12) * 1.25) {
        steer(w, c.pos, 11 * Math.sqrt(sp.scale), dt, 1.4);
        w.caption = "Stalking…";
      } else if (off < 0.5) {
        w.caption = "Waiting for it to come closer.";
      }
      break;
    }
    case "lunge": {
      steer(w, sp.target ?? sp.pos, 170 * Math.sqrt(sp.scale), dt, 6);
      if (c && dist(mouth(sp), c.pos) < 11 * sp.scale + 5) {
        sp.mode = "eat";
        sp.timer = 6;
        sp.vel = { x: 0, y: 0 };
        w.events.push("ate");
        w.hungry = false;
        w.caption = "Got it. Chewing.";
      } else if (sp.timer <= 0) {
        sp.mode = "hunt";
        sp.vel = { x: 0, y: 0 };
        w.caption = "Missed. It hopped.";
      }
      break;
    }
    case "eat": {
      sp.vel = { x: 0, y: 0 };
      sp.chew += dt * 9;
      if (sp.timer <= 0) {
        if (w.cricket) w.cricket.alive = false;
        w.cricket = null;
        setIdle(w, "Done. Leaves a little bolus behind.");
      }
      break;
    }
    case "threat": {
      sp.vel = { x: 0, y: 0 };
      if (sp.timer <= 0) setIdle(w, "Settling down. Slowly.");
      break;
    }
    case "bolt": {
      const left = steer(w, sp.target ?? sp.pos, 85 * sp.scale, dt, 5);
      if (left < 3 || sp.timer <= 0) setIdle(w, "Froze in the corner.");
      break;
    }
    case "flinch": {
      const back = toWorld(sp, -12 * sp.scale, 0);
      sp.vel = sub(back, sp.pos);
      sp.pos = lerp(sp.pos, back, Math.min(1, dt * 5));
      if (sp.timer <= 0) setIdle(w);
      break;
    }
    case "flick": {
      sp.vel = { x: 0, y: 0 };
      if (sp.target) turnToward(w, sp.target, dt, 4);
      if (sp.timer < 0.8 && w.rng() < dt * 40) {
        const tail = toWorld(
          sp,
          (BODY.absX - BODY.absRx) * sp.scale,
          (w.rng() - 0.5) * 14 * sp.scale,
        );
        const a = sp.heading + Math.PI + (w.rng() - 0.5) * 1.2;
        const v = 40 + w.rng() * 50;
        w.hairs.push({
          pos: tail,
          vel: { x: Math.cos(a) * v, y: Math.sin(a) * v },
          life: 0.9 + w.rng() * 0.6,
        });
      }
      if (sp.timer <= 0) setIdle(w, "Itchy. That's what poking gets you.");
      break;
    }
  }
  sp.pos = clampIn(w, sp.pos);
  stepCricket(w, dt);
  stepLegs(w, dt, sub(sp.pos, pos0), wrapAngle(sp.heading - head0));
  stepHairs(w, dt);
}

/** True if a point is on the spider's body or legs (generous for fingers). */
export function hitsSpider(w: World, p: Vec) {
  const sp = w.spider;
  return dist(p, toWorld(sp, -6 * sp.scale, 0)) < 34 * sp.scale + 10;
}

/** Tap in the tank. Returns true if it touched the spider. */
export function poke(w: World, p: Vec): boolean {
  const sp = w.spider;
  if (sp.mode === "eat") {
    if (hitsSpider(w, p)) w.caption = "Leave it be. It's eating.";
    return hitsSpider(w, p);
  }
  if (!hitsSpider(w, p)) {
    // Tarantulas feel vibration through the substrate.
    if (sp.mode === "idle" && dist(p, sp.pos) < 160) {
      sp.lookAt = p;
      w.caption = "Turned toward the tap.";
    }
    return false;
  }
  sp.pokes.push(w.time);
  if (w.temper === "defensive") {
    sp.mode = "threat";
    sp.timer = 2.4;
    w.caption = "Threat pose. Fangs out. Back off.";
  } else if (w.temper === "skittish") {
    sp.mode = "bolt";
    sp.timer = 1.6;
    sp.target = farPoint(w, sp.pos);
    w.caption = "Bolted!";
  } else if (sp.pokes.length >= 2) {
    sp.mode = "flick";
    sp.timer = 1.1;
    // Turn the rump toward the finger, then kick.
    sp.target = sub(mul(sp.pos, 2), p);
    w.caption = "Flicked hairs at you.";
  } else {
    sp.mode = "flinch";
    sp.timer = 0.35;
    w.caption = "Barely flinched.";
  }
  return true;
}

export function dropCricket(w: World): void {
  const sp = w.spider;
  let pos = { x: w.layout.w * 0.5, y: w.layout.h * 0.5 };
  for (let i = 0; i < 8; i++) {
    const p = { x: 60 + w.rng() * (w.layout.w - 120), y: 60 + w.rng() * (w.layout.h - 120) };
    const d = dist(p, sp.pos);
    if (d > 80 && d < 150) {
      pos = p;
      break;
    }
  }
  w.cricket = {
    pos,
    from: pos,
    to: pos,
    t: 1,
    hopIn: 1.2,
    heading: w.rng() * Math.PI * 2,
    alive: true,
  };
  if (w.premolt) {
    w.caption = "Not interested. Premolt. Fish the cricket out.";
    w.events.push("refused");
  } else if (!w.hungry) {
    w.caption = "Not hungry.";
  } else {
    w.caption = "Cricket's in. Watch.";
  }
}

export function removeCricket(w: World) {
  if (w.spider.mode === "eat" || w.spider.mode === "lunge") return;
  w.cricket = null;
  if (w.spider.mode === "hunt") setIdle(w, "Cricket's out.");
  else w.caption = "Cricket's out.";
}
