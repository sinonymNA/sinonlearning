// Presentation metadata for the Abyss themes (tiny on purpose: the client imports this, not the prompt banks).
/** Presentation metadata for each theme (the client draws the scene from `id`; colours drive the UI chrome). */
export const THEME_META = [
  { id: "movies", round: "SCENE", name: "Movie Night", short: "MOVIES", blurb: "Blockbusters, directors, villains and Oscar winners. Roll through a neon boulevard.", unit: "FRAMES", c1: "#ff5d9e", c2: "#ffd23f", icon: "🎬" },
  { id: "sports", round: "ROUND", name: "Sports Arena", short: "SPORTS", blurb: "Teams, legends and Olympic trivia. Dribble across a packed arena floor.", unit: "YARDS", c1: "#ff9a3c", c2: "#ffe08a", icon: "🏀" },
  { id: "music", round: "TRACK", name: "Music Hall", short: "MUSIC", blurb: "Bands, singers, rappers and composers. Ride the stage lights.", unit: "BEATS", c1: "#a98bff", c2: "#4cc3ff", icon: "🎤" },
  { id: "tv", round: "EPISODE", name: "Screen Time", short: "TV", blurb: "Sitcoms, cartoons, binge-worthy dramas and game shows. Cruise the channel wall.", unit: "EPISODES", c1: "#4cc3ff", c2: "#86efac", icon: "📺" },
  { id: "games", round: "LEVEL", name: "Game On", short: "GAMES", blurb: "Consoles, characters, franchises and Pokemon. Hover through a pixel kingdom.", unit: "LEVELS", c1: "#86efac", c2: "#ff5d9e", icon: "🎮" },
];
