import { useEffect, useRef, useState } from "react";
import { Bug, Droplets, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { careDue, daysSince, needsMist, needsWaterBowl, offFood } from "@/lib/game/care";
import { paintOf } from "@/lib/game/look";
import {
  isPremolt,
  STAGE_LABEL,
  spiderById,
  fairAsk,
  type OwnedSpider,
  type SpiderSpecies,
} from "@/lib/game/spiders";
import { useGame } from "@/lib/game/store";
import { drawTank, toTank, type TankLook } from "@/lib/game/tankDraw";
import {
  dropCricket,
  hashSeedText,
  makeWorld,
  poke,
  removeCricket,
  step,
  type World,
} from "@/lib/game/tankSim";
import { SexMark } from "./SexMark";

function lifeOf(spec: SpiderSpecies) {
  return spec.life;
}

function Tank({ sp, spec }: { sp: OwnedSpider; spec: SpiderSpecies }) {
  const day = useGame((s) => s.day);
  const feeders = useGame((s) => s.feeders);
  const tend = useGame((s) => s.tend);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const premolt = isPremolt(sp);
  const freshMolt = sp.moltDay === day;
  const fedToday = sp.fedDay === day;
  const hasDish = needsWaterBowl(spec);
  const mistTank = needsMist(spec);
  const watered = sp.waterDay === day;
  const misted = sp.mistDay === day;
  const grimy = careDue(sp, spec, day).includes("clean");
  const [caption, setCaption] = useState("");
  const [hasCricket, setHasCricket] = useState(false);
  const [eating, setEating] = useState(false);
  const look = useRef<TankLook>({
    paint: paintOf(spec.id),
    curly: spec.id === "tliltocatl-albopilosus",
    water: watered ? 1 : 0.15,
    mistAge: misted ? 6 : Infinity,
    grime: grimy ? 1 : 0,
    premolt,
    seed: hashSeedText(sp.id),
    exuvia: freshMolt,
  });

  const wateredRef = useRef(watered);
  wateredRef.current = watered;
  const grimeRef = useRef(grimy);
  grimeRef.current = grimy;

  if (!worldRef.current) {
    worldRef.current = makeWorld({
      life: lifeOf(spec),
      temper: spec.temper,
      stage: sp.stage,
      hasDish,
      hungry: !fedToday && !offFood(sp, day),
      premolt,
      seed: hashSeedText(sp.id),
    });
    if (freshMolt)
      worldRef.current.caption = "Fresh out of its old skin. Fangs are still soft. No food today.";
  }

  // Keep world flags in step with the save.
  useEffect(() => {
    const w = worldRef.current!;
    w.hungry = !fedToday && !premolt && !freshMolt;
    w.premolt = premolt;
    look.current.premolt = premolt;
  }, [fedToday, premolt, freshMolt, grimy]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const g = canvas.getContext("2d")!;
    let raf = 0;
    let last = performance.now();
    let px = 0;
    const size = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      px = Math.round(r.width * dpr);
      canvas.width = px;
      canvas.height = px;
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const w = worldRef.current!;
      step(w, dt);
      const L = look.current;
      if (L.mistAge !== Infinity) L.mistAge += dt;
      L.water += ((wateredRef.current ? 1 : 0.15) - L.water) * Math.min(1, dt * 2.5);
      L.grime += ((grimeRef.current ? 1 : 0) - L.grime) * Math.min(1, dt * 3);
      if (px > 0) drawTank(g, w, L, px);
      while (w.events.length) {
        const e = w.events.shift();
        if (e === "ate") tend(sp.id, "feed");
      }
      setCaption((c) => (c === w.caption ? c : w.caption));
      const cricket = !!(w.cricket && w.cricket.alive);
      setHasCricket((v) => (v === cricket ? v : cricket));
      const munch = w.spider.mode === "eat";
      setEating((v) => (v === munch ? v : munch));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // The world lives in a ref; the loop runs once per mounted animal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.id]);

  const onTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const w = worldRef.current!;
    const rect = e.currentTarget.getBoundingClientRect();
    poke(w, toTank(w.layout, rect, e.clientX, e.clientY));
  };

  const feedLabel = freshMolt
    ? "Just molted"
    : fedToday
      ? "Fed today"
      : feeders < 1
        ? "Bin empty"
        : `Drop a cricket · ${feeders}`;

  return (
    <>
      <div className="relative mx-auto aspect-square w-full max-w-[520px] overflow-hidden rounded-[18px] border-4 border-[#efe6d8] shadow-[0_12px_0_#2e3432]">
        <canvas
          ref={canvasRef}
          className="block size-full touch-none"
          onPointerDown={onTap}
          aria-label={`${spec.common} in its enclosure. Tap the tarantula to poke it.`}
        />
      </div>
      <p
        className="mt-3 min-h-[2.5rem] text-center font-display text-lg leading-snug text-[#efe6d8]"
        aria-live="polite"
      >
        {caption}
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {hasCricket && !eating ? (
          <Button
            size="sm"
            variant="secondary"
            className="rounded-full"
            onClick={() => removeCricket(worldRef.current!)}
          >
            Fish it out
          </Button>
        ) : (
          <Button
            size="sm"
            className="rounded-full"
            disabled={freshMolt || fedToday || feeders < 1 || eating}
            onClick={() => dropCricket(worldRef.current!)}
          >
            <Bug className="size-4" /> {feedLabel}
          </Button>
        )}
        {hasDish ? (
          <Button
            size="sm"
            variant="paper"
            className="rounded-full"
            disabled={watered}
            onClick={() => tend(sp.id, "water")}
          >
            <Droplets className="size-4" /> {watered ? "Dish full" : "Fill dish"}
          </Button>
        ) : null}
        {mistTank ? (
          <Button
            size="sm"
            variant="paper"
            className="rounded-full"
            disabled={misted}
            onClick={() => {
              look.current.mistAge = 0;
              tend(sp.id, "mist");
            }}
          >
            <Droplets className="size-4" /> {misted ? "Misted" : "Mist"}
          </Button>
        ) : null}
        {grimy ? (
          <Button
            size="sm"
            variant="paper"
            className="rounded-full"
            onClick={() => tend(sp.id, "clean")}
          >
            <Sparkles className="size-4" /> Wipe the glass
          </Button>
        ) : null}
      </div>
    </>
  );
}

export function TankView() {
  const tankId = useGame((s) => s.tankId);
  const colony = useGame((s) => s.colony);
  const day = useGame((s) => s.day);
  const close = useGame((s) => s.closeTank);
  const listSpider = useGame((s) => s.listSpider);
  const sp = tankId ? colony.find((c) => c.id === tankId) : null;
  const spec = sp ? spiderById(sp.speciesId) : null;

  useEffect(() => {
    if (!tankId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tankId, close]);

  // Sold or gone while open.
  useEffect(() => {
    if (tankId && !sp) close();
  }, [tankId, sp, close]);

  if (!sp || !spec) return null;
  const fed = daysSince(sp.fedDay, day);
  const premolt = isPremolt(sp);
  const freshMolt = sp.moltDay === day;
  return (
    <div
      className="fixed inset-0 z-40 overflow-y-auto bg-[#2e3432]/92 px-3 pt-4 pb-10 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={`${spec.common} tank`}
    >
      <div className="mx-auto max-w-[520px]">
        <div className="mb-3 flex items-start justify-between gap-3 text-[#efe6d8]">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d8dce0]/75">
              {sp.tag} · {STAGE_LABEL[sp.stage]} · <SexMark sex={sp.sex} /> · worth {fairAsk(sp)}
            </p>
            <h2 className="font-display truncate text-2xl leading-tight">{spec.common}</h2>
            <p className="text-xs italic text-[#d8dce0]/80">
              {spec.latin} · {spec.temper} · {spec.life}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0 rounded-full text-[#efe6d8] hover:bg-white/10"
            onClick={close}
            aria-label="Close tank"
          >
            <X className="size-5" />
          </Button>
        </div>
        <Tank key={sp.id} sp={sp} spec={spec} />
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase text-[#d8dce0]/80">
          <span>{fed === 0 ? "Fed today" : `Fed ${fed}d ago`}</span>
          {premolt ? <span className="text-[#e8a0b8]">Premolt · molts tonight</span> : null}
          {freshMolt ? (
            <span className="text-[#e8a0b8]">Molted last night · skin's in the tank</span>
          ) : null}
          {!sp.wild && !sp.inBreed ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 rounded-full px-3 text-[11px] text-[#efe6d8] hover:bg-white/10"
              onClick={() => listSpider(sp.id, !sp.listed)}
            >
              {sp.listed ? "Take out of window" : "Put in window"}
            </Button>
          ) : null}
        </div>
        <p className="mt-3 text-center text-xs text-[#d8dce0]/60">
          Tap the tarantula to poke it. Tap the substrate and it'll turn toward the vibration.
        </p>
      </div>
    </div>
  );
}
