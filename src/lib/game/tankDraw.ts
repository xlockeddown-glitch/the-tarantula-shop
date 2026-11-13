/**
 * Canvas renderer for the live tank. Flat felt shapes, soft drop shadows and
 * dashed "stitch" outlines so the animal matches the embroidered card art.
 */
import type { SpeciesPaint } from "./look";
import {
  BODY,
  LEG_GEO,
  cricketScale,
  hipLocal,
  kneeTopDown,
  mulberry32,
  segLengths,
  toWorld,
  type Cricket,
  type Layout,
  type Spider,
  type Vec,
  type World,
} from "./tankSim";

export type TankLook = {
  paint: SpeciesPaint;
  /** Curly-hair style abdomen fuzz (Tliltocatl albopilosus). */
  curly: boolean;
  /** Water level 0..1 for the dish. */
  water: number;
  /** Seconds since misting (Infinity if not misted). */
  mistAge: number;
  /** 0..1 grime on the glass. */
  grime: number;
  premolt: boolean;
  seed: number;
};

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function shade(hex: string, k: number, alpha = 1) {
  const { r, g, b } = hexToRgb(hex);
  const f = (v: number) => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k));
  return `rgba(${f(r)},${f(g)},${f(b)},${alpha})`;
}

const SUBSTRATE: Record<Layout["life"], string> = {
  terrestrial: "#b09070",
  arboreal: "#8e7a5c",
  fossorial: "#a08060",
};

const substrateCache = new Map<string, HTMLCanvasElement>();

function substrate(layout: Layout, px: number): HTMLCanvasElement {
  const key = `${layout.life}:${px}`;
  const hit = substrateCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = px;
  c.height = px;
  const g = c.getContext("2d")!;
  const k = px / layout.w;
  g.scale(k, k);
  const base = SUBSTRATE[layout.life];
  g.fillStyle = base;
  g.fillRect(0, 0, layout.w, layout.h);
  const rng = mulberry32(layout.life.length * 991);
  // Felt fibres and coco crumbs.
  for (let i = 0; i < 2600; i++) {
    const x = rng() * layout.w;
    const y = rng() * layout.h;
    const a = rng() * Math.PI;
    const l = 1 + rng() * 4;
    g.strokeStyle =
      rng() < 0.5 ? shade(base, -0.25 - rng() * 0.2, 0.6) : shade(base, 0.12 + rng() * 0.15, 0.55);
    g.lineWidth = 0.5 + rng() * 0.8;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  for (let i = 0; i < 140; i++) {
    g.fillStyle = shade(base, -0.35, 0.5);
    g.beginPath();
    g.ellipse(
      rng() * layout.w,
      rng() * layout.h,
      1 + rng() * 2.5,
      0.8 + rng() * 1.6,
      rng() * 3,
      0,
      Math.PI * 2,
    );
    g.fill();
  }
  // Soft vignette toward the glass.
  const v = g.createRadialGradient(
    layout.w / 2,
    layout.h / 2,
    layout.w * 0.3,
    layout.w / 2,
    layout.h / 2,
    layout.w * 0.75,
  );
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(30,18,8,0.35)");
  g.fillStyle = v;
  g.fillRect(0, 0, layout.w, layout.h);
  blanketStitch(g, layout.w, layout.h);
  substrateCache.set(key, c);
  return c;
}

/** Cream blanket stitch around the edge, like the felt tiles. */
function blanketStitch(g: CanvasRenderingContext2D, w: number, h: number) {
  const inset = 7;
  const gap = 17;
  g.strokeStyle = "#efe6d8";
  g.lineWidth = 3.2;
  g.lineCap = "round";
  const edge = (x0: number, y0: number, x1: number, y1: number, nx: number, ny: number) => {
    const L = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.floor(L / gap);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      g.beginPath();
      g.moveTo(x - nx * inset, y - ny * inset);
      g.lineTo(x + nx * 4, y + ny * 4);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(x0 + nx * 4, y0 + ny * 4);
    g.lineTo(x1 + nx * 4, y1 + ny * 4);
    g.stroke();
  };
  const m = 6;
  edge(m, m, w - m, m, 0, -1);
  edge(w - m, m, w - m, h - m, 1, 0);
  edge(w - m, h - m, m, h - m, 0, 1);
  edge(m, h - m, m, m, -1, 0);
}

function stitchedEllipse(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rot: number,
  fill: string,
  stitch: string,
  lw = 1.2,
) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
  g.save();
  g.shadowColor = "transparent";
  g.setLineDash([2.6, 2.4]);
  g.strokeStyle = stitch;
  g.lineWidth = lw;
  g.beginPath();
  g.ellipse(x, y, Math.max(1, rx - 2), Math.max(1, ry - 2), rot, 0, Math.PI * 2);
  g.stroke();
  g.restore();
}

