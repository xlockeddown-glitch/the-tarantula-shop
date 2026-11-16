import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bug, Droplets, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { careDue, daysSince, needsMist, needsWaterBowl } from "@/lib/game/care";
import {
  assessBuild,
  buildCost,
  DEEP_OPT,
  draftOf,
  HIDE_OPTS,
  passScore,
  sameBuild,
  blankDraft,
  SUB_OPTS,
  VENT_OPT,
  VESSEL_OPTS,
  WATER_OPTS,
  type BuildDraft,
} from "@/lib/game/enclosure";
import { paintOf } from "@/lib/game/look";
import {
  adoptBlockReason,
  isPremolt,
  STAGE_LABEL,
  spiderById,
  fairAsk,
  type OwnedSpider,
  type SpiderSpecies, WELL_KEPT_SCORE } from "@/lib/game/spiders";
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
  const noteHandFeed = useGame((s) => s.noteHandFeed);
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
  const hungry = careDue(sp, spec, day).includes("feed");
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
      hungry,
      premolt,
      seed: hashSeedText(sp.id),
    });
    if (freshMolt)
      worldRef.current.caption = "Fresh out of its old skin. Fangs are still soft. No food today.";
  }

  // Keep world flags in step with the save.
  useEffect(() => {
    const w = worldRef.current!;
    w.hungry = hungry;
    w.premolt = premolt;
    look.current.premolt = premolt;
  }, [hungry, fedToday, premolt, freshMolt, grimy]);

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
        if (e === "ate") {
          const hadFeeder = useGame.getState().feeders >= 1;
          tend(sp.id, "feed");
          if (hadFeeder) noteHandFeed();
        }
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
        : !hungry && !premolt
          ? "Not hungry yet"
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
            disabled={freshMolt || fedToday || feeders < 1 || eating || (!hungry && !premolt)}
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

function BenchChip({
  label,
  cost,
  on,
  onPick,
}: {
  label: string;
  cost: string;
  on: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onPick}
      className={`flex min-h-9 items-center gap-1.5 rounded-full border-2 px-3 text-left text-xs leading-tight ${
        on
          ? "border-[#3a3a3c] bg-[#3a3a3c] text-[#efe6d8]"
          : "border-[#3a3a3c]/25 bg-[#f4eee6] text-[#3a3a3c]"
      }`}
    >
      <span>
        {on ? "✓ " : ""}
        {label}
      </span>
      <span className="font-mono text-[10px]">{cost}</span>
    </button>
  );
}

function BenchRow({
  title,
  notes,
  children,
}: {
  title: string;
  notes: string[];
  children: ReactNode;
}) {
  return (
    <div className="mt-3">
      <p className="font-mono text-[10px] uppercase tracking-wide text-[#6a6560]">{title}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">{children}</div>
      {notes
        .filter((n) => n.length > 0)
        .map((n) => (
          <p key={n} className="mt-1 text-[11px] leading-snug text-[#6a6560]">
            {n}
          </p>
        ))}
    </div>
  );
}

function OptionRow<T extends string>({
  title,
  opts,
  value,
  onPick,
}: {
  title: string;
  opts: { id: T; label: string; cost: number; note: string }[];
  value: T;
  onPick: (id: T) => void;
}) {
  return (
    <BenchRow title={title} notes={[opts.find((o) => o.id === value)?.note ?? ""]}>
      {opts.map((o) => (
        <BenchChip
          key={o.id}
          label={o.label}
          cost={String(o.cost)}
          on={o.id === value}
          onPick={() => onPick(o.id)}
        />
      ))}
    </BenchRow>
  );
}

