// Shop decorating for Shelf Stocker: spend the coins that levels and the Daily Delivery pay on cosmetic upgrades for your shop (the home screen, plus the shelf finish while you play).
// Fake coins only: no real money, no timers, no odds, nothing random. Pure ESM.
export const SLOTS = [
  { id: "sign", name: "Shop sign" }, { id: "awning", name: "Awning" }, { id: "plant", name: "Plant" },
  { id: "pet", name: "Shop pet" }, { id: "rug", name: "Rug" }, { id: "finish", name: "Shelf finish" },
];
export const DECOR = [
  { id: "sign:wood", slot: "sign", name: "Wooden", price: 0 }, { id: "sign:chalk", slot: "sign", name: "Chalkboard", price: 80 }, { id: "sign:neon", slot: "sign", name: "Neon", price: 60 }, { id: "sign:gold", slot: "sign", name: "Golden", price: 120 },
  { id: "awning:none", slot: "awning", name: "None", price: 0 }, { id: "awning:red", slot: "awning", name: "Red stripes", price: 50 }, { id: "awning:blue", slot: "awning", name: "Blue stripes", price: 50 }, { id: "awning:rainbow", slot: "awning", name: "Rainbow", price: 90 },
  { id: "plant:none", slot: "plant", name: "None", price: 0 }, { id: "plant:fern", slot: "plant", name: "Little fern", price: 40 }, { id: "plant:monstera", slot: "plant", name: "Big monstera", price: 75 },
  { id: "pet:none", slot: "pet", name: "None", price: 0 }, { id: "pet:cat", slot: "pet", name: "Shop cat", price: 110 }, { id: "pet:dog", slot: "pet", name: "Shop dog", price: 110 },
  { id: "rug:none", slot: "rug", name: "None", price: 0 }, { id: "rug:round", slot: "rug", name: "Round rug", price: 45 }, { id: "rug:stripe", slot: "rug", name: "Striped rug", price: 65 },
  { id: "finish:oak", slot: "finish", name: "Oak", price: 0 }, { id: "finish:white", slot: "finish", name: "White", price: 55 }, { id: "finish:pink", slot: "finish", name: "Pink", price: 55 }, { id: "finish:walnut", slot: "finish", name: "Walnut", price: 70 },
];
export const decorById = (id) => DECOR.find((d) => d.id === id) || null;
/** Buy a decoration with coins (it is equipped straight away). */
export function buyDecor(p, id) {
  const d = decorById(id); if (!d) return { ok: false, reason: "unknown" }; if (p.decor.owned.includes(id)) return { ok: false, reason: "owned" }; if (p.coins < d.price) return { ok: false, reason: "poor" };
  p.coins -= d.price; p.decor.owned.push(id); p.decor.equipped[d.slot] = id.split(":")[1]; return { ok: true, price: d.price };
}
/** Put an owned decoration on display (replacing whatever was in that slot). */
export function equipDecor(p, id) { const d = decorById(id); if (!d || !p.decor.owned.includes(id)) return { ok: false }; p.decor.equipped[d.slot] = id.split(":")[1]; return { ok: true }; }
export const isEquipped = (p, id) => { const d = decorById(id); return !!d && p.decor.equipped[d.slot] === id.split(":")[1]; };
