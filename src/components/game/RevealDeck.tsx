import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { feltCardArt, paintOf } from "@/lib/game/look";
import { drawMoltScene, MOLT_SECONDS } from "@/lib/game/tankDraw";
import { hashSeedText } from "@/lib/game/tankSim";
import type { RevealCard } from "@/lib/game/reveal";
import { spiderById, STAGE_LABEL } from "@/lib/game/spiders";
import { useGame } from "@/lib/game/store";

/** Cards that are worth a tap to flip. Everything else deals face-up. */
function wantsFlip(card: RevealCard) {
  return card.kind === "molt" || card.kind === "sac";
}

/** The overnight molt, played on the back of the card before it flips. */
function MoltCanvas({
  speciesId,
  seed,
  onDone,
}: {
  speciesId: string;
  seed: string;
  onDone: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const canvas = ref.current!;
    const g = canvas.getContext("2d")!;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const px = Math.round(canvas.getBoundingClientRect().width * dpr);
    canvas.width = px;
    canvas.height = px;
    const look = {
      paint: paintOf(speciesId),
      curly: speciesId === "tliltocatl-albopilosus",
      water: 0,
      mistAge: Infinity,
      grime: 0,
      premolt: false,
      seed: hashSeedText(seed),
    };
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const t0 = performance.now();
    let fired = false;
    const tick = (now: number) => {
      const t = reduce ? MOLT_SECONDS : Math.min(MOLT_SECONDS, (now - t0) / 1000);
      drawMoltScene(g, px, t, look, 1.9);
      if (t >= MOLT_SECONDS - 0.6 && !fired) {
        fired = true;
        done.current();
      }
      if (t < MOLT_SECONDS) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speciesId, seed]);
  return (
    <canvas ref={ref} className="block aspect-square w-full rounded-[14px]" aria-hidden="true" />
  );
}

function backLabel(card: RevealCard) {
  if (card.kind === "sac") return "Egg sac";
  if (card.kind === "molt") return "Molted overnight";
  return "Overnight";
}

function backHint(card: RevealCard) {
  if (card.kind === "sac") return "Tap to open it up";
  if (card.kind === "molt" && card.sexReveal) return "Tap to check the sex";
  return "Tap to see it";
}

function Sparkles({ color }: { color: string }) {
  const bits = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    const r = 90 + (i % 3) * 30;
    return { dx: Math.cos(a) * r, dy: Math.sin(a) * r, d: (i % 4) * 40 };
  });
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {bits.map((b, i) => (
        <span
          key={i}
          className="sparkle absolute size-2.5 rounded-full"
          style={{
            backgroundColor: color,
            ["--dx" as string]: `${b.dx}px`,
            ["--dy" as string]: `${b.dy}px`,
            animationDelay: `${b.d}ms`,
          }}
        />
      ))}
    </div>
  );
}

function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (to <= 0) return;
    const step = Math.max(1, Math.ceil(to / 28));
    const t = setInterval(
      () => setN((v) => (v + step >= to ? (clearInterval(t), to) : v + step)),
      32,
    );
    return () => clearInterval(t);
  }, [to]);
  return <>{n}</>;
}

