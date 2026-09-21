# The Tarantula Shop

A cozy felt-table game about running a real-species tarantula shop. You list stock in the window, breed a pair when you can, hang portraits you earn, and — once Elizabeth has the till — walk a candy-colored trail looking for wild slings.

Version **0.1.00**. Early and playable. Not a finished commercial release.

## How a day goes

1. Pick a starter pack. An adult pair stays on the rack to breed. Juveniles fill the window so you can sell on day one.
2. **Open shop.** Guests only buy what’s listed in the window. Trade or pass.
3. **Close**, then **Tend all** (feed and water).
4. **Sleep.** Rent comes due. Molts happen overnight.
5. When you can, **Introduce** an adult female and male of the same species. Collect the sac from Racks when it’s ready.
6. Hire **Elizabeth** after extra glass and two hatches. She runs Open and tends jars. That day you can take the **Trail** instead.

The `?` in the corner is the rest of the rules.

## The table

| Row | What it is |
|---|---|
| Window | Live animals for sale. Tap a rack chip to list one. |
| Rack | Everything else. Same species, stage, and sex stack with an ×N badge. |
| Wall | Felt portraits you unlock — not for sale. They hang above the shop. |
| Binder | Window card at 3 sales of a species. Pair card at 5 good clutches. Pin from here. |

Chips are currency. The Truck sells slings and juveniles of species you’ve unlocked.

## Versioning

We count in **0.0.01** steps, with a two-digit patch:

`0.1.00` → `0.1.01` → … → `0.1.99` → `0.2.00`

The number lives in `src/lib/game/version.ts` (`GAME_VERSION`) and `package.json`. Keep those two in lockstep. It also shows small on the title screen.

## Play it

This is a web game. The live build is the Grok app preview / published site. To run the source:

```bash
npm install
npm run dev
```

Save data stays in the browser (`localStorage`). **New table** on the HUD wipes it.

## Species

Starters are Curly Hair, Pinktoe, and Chaco Golden Knee — real, hardy beginners. Later unlocks are real tarantulas (and one labeled trade name). Aggressive / Old World stock is harder to sell to casual guests.

## Thanks

Inspired by real keepers and shops — [The Tarantula Collective](https://www.thetarantulacollective.com/), [Spider Shoppe](https://spidershoppe.com/), [Tarantula Cribs](https://tarantulacribs.com/) — and by the pace of Stardew Valley and Graveyard Keeper. Felt portraits are the box art. The table is the toy.
