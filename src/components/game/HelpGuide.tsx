import { useState } from "react";

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "The table",
    body: "Window is live stock guests can buy. Rack is everything else — tap a chip to list it. Wall portraits come later. First morning: list, Open, trade, Tend, Sleep.",
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
    body: "If they asked for a species they still pay around fair (15% ceiling). Browsers only take what's in the window. Pass if you don't want the deal.",
  },
  {
    title: "Elizabeth",
    body: "Hire after extra glass and two hatches (35 chips). Fill the window, then tap Elizabeth has the till. She sells listed stock, skips Aggressive unless the guest is a keeper, tends jars, and leaves a slip in Notes. That locks Open for the day and unlocks the Trail.",
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
    body: "Buy slings and juvs the shop has unlocked. Feeder pack is always there. Feeder crate (28) shows after the second address. Don't blow your chips on adults you can't house.",
  },
  {
    title: "Upgrades",
    body: "Overnight glass: 6 panes. Back counter: 10 panes + Elizabeth. Second address: 18 panes and warehouse racks (72 / 36 / 18). Guest line grows slower (3 → 7).",
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
        className="fixed right-4 bottom-[4.5rem] z-40 flex size-11 items-center justify-center rounded-full border-2 border-[#5aa8a0] bg-[#d8dce0] text-lg font-display text-[#3a3a3c] shadow-[0_6px_0_#4a524e] lg:bottom-4"
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