function FaceBody({ card }: { card: RevealCard }) {
  const spec = spiderById(card.speciesId);
  const name = spec?.common ?? card.speciesId;
  switch (card.kind) {
    case "molt": {
      if (card.sexReveal) {
        const female = card.sex === "f";
        return (
          <>
            <div
              className={`reveal-pop font-display text-7xl leading-none ${female ? "text-[#e890b0]" : "text-[#7eb4e8]"}`}
            >
              {female ? "♀" : "♂"}
            </div>
            <p className="mt-2 font-display text-2xl text-[#3a3a3c]">
              {female ? "It's a girl!" : "A little male."}
            </p>
            <p className="mt-1 text-sm text-[#5a5652]">
              {card.tag} molted to {STAGE_LABEL[card.to].toLowerCase()}.{" "}
              {female
                ? "Females are the ones keepers hunt for."
                : "Breeding stock, or a quick sale."}
            </p>
            <p className="mt-2 font-mono text-sm text-[#3a3a3c]">
              Worth {card.before} →{" "}
              <span className={female ? "text-[#c47858]" : ""}>{card.after}</span>
            </p>
          </>
        );
      }
      return (
        <>
          <p className="font-display text-2xl text-[#3a3a3c]">
            Molted to {STAGE_LABEL[card.to].toLowerCase()}
          </p>
          <p className="mt-1 text-sm text-[#5a5652]">
            {card.tag} · {name}. Worth {card.before} → {card.after}.
          </p>
        </>
      );
    }
    case "sac":
      return (
        <>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#6a6560]">
            Slings in the cups
          </p>
          <p className="reveal-pop font-display text-6xl leading-none text-[#3a3a3c]">
            <CountUp to={card.eggs} />
          </p>
          <p className="mt-2 text-sm text-[#5a5652]">
            {card.unlocked
              ? "Fifth good clutch. The pair card is in your binder!"
              : `${card.progress}/5 clutches toward the ${name} pair card.`}
          </p>
        </>
      );
    case "collapse":
      return (
        <>
          <p className="font-display text-2xl text-[#3a3a3c]">The sac collapsed</p>
          <p className="mt-1 text-sm text-[#5a5652]">
            Nothing viable in it. She'll be ready to try again after a rest.
          </p>
        </>
      );
    case "loss":
      return (
        <>
          <p className="font-display text-2xl text-[#c45c6a]">Didn't make the night</p>
          <p className="mt-1 text-sm text-[#5a5652]">
            {card.tag} · {name}. Too many days skipped. Tend before you sleep.
          </p>
        </>
      );
    case "truck":
      return (
        <>
          <p className="font-display text-2xl text-[#3a3a3c]">Truck's here</p>
          <p className="mt-1 text-sm text-[#5a5652]">
            {card.n} {name} slings off the dock and into cups.
          </p>
        </>
      );
    case "held":
      return (
        <>
          <p className="font-display text-2xl text-[#3a3a3c]">Held its molt</p>
          <p className="mt-1 text-sm text-[#5a5652]">
            {card.tag} · {name}.{" "}
            {card.reason === "crib"
              ? "Needs a bigger crib. Expand or sell."
              : "Didn't like the setup. Rebuild on the bench."}
          </p>
        </>
      );
  }
}

