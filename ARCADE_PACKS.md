# Pack Rush (idle card collector)

Route `/arcade/packs`. Engine `arcade-server/packs/` (pure ESM, tested), client `components/arcade/packs/` (`PackRush.tsx`, `sprites.ts`, `format.ts`, `packs.css`), tests `arcade-server/tests/packs.test.mjs`, economy simulator `scripts/packs-econ.mjs`, browser smoke `scripts/packs-e2e.mjs`.

## How it plays
- Spend coins on a **pack** (6 tiers = 6 sets of 12 original pixel creatures, 72 cards, drawn from seeds so there are no art files). Rarities common > legendary; foil/holo variants.
- Each owned card **pays coins every second** (scaled by rarity and set). **Duplicates level a card up** (copies 2/4/7/12/20). Packs are a cost, never a profit, so growth is paced by collecting, not by clicking.
- The next pack tier unlocks when you **complete the previous set**. Completed sets, foils and holos add income.
- Upgrades (coins): Bulk Pallets, Dividends, Lucky Charm, Shiny Coat, Bigger Packs, **Auto-Ripper**, Quick Hands (open x5/x10). Free gift pack on a timer (so nobody is ever stuck broke) and a Tap button.
- **Reboot** resets coins and upgrades, keeps every card, and grants permanent stars (+5% income each) to spend in a 10-node tree (starting money, wholesale, luck, foil, auto speed, offline hours, x25 open...).
- **Odds Lab** shows the real chances, the average packs needed per rarity (coupon-collector maths), the chance you are *still* waiting after that many packs, and runs 1,000 packs to compare with the odds. This is on purpose: the game shows its own maths.
- Offline progress: income plus Auto-Ripper packs for up to 2 hours (more with Night Shift).

## Design rules
- No real money, no purchases, no daily-streak pressure, no pay-to-skip. Fake coins only. Save data is `localStorage` (`packrush:v1`), per device. Do not add backend state.
- All tunables are in `arcade-server/packs/config.mjs`. Retune with `node scripts/packs-econ.mjs 60 1` (human-speed bot: 1 action/sec); the economy test asserts tier 1 < 15 min, Auto-Ripper < 25 min, first reboot (3 stars) 12 to 60 min.

## Honest limits
- Balance is tuned against a bot, not people. A perfect player finishes the first run in roughly 30 minutes; real players will be slower. Expect to retune after real play.
- The pixel creatures are generated, so a few will look odd; legendary/epic get a crest. Art is not hand-drawn.
- Saves are per browser: clearing site data deletes progress, and a shared device shares one save.
- Verified in headless Chromium at six viewports (iPhone/iPad both orientations, laptop, 320px phone); not on physical devices; sound uses the shared WebAudio synth.
- Next planned: Fantasy Football idle game on the same engine pattern (real odds shown, fake coins).
