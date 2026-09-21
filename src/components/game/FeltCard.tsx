import { feltCardArt } from "@/lib/game/look";
import { KIND_LABEL, pairNick, type SpiderSpecies } from "@/lib/game/spiders";

export function FeltPlate({
  spec,
  unlocked,
  progress,
  kind,
}: {
  spec: SpiderSpecies;
  unlocked: boolean;
  progress: number;
  kind: "sale" | "breed";
}) {
  const sale = kind === "sale";
  const frame = sale ? "#5aa8a0" : "#c45c6a";
  const need = sale ? "3 sales" : "5 clutches";
  const art = feltCardArt(spec.id, kind);

  return (
    <div className="group [perspective:900px]">
      <div
        className={`relative h-60 w-[10.5rem] origin-center overflow-hidden rounded-[16px] transition duration-300 group-hover:[transform:rotateY(-8deg)_rotateX(5deg)] ${unlocked ? "" : "grayscale"}`}
      >
        <img src={art} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="pointer-events-none absolute inset-0 rounded-[16px]" style={{ boxShadow: `inset 0 0 0 6px ${frame}` }} />
        {!unlocked ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#3a3a3c]/45 px-2 text-center font-mono text-[10px] uppercase tracking-wide text-[#efe6d8]">
            {progress}/{sale ? 3 : 5}
            <br />
            {need}
          </div>
        ) : null}
        <span
          className="absolute top-2 left-1/2 max-w-[90%] -translate-x-1/2 truncate rounded-full px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-[#efe6d8]"
          style={{ background: frame }}
        >
          {sale ? "Window" : pairNick(spec)}
        </span>
        <div className="absolute inset-x-2 bottom-2 rounded-[10px] bg-[#efe6d8]/95 px-1.5 py-1 text-center">
          <p className="truncate text-[11px] font-medium leading-tight text-[#3a3a3c]">{unlocked ? (sale ? spec.common : pairNick(spec)) : "????"}</p>
          <p className="font-mono text-[8px] uppercase text-[#6a6560]">
            {unlocked ? (sale ? (KIND_LABEL[spec.kind] ?? spec.kind) : "clutch") : need}
          </p>
        </div>
      </div>
    </div>
  );
}