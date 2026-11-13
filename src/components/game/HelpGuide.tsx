import { useState } from "react";

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "The table",
    body: "Window is live stock guests can buy. Rack is everything else — tap a chip to list it. Pin felt portraits from the Binder when you unlock them — they hang behind the shop, not for sale. First morning: list, Open, trade, Tend, Sleep.",
  },
  {
    title: "The wall",
    body: "Unlock a Window or Pair portrait in the binder, then Pin. It hangs behind the shop like the title cards — not for sale. Click it to take it down. Next Open, a guest comes looking for that species. List a live one if you want the sale.",
  },
  {
    title: "Window vs rack",
    body: "Click a rack card to list it in the window. Click a window card to pull it back. Rack faces are felt chips (the animal). Binder and wall keep the framed Window / Pair portraits. Panes: 4 → 6 → 10 → 18. Guests do not match pane count — more glass is display, not more buyers.",
  },
  {
    title: "Open / close / sleep",
    body: "Open seats guests once per day — you run the line. Close ends it until Sleep. Sleep advances the night. You cannot Open and hunt the same day.",
  },
  {
    title: "Breed pair",
    body: "Need an adult female and male of the same species on the rack (not in the window). Introduce. Some pairs rest, fail, or the male is eaten. When the sac is ready, Collect on Racks.",
  },
  {
    title: "Care",
    body: "On the table, tap Tend all before Sleep. Jars show due on the card. Beginners forgive several skipped nights. Nothing dies the first four days. Empty cribs need nothing.",
  },
  {
    title: "Guests",
    body: "Name your price. Their offer always sells. Fair usually does. Push risks it: they may counter once with their real number (take it or not), or walk. Read the tag and the line under their name — bargain hunters walk on a push, collectors often pay it.",
  },
  {
    title: "Tanks",
    body: "Tap the eye on any card (or Look in Racks) to open its tank. Drop a cricket and watch it hunt — that's a feed. Fill the dish, mist, wipe the glass. Tap the tarantula to poke it: docile ones flinch (poke twice and they kick hairs), skittish ones bolt, defensive ones rear up. Premolt animals go dark and refuse food. The morning after a molt, the shed skin lies in the tank and the fangs are still soft: no food that day. Neither counts as a missed feed.",
  },
  {
    title: "Goals",
    body: "The strip under the header always shows one goal, with a chip reward. Tap it to jump to where you'd do it. The first few walk you through selling, hand-feeding, haggling and requests. After that they follow what the shop needs, like restocking when the racks run low. Swap once a day if you don't like one. Missing a goal costs nothing.",
  },
  {
    title: "Requests",
    body: "The Requests board on the table lists people who want an exact animal (stage and sex) and pay about a third over fair. Buy or grow one before the days run out, then Ship. Nothing is lost if a request lapses. A guest who wants something you don't have can leave their number: they come back in a few days and offer a little more each visit, up to three times.",
  },
  {
    title: "Mornings",
    body: "Overnight molts, truck lots and losses are dealt as cards when you wake. A sling's first molt shows its sex. Tap to flip. Females are worth about half again as much.",
  },
  {
    title: "Elizabeth",
    body: "Hire after extra glass and two hatches (35 chips). Fill the window, then tap Elizabeth has the till. She sells listed stock, skips defensive / old-world stock unless the guest is a keeper, tends jars, and leaves a slip in Notes. That locks Open for the day and unlocks the Trail.",
  },
  {
    title: "Felt trail",
    body: "Only after she has the till. The shop mat goes away. Draw a felt color card (three a day): hop the pawn along the candy path. Landmarks (Log, Wash, Hollow, Mouth) are better finds. Sticky silk ends the walk. Pink print can turn up a species you haven't unlocked. Pawn stays overnight; Mouth loops back to the Yard.",
  },
  {
    title: "Binder cards",
    body: "Teal Window card: sell that species 3 times. Pink Pair card: hatch 5 good clutches of it. Pin an unlocked portrait to the shop wall.",
  },
  {
    title: "Truck",
    body: "Buy slings and juvs the shop has unlocked. Feeder pack is always there. Feeder crate (28 for 8 chips) shows once you have the Back counter. Don't blow your chips on adults you can't house.",
  },
  {
    title: "Upgrades",
    body: "Overnight glass: 6 panes. Back counter: 10 panes. (Elizabeth can hire after Overnight glass + two hatches.) Second address: 18 panes and warehouse racks (72 slings / 36 juveniles / 18 adults). Guest line grows slower (3 → 7).",
  },
];

export function HelpGuide() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Help"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-[4.5rem] z-40 flex size-11 items-center justify-center rounded-full border-2 border-[#5aa8a0] bg-[#d8dce0] text-lg font-display text-[#3a3a3c] shadow-[0_6px_0_#4a524e]"
      >
        ?
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#3a3a3c]/40 p-3 sm:items-center" onClick={() => setOpen(false)}>
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-[20px] border-4 border-[#5aa8a0] bg-[#d8dce0] p-5 shadow-[0_16px_0_#4a524e]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-wide text-[#5aa8a0]">Keeper notes</p>
              <button type="button" className="rounded-full px-3 py-1 text-sm text-[#6a6560]" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <h2 className="font-display text-3xl text-[#3a3a3c]">The Tarantula Shop</h2>
            <ol className="mt-4 space-y-4">
              {SECTIONS.map((s) => (
                <li key={s.title}>
                  <p className="font-medium text-[#3a3a3c]">{s.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#5a5652]">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </>
  );
}
