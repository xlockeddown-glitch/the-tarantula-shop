import type { SpiderSex } from "@/lib/game/spiders";

export function SexMark({ sex }: { sex: SpiderSex }) {
  if (sex === "f") {
    return (
      <span className="inline-flex text-[#e890b0]" style={{ textShadow: "0 0 6px #e8a0b8, 0 0 1px #fff" }} title="Female">
        ♀
      </span>
    );
  }
  if (sex === "m") {
    return (
      <span className="inline-flex text-[#7eb4e8]" style={{ textShadow: "0 0 6px #6aa8e0, 0 0 1px #fff" }} title="Male">
        ♂
      </span>
    );
  }
  return <span className="text-[#6a6560]">?</span>;
}
