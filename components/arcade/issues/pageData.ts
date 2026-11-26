// Front-page dressing for Back Issues: era palettes, short original news items and fictional adverts. All text is original and invented (no real papers, brands or people).
export type Era = { paper: string; paper2: string; cream: string; ink: string; accent: string; price: string; tag: string };
export const ERAS: Era[] = [
  { paper: "#e6d6ac", paper2: "#f1e6c6", cream: "#faf3dc", ink: "#231a10", accent: "#8b2a1d", price: "ONE CENT", tag: "ALL THE NEWS OF THE VALLEY" },
  { paper: "#d9dcc9", paper2: "#e9ecdc", cream: "#f5f6ea", ink: "#1b2428", accent: "#1f5a73", price: "TWO CENTS", tag: "TIDE TABLES AND TRADE REPORTS" },
  { paper: "#ece0bd", paper2: "#f5ebcf", cream: "#fcf6e2", ink: "#2a1d12", accent: "#c4571a", price: "THREE CENTS", tag: "A BRIGHT IDEA EVERY MORNING" },
  { paper: "#eedfca", paper2: "#f6e9d8", cream: "#fdf5ea", ink: "#2d1c1a", accent: "#b8305a", price: "FIVE CENTS", tag: "RECIPES, REMEDIES AND RUMORS" },
  { paper: "#d6bf8c", paper2: "#e5d1a2", cream: "#f2e5c2", ink: "#2b1a0c", accent: "#5a2a14", price: "ONE PENNY", tag: "PRINTED BY STEAM SINCE 1851" },
  { paper: "#e4e2d6", paper2: "#efeee4", cream: "#f8f7f0", ink: "#161a2a", accent: "#2b3f87", price: "TEN CENTS", tag: "REACHING FOR THE STARS" },
  { paper: "#e3d8b2", paper2: "#eee4c4", cream: "#f8f0d6", ink: "#1b2418", accent: "#2f6b3a", price: "THREE CENTS", tag: "SCORES, STANDINGS AND STORIES" },
  { paper: "#d9dcbb", paper2: "#e7e9cc", cream: "#f3f5de", ink: "#1b2814", accent: "#3a6b2a", price: "TWO CENTS", tag: "NEWS FROM FIELD AND FOREST" },
  { paper: "#ebdfc0", paper2: "#f4e9cf", cream: "#fcf5e0", ink: "#2a1a1a", accent: "#a02a2a", price: "FIVE CENTS", tag: "FOR PUPILS, PARENTS AND TEACHERS" },
  { paper: "#e4d8c6", paper2: "#efe5d6", cream: "#f9f2e6", ink: "#251a2b", accent: "#6a2f7d", price: "FIVE CENTS", tag: "SONGS, STAGES AND SOUNDS" },
];
export const BLURBS: Record<string, string[]> = {
  animals: ["Visitors to the river meadow were treated to an unusual sight on Tuesday when a family of otters held a long and noisy picnic on the bank, scattering fish scraps and delighting the children.", "The county fair's livestock tent reports record entries this year. One very proud goose took first prize and, according to witnesses, hissed at the judges to make sure."],
  geography: ["Surveyors returned this week from the northern ridge with a new map and a long list of corrections. The old chart, it turns out, had placed one entire lake about a mile too far east.", "The harbor master announces a new schedule of sailings. Passengers are reminded to check the tide tables before booking and to pack a sweater whatever the forecast says."],
  science: ["A group of schoolchildren demonstrated an electric circuit to the town council on Thursday, lighting a small bulb with a lemon. The mayor asked to hold the lemon. It was permitted.", "Doctor Ames of the observatory reports that tonight's sky will be unusually clear. Residents are invited to bring lanterns, blankets and good questions to the hill after supper."],
  food: ["The Fall Bake-Off drew forty entries and one dispute, which was settled when the judges agreed that both pies were excellent and the crust argument could continue privately.", "A new soup kitchen opens on Mill Street tomorrow. Volunteers are still needed to peel potatoes, stir large pots and, most importantly, to taste as they go."],
  history: ["Workmen repairing the old stone bridge uncovered a sealed tin box beneath the arch. Inside were a few coins, a folded letter and a drawing of a very serious horse.", "The historical society will unveil a new plaque at the market square this Saturday. Speeches are expected to be short, and the cake, we are assured, will not be."],
  space: ["Hundreds gathered on the hill last night to watch a bright streak cross the sky. The observatory says it was a comet. A few in the crowd insisted that it winked.", "Plans are under way for a rocket club at the school. Members will build small models, measure how high they go and, it is hoped, find them again afterward."],
  sports: ["The Rovers took the pennant on Saturday in a game that went into the final inning. The winning run was scored by a substitute who had arrived only moments before, still lacing a boot.", "Registration is now open for the autumn relay race. Runners of every age are welcome, and sensible shoes are strongly recommended, along with a friend who knows the route."],
  nature: ["Rangers report that the first frost has painted the valley a hundred shades of red and gold. Visitors are asked to keep to the paths and leave the acorns for the squirrels.", "After weeks of rain, the creek has finally returned to its banks. Frogs have been heard celebrating all along the water, usually around midnight and at some length."],
  school: ["The new library wing was opened on Monday with a ribbon, a speech and a rule of silence that lasted almost four minutes. Over two hundred books were borrowed before lunch.", "The spelling contest ended in a tie after fourteen rounds. Both finalists have been awarded a dictionary, which they are said to have accepted with remarkable grace."],
  music: ["The town band will give a free concert in the park on Sunday afternoon. The program includes marches, two waltzes and one new piece written by the youngest member.", "A piano was delivered to the wrong address on Elm Street yesterday and played, by all accounts, rather beautifully for an hour before anyone noticed the mistake."],
};
export const ADS: { head: string; body: string }[] = [
  { head: "KESSLER & SON", body: "Hats, gloves and umbrellas. Fine quality, fair prices." }, { head: "SUNNY DAY BAKERY", body: "Fresh rolls every morning at six. Ask about the Saturday pie." },
  { head: "ROY'S RADIO REPAIR", body: "Static? Crackle? We fix it while you wait. Mill Street." }, { head: "THE CORNER BOOKSHOP", body: "New and used. Come in, stay awhile, bring a friend." },
  { head: "DR. HOLLOWAY'S TONIC", body: "For tired mornings and restless nights. Twenty cents." }, { head: "FINE SHOES REPAIRED", body: "Heels, soles and laces. Return the same day, always." },
  { head: "MAPLE LANE GROCERY", body: "Eggs, flour and the sweetest apples in the county." }, { head: "LUCKY STAR CINEMA", body: "Two features, one cartoon and a short. Doors at seven." },
  { head: "HARBOR TAILORS", body: "Suits made to measure. Quick alterations, careful hands." }, { head: "PETAL & STEM", body: "Flowers for every occasion. Free delivery within the town." },
  { head: "ACE BICYCLE WORKS", body: "Bells, baskets and brand-new tires. Test rides welcome." }, { head: "THE GOLDEN SPOON CAFE", body: "Soup of the day, tea by the pot. Open late on Fridays." },
];
export const WEATHER = ["FAIR AND MILD", "SHOWERS LIKELY", "CLEAR AND COOL", "BREEZY, CLOUDY LATER", "WARM, THEN STORMS", "FROST BY MORNING"];
export const PUZZLE_NAMES: Record<string, { title: string; sub: string }> = {
  crossword: { title: "The Crossword", sub: "Fill the grid from the clues" },
  sudoku: { title: "Number Place", sub: "Every row, column and box once" },
  wordsearch: { title: "Word Hunt", sub: "Find them all in the letters" },
  cipher: { title: "The Secret Message", sub: "Crack the code, read the line" },
};
export const BRIEFS = ["Library hours extended through the summer.", "Lost: one red umbrella, last seen near the fountain.", "Choir seeks tenors. Biscuits provided.", "Clock tower to be painted this spring.", "Market opens at dawn on Saturdays.", "Lemonade stand raises forty dollars for the new swings.", "Council debates bench placement for three hours.", "Stray cat adopted by the fire station.", "Town photographer retires after fifty years.", "Rain expected for the picnic. Bring a hat.", "New crosswalk painted outside the school.", "Kite club meets Sundays on the hill.", "Bridge repairs now finished, mostly.", "Pie contest registration closes Friday.", "Night owls invited to the telescope evening.", "Bicycle bell stolen, returned the next morning.", "Chess club challenges the mayor to a match.", "Fountain pennies donated to the animal shelter.", "Bookmobile adds a Thursday route.", "Garden club reports a record tomato harvest.", "Pigeons file a formal complaint, says statue.", "Harvest dance moved indoors due to goats.", "Ferry timetable updated. Please check twice.", "Mystery knitter decorates every lamppost."];