function softShadow(g: CanvasRenderingContext2D, blur: number, oy = 2) {
  g.shadowColor = "rgba(25,15,5,0.35)";
  g.shadowBlur = blur;
  g.shadowOffsetX = oy * 0.5;
  g.shadowOffsetY = oy;
}

function noShadow(g: CanvasRenderingContext2D) {
  g.shadowColor = "transparent";
  g.shadowBlur = 0;
  g.shadowOffsetX = 0;
  g.shadowOffsetY = 0;
}

function drawHome(g: CanvasRenderingContext2D, layout: Layout) {
  const { home, life } = layout;
  if (life === "fossorial") {
    // Spoil ring and burrow mouth.
    stitchedEllipse(
      g,
      home.x,
      home.y,
      home.r + 12,
      home.r + 9,
      0.2,
      shade(SUBSTRATE.fossorial, 0.12),
      "#efe6d8",
      1,
    );
    const grad = g.createRadialGradient(home.x, home.y, 2, home.x, home.y, home.r);
    grad.addColorStop(0, "#120c06");
    grad.addColorStop(1, "#3a2818");
    g.fillStyle = grad;
    g.beginPath();
    g.ellipse(home.x, home.y, home.r, home.r * 0.86, 0.2, 0, Math.PI * 2);
    g.fill();
    // Silk at the rim.
    g.strokeStyle = "rgba(240,236,228,0.55)";
    g.lineWidth = 0.8;
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      g.beginPath();
      g.moveTo(home.x + Math.cos(a) * home.r * 0.7, home.y + Math.sin(a) * home.r * 0.6);
      g.lineTo(
        home.x + Math.cos(a + 0.4) * (home.r + 10),
        home.y + Math.sin(a + 0.4) * (home.r + 8),
      );
      g.stroke();
    }
    return;
  }
  if (life === "arboreal") {
    // Leaves, then the cork tube seen from above.
    const leaves = [
      { x: home.x - 52, y: home.y + 30, r: -0.6 },
      { x: home.x + 30, y: home.y + 48, r: 0.9 },
      { x: home.x - 20, y: home.y - 40, r: 2.4 },
    ];
    for (const l of leaves) {
      g.save();
      softShadow(g, 4);
      stitchedEllipse(g, l.x, l.y, 26, 11, l.r, "#5a7a4a", "#cfe0b8", 1);
      noShadow(g);
      g.strokeStyle = "#cfe0b8";
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(l.x - Math.cos(l.r) * 22, l.y - Math.sin(l.r) * 22);
      g.lineTo(l.x + Math.cos(l.r) * 22, l.y + Math.sin(l.r) * 22);
      g.stroke();
      g.restore();
    }
    g.save();
    softShadow(g, 8, 4);
    stitchedEllipse(g, home.x, home.y, home.r, home.r, 0, "#7a5636", "#e8d4b8", 1.4);
    noShadow(g);
    g.fillStyle = "#24170c";
    g.beginPath();
    g.arc(home.x, home.y, home.r * 0.45, 0, Math.PI * 2);
    g.fill();
    // Webbing across the tube mouth.
    g.strokeStyle = "rgba(240,236,228,0.6)";
    g.lineWidth = 0.7;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI;
      g.beginPath();
      g.moveTo(home.x + Math.cos(a) * home.r * 0.9, home.y + Math.sin(a) * home.r * 0.9);
      g.lineTo(home.x - Math.cos(a) * home.r * 0.9, home.y - Math.sin(a) * home.r * 0.9);
      g.stroke();
    }
    g.restore();
    return;
  }
  // Cork bark half-log hide.
  g.save();
  softShadow(g, 10, 5);
  stitchedEllipse(
    g,
    home.x,
    home.y,
    home.r * 1.55,
    home.r * 0.78,
    home.rot,
    "#7a5636",
    "#e8d4b8",
    1.4,
  );
  noShadow(g);
  g.translate(home.x, home.y);
  g.rotate(home.rot);
  g.strokeStyle = "#5a3c22";
  g.lineCap = "round";
  for (let i = -3; i <= 3; i++) {
    g.lineWidth = 2.2;
    g.beginPath();
    const y = i * home.r * 0.17;
    const span = home.r * 1.3 * Math.sqrt(1 - Math.pow(y / (home.r * 0.78), 2));
    g.moveTo(-span, y);
    g.bezierCurveTo(-span * 0.3, y + 3, span * 0.3, y - 3, span, y);
    g.stroke();
  }
  // Dark opening on the low side.
  g.fillStyle = "rgba(20,12,6,0.7)";
  g.beginPath();
  g.ellipse(0, home.r * 0.62, home.r * 1.1, home.r * 0.2, 0, 0, Math.PI);
  g.fill();
  g.restore();
}

