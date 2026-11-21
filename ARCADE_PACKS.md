# Pack Rush (tap-to-rip card collector)

Route `/arcade/packs`. Engine `arcade-server/packs/` (pure ESM, tested), client `components/arcade/packs/` (`PackRush.tsx`, `CardFace.tsx`, `sprites.ts` art generator, `format.ts`, `packs.css`), tests `arcade-server/tests/packs.test.mjs`, economy simulator `scripts/packs-econ.mjs`, browser smoke `scripts/packs-e2e.mjs`.

## How it plays (v2, rebuilt after feedback that v1 felt like a spreadsheet)
- **Shop -> table -> tap.** Buy a pack from the shop (stock restocks over time). It lands on your table. **Tap it repeatedly**: each tap damages it (it visibly tears, shakes and sprays foil), and when its HP is gone it bursts and a card pops out, face down, then flips.
- **Cards**: 72 original creatures in 6 sets (= 6 pack types), each with 6 finishes: Standard, Chrome, Holo, Gold, Negative, Glitch (432 album entries). Each finish has its own look (metal shine, rainbow foil, sparkle, inverted colours, RGB glitch).
- **First copy of a card or finish goes in your album and pays a discovery bonus. Duplicates go to storage (capped) and sell for cash** (Sell All). Full storage sells extras at half price.
- **Spend cash on**: pack types (unlock), 10 upgrades (tap power, crits, luck, shiny chance, sell price, storage, stock, restock, table slots, bonus card) and 3 staff (Card Opener taps for you, Salesperson sells, Buyer buys). Staff work offline up to 2 hours.
- **Album bonus**: +1% sell price per finish found. **Odds Lab** shows real chances, average packs to see each outcome, the chance you are *still* waiting, and runs 1,000 packs against the odds.
- Never stuck: if you are broke with nothing to open or sell, a free sample pack arrives after 6 seconds.
- Keys on desktop: 1-8 tap a slot, Space taps the weakest, B buys, S sells.

## Design rules
- Fake cash only, no real-money framing, no purchases, no daily-streak pressure. Saves are `localStorage` (`packrush:v2`), per device. Do not add backend state.
- Pace is limited by tapping speed (pack HP), shop stock/restock, and ever-steeper upgrade prices, not by clicks alone. All tunables are in `arcade-server/packs/config.mjs`. After any economy change run `node scripts/packs-econ.mjs 60 1` (human bot: 4 taps/sec); the economy test asserts tier 1 < 10 min, first hire < 15 min, tier 2 between 5 and 30 min, last pack type not before 45 min.
- Art is generated from seeds (no image files, nothing to store): parts-based creatures (body, ears, horns, wings, tail, pattern, eyes, mouth) on set-themed 40x40 scenes.

## Honest limits
- Balance is tuned against a bot. A perfect player finishes the pack types in roughly 1.5 hours; real players will be slower. Expect to retune after real play.
- Procedural art has a ceiling: some creatures look odd. Hand-drawn art would be better if you have an artist (a student!).
- Not built yet from the Crack-the-Pack inspiration: museum, card battles, fusion lab, cloning, 50/50 packs (skipped on purpose: gambling flavour on a school site). Reboot/prestige from v1 was dropped in the rebuild.
- Saves are per browser: clearing site data deletes progress.
- Verified in headless Chromium at six viewports (iPhone/iPad both orientations, laptop, 320px phone); not on physical devices.
- Next planned: Fantasy Football idle game on the same engine pattern.