function Card({
  card,
  flipped,
  onFlip,
}: {
  card: RevealCard;
  flipped: boolean;
  onFlip: () => void;
}) {
  const flipTap = wantsFlip(card);
  const [played, setPlayed] = useState(false);
  const spec = spiderById(card.speciesId);
  const female = card.kind === "molt" && card.sexReveal && card.sex === "f";
  const ring =
    card.kind === "loss"
      ? "#c45c6a"
      : female
        ? "#e8a0b8"
        : card.kind === "molt" && card.sexReveal
          ? "#7eb4e8"
          : card.kind === "sac"
            ? "#c4a04a"
            : "#5aa8a0";
  return (
    <div className="deal-in flip-card relative mx-auto h-[min(68dvh,520px)] w-[min(86vw,340px)]">
      <button
        type="button"
        className={`flip-inner block size-full ${flipped ? "is-flipped" : ""}`}
        onClick={onFlip}
        disabled={flipped}
        aria-label={flipped ? `${spec?.common ?? "Card"} revealed` : backHint(card)}
      >
        <div
          aria-hidden={flipped}
          className={`flip-face flip-back flex flex-col items-center justify-center rounded-[22px] border-4 border-[#efe6d8] shadow-[0_16px_0_#2e3432] ${flipTap && card.kind !== "molt" ? "premolt" : ""}`}
          style={{ backgroundImage: "url(/game/felt/mat.webp)", backgroundSize: "cover" }}
        >
          {card.kind === "molt" ? (
            <div className="w-[88%] rounded-[18px] bg-[#efe6d8]/92 p-3 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#6a6560]">
                {backLabel(card)}
              </p>
              <div className="mt-2">
                <MoltCanvas
                  speciesId={card.speciesId}
                  seed={card.id}
                  onDone={() => setPlayed(true)}
                />
              </div>
              <p className="mt-2 font-display text-lg text-[#3a3a3c]">{spec?.common}</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-[#c47858]">
                {played ? backHint(card) : "Crawling out of the old skin…"}
              </p>
            </div>
          ) : (
            <div className="rounded-[18px] bg-[#efe6d8]/92 px-6 py-5 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#6a6560]">
                {backLabel(card)}
              </p>
              <p className="font-display mt-1 text-7xl leading-none text-[#3a3a3c]">?</p>
              <p className="mt-2 font-display text-lg text-[#3a3a3c]">{spec?.common}</p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-wide text-[#c47858]">
                {backHint(card)}
              </p>
            </div>
          )}
        </div>
        <div
          className="flip-face flip-front flex flex-col overflow-hidden rounded-[22px] border-4 bg-[#efe6d8] shadow-[0_16px_0_#2e3432]"
          style={{ borderColor: ring }}
        >
          <div className="relative min-h-0 flex-1">
            <img
              src={feltCardArt(card.speciesId, "sale")}
              alt={spec?.common ?? ""}
              className={`size-full object-cover ${card.kind === "loss" ? "grayscale" : ""}`}
            />
          </div>
          <p className="pt-1.5 text-center text-xs italic text-[#6a6560]">{spec?.latin}</p>
          <div className="px-4 pt-2 pb-4 text-center">
            {flipped ? <FaceBody card={card} /> : null}
          </div>
        </div>
      </button>
      {flipped && (female || (card.kind === "sac" && card.eggs > 0)) ? (
        <Sparkles color={female ? "#e8a0b8" : "#c4a04a"} />
      ) : null}
    </div>
  );
}

export function RevealDeck() {
  const reveals = useGame((s) => s.reveals);
  const morning = useGame((s) => s.morning);
  const next = useGame((s) => s.nextReveal);
  const clear = useGame((s) => s.clearReveals);
  const [seen, setSeen] = useState(0);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const top = reveals[0];
  useEffect(() => {
    if (!top) setSeen(0);
  }, [top]);
  if (!top) return null;
  const flipped = !wantsFlip(top) || flippedId === top.id;
  const total = seen + reveals.length;
  const last = reveals.length === 1;
  const isMorning = !!morning && top.kind !== "sac" && top.kind !== "collapse";
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 overflow-y-auto bg-[#2e3432]/88 px-4 py-6 backdrop-blur-[2px]">
      <div className="text-center text-[#efe6d8]">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#d8dce0]/80">
          {isMorning ? `Morning · Day ${morning!.day}` : "On the bench"} · {seen + 1} of {total}
        </p>
        {isMorning && seen === 0 ? (
          <p className="mt-1 font-mono text-xs text-[#d8dce0]/70">
            {morning!.rent
              ? `Rent −${morning!.rent}`
              : morning!.day <= 3
                ? "No rent yet"
                : "Rent waived"}
            {morning!.late ? ` · Late slips −${morning!.late}` : ""} · {morning!.cash} chips in the
            till
          </p>
        ) : null}
      </div>
      <Card key={top.id} card={top} flipped={flipped} onFlip={() => setFlippedId(top.id)} />
      <div
        className={`flex items-center gap-2 transition-opacity ${flipped ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <Button
          size="lg"
          className="rounded-full bg-[#c47858] px-7 text-[#efe6d8] hover:bg-[#b46848]"
          onClick={() => {
            setSeen((n) => n + 1);
            next();
          }}
        >
          {last ? (isMorning ? "Start the day" : "Back to the table") : "Next card"}
        </Button>
        {!last ? (
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full text-[#d8dce0] hover:bg-white/10 hover:text-[#efe6d8]"
            onClick={clear}
          >
            Skip all
          </Button>
        ) : null}
      </div>
    </div>
  );
}