function SetupBench({
  sp,
  spec,
  onClose,
}: {
  sp: OwnedSpider;
  spec: SpiderSpecies;
  onClose: () => void;
}) {
  const cash = useGame((s) => s.cash);
  const installBuild = useGame((s) => s.installBuild);
  const [draft, setDraft] = useState<BuildDraft>(() =>
    sp.build ? draftOf(sp.build) : blankDraft(spec, sp.stage),
  );
  const need = passScore(spec);
  const report = assessBuild(spec, sp.stage, draft);
  const same = !!sp.build && sameBuild(sp.build, draft);
  const cost = same ? 0 : buildCost(draft);
  const short = cash < cost;
  return (
    <div className="rounded-[14px] bg-[#efe6d8] p-3 text-left text-[#3a3a3c]">
      <p className="font-mono text-[11px] uppercase tracking-wide text-[#6a6560]">
        {sp.build ? `Current setup ${sp.build.score}/10` : "Shop default setup"}
      </p>
      <OptionRow
        title="Vessel"
        opts={VESSEL_OPTS}
        value={draft.vessel}
        onPick={(vessel) => setDraft((d) => ({ ...d, vessel }))}
      />
      <OptionRow
        title="Substrate"
        opts={SUB_OPTS}
        value={draft.substrate}
        onPick={(substrate) => setDraft((d) => ({ ...d, substrate }))}
      />
      <BenchRow
        title="Extras"
        notes={[`${VENT_OPT.label}: ${VENT_OPT.note}`, `${DEEP_OPT.label}: ${DEEP_OPT.note}`]}
      >
        <BenchChip
          label={VENT_OPT.label}
          cost={`+${VENT_OPT.cost}`}
          on={draft.vent}
          onPick={() => setDraft((d) => ({ ...d, vent: !d.vent }))}
        />
        <BenchChip
          label={DEEP_OPT.label}
          cost={`+${DEEP_OPT.cost}`}
          on={draft.deep}
          onPick={() => setDraft((d) => ({ ...d, deep: !d.deep }))}
        />
      </BenchRow>
      <OptionRow
        title="Hide"
        opts={HIDE_OPTS}
        value={draft.hide}
        onPick={(hide) => setDraft((d) => ({ ...d, hide }))}
      />
      <OptionRow
        title="Water"
        opts={WATER_OPTS}
        value={draft.water}
        onPick={(water) => setDraft((d) => ({ ...d, water }))}
      />
      <div className="sticky bottom-2 z-10 mt-3 rounded-[12px] border border-[#3a3a3c]/15 bg-[#f4eee6] p-2.5 shadow-[0_4px_0_#8a8680]">
        <p className="font-mono text-[11px] uppercase text-[#3a3a3c]" aria-live="polite">
          {report.score}/10 · needs {need}
          {report.score >= WELL_KEPT_SCORE ? " · well kept: +10% value" : ` · ${WELL_KEPT_SCORE}+ is well kept (+10%)`}
        </p>
        {report.misses.length ? (
          <ul className="mt-1 space-y-0.5 text-xs text-[#3a3a3c]">
            {report.misses.map((m) => (
              <li key={m}>• {m}</li>
            ))}
          </ul>
        ) : null}
        {short ? (
          <p className="mt-1 text-xs text-[#3a3a3c]">
            Need {cost} chips. You have {cash}.
          </p>
        ) : null}
        <div className="mt-2 flex justify-center gap-2">
          <Button
            size="sm"
            className="rounded-full"
            disabled={report.score < need || short}
            onClick={() => {
              installBuild(sp.id, draft);
              const now = useGame.getState().colony.find((c) => c.id === sp.id)?.build;
              if (now && sameBuild(now, draft)) onClose();
            }}
          >
            Install · {same ? "free" : cost}
          </Button>
          <Button size="sm" variant="ghost" className="rounded-full" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function PetAdoption({ sp, spec }: { sp: OwnedSpider; spec: SpiderSpecies }) {
  const colony = useGame((s) => s.colony);
  const adoptPet = useGame((s) => s.adoptPet);
  const [open, setOpen] = useState(false);
  const [bench, setBench] = useState(false);
  const [name, setName] = useState("");
  const canAdopt = !sp.personal && adoptBlockReason(colony, sp.id) === null;
  const canSetup = !sp.wild;
  if (!canAdopt && !canSetup) return null;
  return (
    <div className="mt-3 text-center">
      {bench && canSetup ? (
        <SetupBench sp={sp} spec={spec} onClose={() => setBench(false)} />
      ) : open && canAdopt ? (
        <div className="rounded-[14px] bg-[#efe6d8] p-3 text-[#3a3a3c]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder="Name it"
            aria-label="Shop pet name"
            autoFocus
            className="h-11 w-full rounded-full border border-[#3a3a3c]/25 bg-[#f4eee6] px-4 text-base outline-none focus:border-[#5aa8a0]"
          />
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {["Miso", "Pip", "Velvet", "Biscuit"].map((chip) => (
              <Button
                key={chip}
                size="sm"
                variant="secondary"
                className="rounded-full"
                onClick={() => setName(chip)}
              >
                {chip}
              </Button>
            ))}
          </div>
          <p className="mt-3 text-sm text-[#6a6560]">
            Not for sale after this. You'd give up about {fairAsk(sp)} chips.
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <Button size="sm" className="rounded-full" onClick={() => adoptPet(sp.id, name)}>
              Keep
            </Button>
            <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          {canAdopt ? (
            <Button size="sm" variant="secondary" className="rounded-full" onClick={() => setOpen(true)}>
              Keep as shop pet
            </Button>
          ) : null}
          {canSetup ? (
            <Button size="sm" variant="secondary" className="rounded-full" onClick={() => setBench(true)}>
              Setup
            </Button>
          ) : null}
        </div>
      )}
    </div>
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
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d8dce0]/90">
              {sp.personal ? (
                <>{sp.name} · Shop pet</>
              ) : (
                <>{sp.tag} · {STAGE_LABEL[sp.stage]} · <SexMark sex={sp.sex} /> · worth {fairAsk(sp)}</>
              )}
            </p>
            <h2 className="font-display truncate text-2xl leading-tight">{spec.common}</h2>
            <p className="text-xs italic text-[#d8dce0]/90">
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
        <PetAdoption key={`pet-${sp.id}`} sp={sp} spec={spec} />
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase text-[#d8dce0]/90">
          <span>{fed === 0 ? "Fed today" : careDue(sp, spec, day).includes("feed") ? "Hungry" : `Fed ${fed}d ago`}</span>
          {premolt ? <span className="text-[#e8a0b8]">Premolt · molts tonight</span> : null}
          {freshMolt ? (
            <span className="text-[#e8a0b8]">Molted last night · skin's in the tank</span>
          ) : null}
          {sp.personal ? (
            <span>Not for sale</span>
          ) : !sp.wild && !sp.inBreed ? (
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
        <p className="mt-3 text-center text-xs text-[#d8dce0]/90">
          Tap the tarantula to poke it. Tap the substrate and it'll turn toward the vibration.
        </p>
      </div>
    </div>
  );
}
