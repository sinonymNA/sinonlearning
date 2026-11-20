import { CHARACTERS, STARTER_AVATARS } from "./characters.mjs";
/** Static game metadata shared by the server (min players, score normalisation) and the UI. */
export const GAME_CATALOG = {
  hot_potato: { id: "hot_potato", name: "Hot Potato", icon: "🥔", color: "#ff7a3d", min: 2, ref: 130, minutes: "2-3", blurb: "Type a word with the letters shown to pass the potato. Whoever is holding it when it blows loses a heart!" },
  quick_draw: { id: "quick_draw", name: "Quick Draw", icon: "🎨", color: "#2fbf9b", min: 2, ref: 330, minutes: "3", blurb: "Draw the secret word while your group guesses. Fast guesses score big." },
  last_one_standing: { id: "last_one_standing", name: "Last One Standing", icon: "⚡", color: "#7c5cff", min: 2, ref: 520, minutes: "2-4", blurb: "Everyone answers the same question. Only the fastest correct players stay on the platform." },
  telephone: { id: "telephone", name: "Telephone", icon: "☎️", color: "#ffb02e", min: 3, ref: 230, minutes: "4-5", blurb: "Draw, describe, draw again - then watch how badly the message changed." },
  piggy_bank: { id: "piggy_bank", name: "Piggy Bank", icon: "🐷", color: "#ff6fb0", min: 2, ref: 2000, minutes: "3-4", blurb: "Answer fast, then pick a chest: bank it safe, steal from rivals, or go wild. Nobody is ever knocked out!" },
  imposter: { id: "imposter", name: "Imposter", icon: "🕵️", color: "#ef476f", min: 3, ref: 230, minutes: "3-4", blurb: "Ask, answer, and spot the one player who doesn't know the secret word." },
  puffer_party: { id: "puffer_party", name: "Puffer Party", icon: "🐡", color: "#ffcf5a", min: 2, ref: 200, minutes: "3-4", blurb: "A category appears and the puffer sits on you. Name something on the list before time runs out, then pass it on. Run out of time and you lose a life." },
  dacula_dash: { id: "dacula_dash", name: "Dacula Dash", icon: "🚗", color: "#3b82f6", min: 2, ref: 700, minutes: "15-20", blurb: "Race around a pixel map of Dacula, Georgia. Roll, pick your route, win a colour wedge at six landmarks, then dash back to school for the final question!" },
};
export const GAME_IDS = Object.keys(GAME_CATALOG);
export const MAX_PLAYERS = 40;

export const AVATARS = [...STARTER_AVATARS.map((a) => a.id), ...CHARACTERS.map((c) => c.id)];
export const TEAMS = [
  { id: 0, name: "Red Rockets", color: "#ef476f" }, { id: 1, name: "Blue Bolts", color: "#4d8dff" },
  { id: 2, name: "Green Gliders", color: "#2fbf9b" }, { id: 3, name: "Gold Giants", color: "#ffb02e" },
  { id: 4, name: "Purple Pandas", color: "#8d63ff" }, { id: 5, name: "Teal Tigers", color: "#17b8d0" },
];
