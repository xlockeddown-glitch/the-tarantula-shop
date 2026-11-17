# Roadmap

The goal right now is **hook**: give new players a reason to come back for day 2, day 5 and day 20.
Ordered by impact for effort. IDs (D#, I#) point back to the Gemini design review and the GPT-6.1 ideas pass.

## Now

1. **Daily trend (I3, D11).** One headline per day on a three-day rotation (arboreal craze, payday collectors, ground-dweller spotlight). It tilts half of fresh walk-ins only and never changes prices or orders. Derived from the day number, so reloading can't reroll it.
2. **Insured first hatch.** Protect a new player's first clutch so one bad roll doesn't end the run early.

## Next

3. **Tune setup cost** against the +10% well-kept bonus, based on playtest notes.
4. **Sex shown on truck lots**, so wholesale buying isn't a blind guess.
5. **Mature males on the Truck (D6).** Sometimes offer a sexed adult (mostly males) at about 1.2× once the shop has its first upgrade, so losing a mate isn't a two-week soft lock.
6. **Every wall pin draws guests (D9).** Today only the first pinned card attracts a matching guest.
7. **Binder: Pair card at 3 clutches, not 5, plus a filter (D10).** All / Unlocked / In stock.
8. **Neglect-clock rework.** Make care mistakes easier to see coming and fairer to recover from.

## Later

9. **Haggling reacts to the animal (D11).** Guests pay more for females, well-kept animals and species that match a wall pin.
10. **Trail landmarks: press on or keep it (D12).** A small push-your-luck choice at Log, Wash, Hollow and Mouth.

## Cleanup

- Fix the `scripts/` tests that fail on main (excluded from `check:local` for now).
- Lint: `served` should be `const` in `store.ts`.

## Done

| Version | What shipped |
| --- | --- |
| 0.1.04 | Haggling and the morning reveal |
| 0.1.05 | Tank view with a drawn, animated tarantula |
| 0.1.06 | Molt scene |
| 0.1.07 | One-button day loop and the Requests board |
| 0.1.08 | Goal strip |
| 0.1.09 | Gemini review round: 10 bug fixes, UI and accessibility pass, Day-1 economy (D1), Collect sac and badges on the table (D2), guests above the fold (D3), care cadence (D5), first-upgrade gate at 1 hatch (D6), longer request windows (D8), keeper-level tag on guests (D9), softer Sticky silk (D12) |
| 0.1.10 | Shop pet (I1, D7) |
| 0.1.11 | Setup bench (I2, D13), Rehouse holds, well-kept bonus |
| — | `npm run check:local` and a pre-push hook |
| 0.1.12 | Morning summary card every day; unlock card when a new species tier opens (D4) |