function drawDish(
  g: CanvasRenderingContext2D,
  dish: NonNullable<Layout["dish"]>,
  water: number,
  t: number,
) {
  g.save();
  softShadow(g, 6, 3);
  stitchedEllipse(g, dish.x, dish.y, dish.r, dish.r, 0, "#e8e0d4", "#9a9088", 1);
  noShadow(g);
  g.fillStyle = "#c8c0b4";
  g.beginPath();
  g.arc(dish.x, dish.y, dish.r - 5, 0, Math.PI * 2);
  g.fill();
  if (water > 0.02) {
    const r = (dish.r - 5) * (0.55 + 0.45 * water);
    const grad = g.createRadialGradient(dish.x - 3, dish.y - 4, 1, dish.x, dish.y, r);
    grad.addColorStop(0, "#9ed0e6");
    grad.addColorStop(1, "#4a8ab0");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(dish.x, dish.y, r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,0.55)";
    g.lineWidth = 1.2;
    g.beginPath();
    g.arc(dish.x - 2, dish.y - 2, r * 0.55 + Math.sin(t * 2) * 0.6, 3.6, 4.6);
    g.stroke();
  }
  g.restore();
}

function drawCricket(g: CanvasRenderingContext2D, c: Cricket, held: boolean, size: number) {
  const hop = c.t < 1 ? Math.sin(c.t * Math.PI) : 0;
  g.save();
  g.translate(c.pos.x, c.pos.y);
  g.rotate(c.heading);
  const k = size * (held ? 0.8 : 1 + hop * 0.25);
  g.scale(k, k);
  if (!held) {
    g.fillStyle = `rgba(25,15,5,${0.25 - hop * 0.12})`;
    g.beginPath();
    g.ellipse(2 + hop * 5, 3 + hop * 6, 8, 4, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = "#6a4c24";
  g.lineCap = "round";
  // Hind legs.
  g.lineWidth = 1.6;
  for (const s of [-1, 1]) {
    g.beginPath();
    g.moveTo(-1, s * 2);
    g.lineTo(3, s * 6);
    g.lineTo(-9, s * 5);
    g.stroke();
  }
  g.lineWidth = 0.9;
  for (const s of [-1, 1]) {
    g.beginPath();
    g.moveTo(3, s * 2);
    g.lineTo(6, s * 5);
    g.stroke();
    // Antennae.
    g.beginPath();
    g.moveTo(8, s * 1);
    g.quadraticCurveTo(14, s * 4, 19, s * 3);
    g.stroke();
  }
  g.fillStyle = "#a07840";
  g.beginPath();
  g.ellipse(0, 0, 7, 3.2, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#7a5a30";
  g.beginPath();
  g.arc(7, 0, 2.4, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

type Fuzz = { a: number; r: number; l: number; curl: number }[];
const fuzzCache = new Map<number, Fuzz>();
function fuzzFor(seed: number): Fuzz {
  const hit = fuzzCache.get(seed);
  if (hit) return hit;
  const rng = mulberry32(seed);
  const out: Fuzz = [];
  for (let i = 0; i < 46; i++)
    out.push({
      a: rng() * Math.PI * 2,
      r: 0.35 + rng() * 0.62,
      l: 1.6 + rng() * 2.4,
      curl: rng() < 0.5 ? -1 : 1,
    });
  fuzzCache.set(seed, out);
  return out;
}

function drawSpider(g: CanvasRenderingContext2D, w: World, look: TankLook) {
  const sp: Spider = w.spider;
  const s = sp.scale;
  const p = look.paint;
  const heading = sp.heading;
  const breath = 1 + Math.sin(w.time * 1.6) * 0.018;

  // Ground shadow.
  const sc = toWorld(sp, -6 * s, 0);
  const sh = g.createRadialGradient(sc.x + 3, sc.y + 5, 2, sc.x + 3, sc.y + 5, 46 * s);
  sh.addColorStop(0, "rgba(25,15,5,0.32)");
  sh.addColorStop(1, "rgba(25,15,5,0)");
  g.fillStyle = sh;
  g.beginPath();
  g.ellipse(sc.x + 3, sc.y + 5, 46 * s, 34 * s, heading, 0, Math.PI * 2);
  g.fill();

  // Legs.
  g.lineCap = "round";
  g.lineJoin = "round";
  for (const leg of sp.legs) {
    const { a, b } = segLengths(leg.idx, s);
    const h = hipLocal(leg.idx, leg.side, s);
    const hip = toWorld(sp, h.x, h.y);
    let foot = leg.foot;
    const lift = leg.stepping ? Math.sin(leg.t * Math.PI) : 0;
    let near = 0;
    if (leg.idx === 0 && sp.raise > 0.01) {
      const up = toWorld(sp, (BODY.carRx + LEG_GEO[0].reach * 0.72) * s, leg.side * 7 * s);
      foot = { x: foot.x + (up.x - foot.x) * sp.raise, y: foot.y + (up.y - foot.y) * sp.raise };
      near = sp.raise;
    }
    const d = Math.hypot(foot.x - hip.x, foot.y - hip.y);
    if (d > a + b)
      foot = {
        x: hip.x + ((foot.x - hip.x) * (a + b)) / d,
        y: hip.y + ((foot.y - hip.y) * (a + b)) / d,
      };
    const knee = kneeTopDown(hip, foot, LEG_GEO[leg.idx]!.reach * s, sp.pos);
    const thick = 1 + lift * 0.18 + near * 0.35;
    const wf = (7.2 * s + 1) * thick;
    const wt = (6 * s + 0.8) * thick;
    g.save();
    softShadow(g, 3 * s + lift * 4, 1.5 + lift * 3);
    g.strokeStyle = p.legs;
    g.lineWidth = wf;
    g.beginPath();
    g.moveTo(hip.x, hip.y);
    g.lineTo(knee.x, knee.y);
    g.stroke();
    g.lineWidth = wt;
    g.beginPath();
    g.moveTo(knee.x, knee.y);
    g.lineTo(foot.x, foot.y);
    g.stroke();
    noShadow(g);
    // Felt highlight down the femur.
    g.strokeStyle = shade(p.legs, 0.22, 0.55);
    g.lineWidth = wf * 0.28;
    g.beginPath();
    g.moveTo(hip.x, hip.y);
    g.lineTo(knee.x, knee.y);
    g.stroke();
    // Pale bands at the knee and above the tarsus, like the embroidered cards.
    const band = (a0: Vec, a1: Vec, t: number, span: number, width: number, color: string) => {
      const dx = a1.x - a0.x;
      const dy = a1.y - a0.y;
      const L = Math.hypot(dx, dy) || 1;
      const c = { x: a0.x + dx * t, y: a0.y + dy * t };
      g.strokeStyle = color;
      g.lineWidth = width;
      g.lineCap = "butt";
      g.beginPath();
      g.moveTo(c.x - (dx / L) * span, c.y - (dy / L) * span);
      g.lineTo(c.x + (dx / L) * span, c.y + (dy / L) * span);
      g.stroke();
      g.lineCap = "round";
    };
    band(hip, knee, 0.97, 2.2 * s, wf * 0.92, p.accent);
    band(knee, foot, 0.62, 1.6 * s, wt * 0.9, shade(p.accent, 0, 0.85));
    g.fillStyle = p.toes;
    g.beginPath();
    g.arc(foot.x, foot.y, wt * 0.55, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  // Pedipalps.
  for (const side of [-1, 1]) {
    const hip = toWorld(sp, 9 * s, side * 4.5 * s);
    const wig = sp.mode === "eat" ? Math.sin(sp.chew + side) * 1.5 * s : 0;
    const tip = toWorld(sp, (19 + sp.raise * 6) * s + wig, side * (8 - sp.raise * 3) * s);
    g.save();
    softShadow(g, 2 * s, 1);
    g.strokeStyle = p.legs;
    g.lineWidth = 5 * s + 0.8;
    g.beginPath();
    g.moveTo(hip.x, hip.y);
    g.lineTo(tip.x, tip.y);
    g.stroke();
    noShadow(g);
    g.fillStyle = p.toes;
    g.beginPath();
    g.arc(tip.x, tip.y, 2.1 * s + 0.4, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  // Abdomen.
  const ab = toWorld(sp, BODY.absX * s, 0);
  const abFill = look.premolt ? shade(p.abdomen, -0.45) : p.abdomen;
  g.save();
  softShadow(g, 5 * s, 2.5);
  stitchedEllipse(
    g,
    ab.x,
    ab.y,
    BODY.absRx * s * breath,
    BODY.absRy * s * breath,
    heading,
    abFill,
    shade(p.accent, 0.1, 0.9),
    1,
  );
  noShadow(g);
  const fuzz = fuzzFor(look.seed);
  g.strokeStyle = shade(p.accent, look.curly ? 0.15 : 0.05, look.premolt ? 0.35 : 0.7);
  g.lineWidth = 0.9;
  for (const f of fuzz) {
    const lx = Math.cos(f.a) * BODY.absRx * f.r;
    const ly = Math.sin(f.a) * BODY.absRy * f.r;
    const q = toWorld({ pos: ab, heading }, lx * s * breath, ly * s * breath);
    g.beginPath();
    if (look.curly) {
      g.arc(q.x, q.y, f.l * 0.55 * (0.6 + s * 0.4), f.a, f.a + Math.PI * 1.4 * f.curl, f.curl < 0);
    } else {
      const ang = heading + f.a;
      g.moveTo(q.x, q.y);
      g.lineTo(q.x + Math.cos(ang) * f.l * s, q.y + Math.sin(ang) * f.l * s);
    }
    g.stroke();
  }
  // Spinnerets.
  for (const side of [-1, 1]) {
    const t = toWorld(sp, (BODY.absX - BODY.absRx + 1) * s, side * 2.5 * s);
    const e = toWorld(sp, (BODY.absX - BODY.absRx - 4) * s, side * 3.5 * s);
    g.strokeStyle = shade(abFill, -0.2);
    g.lineWidth = 1.6 * s + 0.4;
    g.beginPath();
    g.moveTo(t.x, t.y);
    g.lineTo(e.x, e.y);
    g.stroke();
  }
  g.restore();

  // Carapace.
  g.save();
  softShadow(g, 4 * s, 2);
  stitchedEllipse(
    g,
    sp.pos.x,
    sp.pos.y,
    BODY.carRx * s,
    BODY.carRy * s,
    heading,
    p.carapace,
    shade(p.accent, 0.15, 0.9),
    1,
  );
  noShadow(g);
  g.strokeStyle = shade(p.accent, 0, 0.5);
  g.lineWidth = 0.8;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const p0 = toWorld(sp, Math.cos(a) * 2 * s - 1.5 * s, Math.sin(a) * 2 * s);
    const p1 = toWorld(
      sp,
      Math.cos(a) * BODY.carRx * 0.78 * s - 1.5 * s,
      Math.sin(a) * BODY.carRy * 0.78 * s,
    );
    g.beginPath();
    g.moveTo(p0.x, p0.y);
    g.lineTo(p1.x, p1.y);
    g.stroke();
  }
  const fovea = toWorld(sp, -1.5 * s, 0);
  g.fillStyle = shade(p.carapace, -0.5);
  g.beginPath();
  g.arc(fovea.x, fovea.y, 1.3 * s + 0.3, 0, Math.PI * 2);
  g.fill();
  // Eye tubercle.
  const eye = toWorld(sp, 7.5 * s, 0);
  g.fillStyle = "#151010";
  g.beginPath();
  g.arc(eye.x, eye.y, 1.9 * s + 0.4, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "rgba(255,255,255,0.75)";
  for (const side of [-1, 1]) {
    const e = toWorld(sp, 8 * s, side * 0.8 * s);
    g.beginPath();
    g.arc(e.x, e.y, 0.45 * s + 0.2, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();

  // Chelicerae.
  for (const side of [-1, 1]) {
    const chew = sp.mode === "eat" ? Math.sin(sp.chew + (side > 0 ? 0 : Math.PI)) * 0.9 * s : 0;
    const c = toWorld(sp, 12.8 * s + chew, side * 2.8 * s);
    g.save();
    softShadow(g, 2 * s, 1);
    g.fillStyle = shade(p.carapace, -0.12);
    g.beginPath();
    g.ellipse(c.x, c.y, 3.7 * s + 0.3, 2.6 * s + 0.3, heading, 0, Math.PI * 2);
    g.fill();
    g.restore();
    if (sp.raise > 0.4) {
      const fang = toWorld(sp, 16 * s, side * 2.2 * s);
      g.strokeStyle = `rgba(20,14,10,${sp.raise})`;
      g.lineWidth = 1.2 * s + 0.3;
      g.beginPath();
      g.moveTo(c.x, c.y);
      g.lineTo(fang.x, fang.y);
      g.stroke();
    }
  }
}

function drawGlass(g: CanvasRenderingContext2D, layout: Layout, look: TankLook) {
  if (look.mistAge < 14) {
    const fade = Math.max(0, 1 - look.mistAge / 14);
    const rng = mulberry32(look.seed + 7);
    for (let i = 0; i < 70; i++) {
      const x = rng() * layout.w;
      const y = rng() * layout.h;
      const r = 1.2 + rng() * 2.6;
      g.fillStyle = `rgba(230,244,252,${0.35 * fade})`;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = `rgba(255,255,255,${0.7 * fade})`;
      g.beginPath();
      g.arc(x - r * 0.35, y - r * 0.35, r * 0.3, 0, Math.PI * 2);
      g.fill();
    }
  }
  if (look.grime > 0.01) {
    const rng = mulberry32(look.seed + 3);
    for (let i = 0; i < 7; i++) {
      const x = rng() * layout.w;
      const y = rng() * layout.h;
      const r = 30 + rng() * 60;
      const grad = g.createRadialGradient(x, y, 2, x, y, r);
      grad.addColorStop(0, `rgba(200,190,170,${0.28 * look.grime})`);
      grad.addColorStop(1, "rgba(200,190,170,0)");
      g.fillStyle = grad;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
  // Glass sheen.
  const sheen = g.createLinearGradient(0, 0, layout.w, layout.h);
  sheen.addColorStop(0, "rgba(255,255,255,0.10)");
  sheen.addColorStop(0.35, "rgba(255,255,255,0)");
  sheen.addColorStop(1, "rgba(255,255,255,0.04)");
  g.fillStyle = sheen;
  g.fillRect(0, 0, layout.w, layout.h);
}

export function drawTank(g: CanvasRenderingContext2D, w: World, look: TankLook, px: number) {
  const L = w.layout;
  const k = px / L.w;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, px, px);
  g.drawImage(substrate(L, px), 0, 0);
  g.setTransform(k, 0, 0, k, 0, 0);
  if (L.dish) drawDish(g, L.dish, look.water, w.time);
  drawHome(g, L);
  const eating = w.spider.mode === "eat";
  const cs = cricketScale(w.spider.scale);
  if (w.cricket && w.cricket.alive && !eating) drawCricket(g, w.cricket, false, cs);
  drawSpider(g, w, look);
  if (w.cricket && w.cricket.alive && eating) drawCricket(g, w.cricket, true, cs);
  g.strokeStyle = "rgba(240,236,228,0.8)";
  g.lineWidth = 0.8;
  for (const h of w.hairs) {
    g.globalAlpha = Math.min(1, h.life);
    g.beginPath();
    g.moveTo(h.pos.x, h.pos.y);
    g.lineTo(h.pos.x + h.vel.x * 0.02, h.pos.y + h.vel.y * 0.02);
    g.stroke();
  }
  g.globalAlpha = 1;
  drawGlass(g, L, look);
}

/** Canvas pixel → tank coordinates. */
export function toTank(
  layout: Layout,
  rect: { left: number; top: number; width: number },
  clientX: number,
  clientY: number,
): Vec {
  const k = layout.w / rect.width;
  return { x: (clientX - rect.left) * k, y: (clientY - rect.top) * k };
}
