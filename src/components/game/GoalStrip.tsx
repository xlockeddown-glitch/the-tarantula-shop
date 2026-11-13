import { useEffect } from "react";
import { Target } from "lucide-react";
import { careDue } from "@/lib/game/care";
import { progress } from "@/lib/game/goals";
import { spiderById } from "@/lib/game/spiders";
import { goalSnapshot, useGame } from "@/lib/game/store";

/** One goal at a time, under the header. Checks itself whenever the save changes. */
export function GoalStrip() {
  const goal = useGame((s) => s.goal);
  const day = useGame((s) => s.day);
  const swapDay = useGame((s) => s.goalSwapDay);
  const swap = useGame((s) => s.swapGoal);
  const setView = useGame((s) => s.setView);
  const openTank = useGame((s) => s.openTank);
  const done = useGame((s) => (s.goal ? progress(s.goal, goalSnapshot(s)) : 0));

  useEffect(() => {
    let queued = false;
    const run = () => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        useGame.getState().checkGoal();
      });
    };
    run();
    return useGame.subscribe(run);
  }, []);

  if (!goal) return null;

  const go = () => {
    const s = useGame.getState();
    if (goal.kind === "truck" || goal.kind === "order") setView("wholesale");
    else if (goal.kind === "handfeed") {
      const hungry = s.colony.find((c) => {
        const spec = spiderById(c.speciesId);
        return !c.personal && spec ? careDue(c, spec, s.day).includes("feed") : false;
      });
      if (hungry) openTank(hungry.id);
    } else setView("world");
  };

  return (
    <div className="mt-2 flex items-center gap-2 rounded-full bg-[#3a3a3c]/35 py-1 pr-1 pl-3">
      <Target className="size-4 shrink-0 text-[#f2d58a]" aria-hidden="true" />
      <button type="button" onClick={go} className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm leading-tight">{goal.text}</span>
        <span className="block font-mono text-[10px] uppercase text-[#d8dce0]/80">
          {goal.n > 1 ? `${done}/${goal.n} · ` : ""}
          {goal.dueDay <= day ? "today" : `by day ${goal.dueDay}`} · +{goal.reward.chips} chips
          {goal.reward.feeders ? ` · +${goal.reward.feeders} crickets` : ""}
        </span>
      </button>
      {swapDay !== day ? (
        <button
          type="button"
          onClick={swap}
          className="shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase text-[#d8dce0] hover:bg-white/10"
          title="Swap for a different goal (once a day)"
        >
          Swap
        </button>
      ) : null}
    </div>
  );
}
