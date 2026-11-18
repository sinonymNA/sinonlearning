/**
 * Quick chat: a curated list of kid-safe phrases, jokes and emoji. There is deliberately NO free-text chat:
 * nothing a student types ever reaches another student, so nothing needs moderating and nothing can leak
 * private game information (secret words, roles). Teachers can switch quick chat off per room.
 * `game` limits a phrase to one game ("all" = everywhere).
 */
const P = (text, game = "all", tab = "funny") => ({ text, game, tab });
export const PHRASES = [
  // cheer
  P("GG! 🎉", "all", "cheer"), P("Nice one! 👏", "all", "cheer"), P("Let's gooo! 🚀", "all", "cheer"), P("So close! 😬", "all", "cheer"),
  P("You got this! 💪", "all", "cheer"), P("Great teamwork! 🤝", "all", "cheer"), P("Good luck everyone! 🍀", "all", "cheer"), P("Wow, that was fast! ⚡", "all", "cheer"),
  // jokes
  P("I'm not slow, I'm buffering 🐢"), P("My brain is on airplane mode ✈️"), P("That was egg-cellent! 🥚"), P("I'm feeling a little crabby 🦀"),
  P("Why did the potato cross the road? To escape the heat! 🥔"), P("I'd tell a pizza joke but it's too cheesy 🍕"), P("I'm on a roll! 🥐"),
  P("Lettuce begin! 🥬"), P("I'm so tired I could fall asleep standing up… like a flamingo 🦩"), P("Plot twist: I read the question 🤯"),
  P("Brb, my keyboard is melting 🔥"), P("I put the 'pro' in procrastinate 😎"), P("Is it just me, or is this thing hard? 😅"), P("My cat could do better… and she's a cat 🐱"),
  P("Sorry, my finger slipped 🙈"), P("I came, I saw, I forgot 🤔"),
  // reactions (emoji only)
  P("😂", "all", "react"), P("😱", "all", "react"), P("🔥", "all", "react"), P("👏", "all", "react"), P("🤯", "all", "react"), P("😭", "all", "react"), P("🫡", "all", "react"), P("💀", "all", "react"), P("🥔", "all", "react"), P("🐷", "all", "react"),
  // game specific
  P("I'm sweating! 😅", "hot_potato", "game"), P("Don't look at me! 👀", "hot_potato", "game"), P("Hot hot hot!! 🔥", "hot_potato", "game"), P("Potato, potato, potato… 🥔", "hot_potato", "game"), P("I need a longer word! 📏", "hot_potato", "game"),
  P("Is it a cat? 🐱", "quick_draw", "game"), P("My art is a masterpiece 🎨", "quick_draw", "game"), P("Art is hard! 😵", "quick_draw", "game"), P("Is it a… potato? 🥔", "quick_draw", "game"), P("Picasso who? 🖼️", "quick_draw", "game"),
  P("Was it B?? 🤔", "last_one_standing", "game"), P("I knew it! 🧠", "last_one_standing", "game"), P("Oops, wrong button! 🙃", "last_one_standing", "game"), P("Revenge time! 😤", "last_one_standing", "game"), P("Second chance, here I come! 🪂", "last_one_standing", "game"),
  P("This looks nothing like it 😂", "telephone", "game"), P("How did that happen?! 📞", "telephone", "game"), P("Broken telephone strikes again! ☎️", "telephone", "game"), P("My drawing was perfect, I swear ✏️", "telephone", "game"),
  P("It wasn't me! 😇", "imposter", "game"), P("Hmm, suspicious… 🧐", "imposter", "game"), P("Trust me! 🤞", "imposter", "game"), P("Great question! 🙌", "imposter", "game"), P("Interesting answers… 👀", "imposter", "game"),
  P("Oink! 🐷", "piggy_bank", "game"), P("Rob me not! 🙏", "piggy_bank", "game"), P("Heist time! 🕶️", "piggy_bank", "game"), P("Wild chest or bust! 🎰", "piggy_bank", "game"), P("My piggy is empty 😭", "piggy_bank", "game"),
].map((p, i) => ({ id: `q${i}`, ...p }));

export const PHRASE_BY_ID = new Map(PHRASES.map((p) => [p.id, p]));
export const CHAT_COOLDOWN_MS = 2500;

export function phrasesFor(game) { return PHRASES.filter((p) => p.game === "all" || p.game === game); }
