// Party-mode content, round 2: bigger banks so repeat plays stay fresh. Plain data: edit freely.
const split = (s) => s.split("|").map((x) => x.trim()).filter(Boolean);

export const EXTRA2_DRAW_PROMPTS = split(`
ant|bee hive|beaver|bison|boar|bull|bunny|camel|chipmunk|clam|cobra|crab|dolphin|donkey|eagle|eel|falcon|ferret|fox|goat|goose|gorilla|hamster|hawk|hippo|hyena|jaguar|jellyfish|kangaroo|lemur|leopard|lion|lizard|llama|lobster|moose|mouse|narwhal|newt|otter|ostrich|oyster|panda|parrot|pelican|pig|pony|porcupine|puppy|raccoon|raven|rooster|scorpion|seagull|skunk|sloth|squid|stingray|swan|tiger|toad|toucan|trout|turkey|vulture|walrus|whale|wolf|woodpecker|worm|yak|zebra|
axe|backpack|bakery|ball|balloon|barn|barrel|basket|bat|bathtub|battery|bed|bell|belt|bench|binoculars|blender|blimp|boat|bone|book|boomerang|bottle|bow|bowl|bread|broom|bucket|bulldozer|bus|butter|button|cabin|cage|calendar|camera|candle|cannon|canoe|cap|carousel|carpet|cart|cash register|castle|chain|chair|chalk|cheese|chimney|clipboard|clock tower|cloud|coat|coin|comb|compass|computer|cookie jar|couch|crayon|crown|cup|curtain|desk lamp|diamond|dice|dishwasher|doll|doorbell|drawer|drum set|dumbbell|easel|elevator|envelope|escalator|fan|fence|ferris wheel|fireplace|fishing rod|flag|flashlight|flute|football|fork|fountain|frame|freezer|garage|garbage can|gate|ghost|gift|glasses|globe|gloves|glue|guitar|hammer|hammock|hanger|harp|hat|headphones|helmet|hockey stick|honey|horn|hourglass|hot air balloon|house|ice cube|iron|jar|jeans|jigsaw puzzle|joystick|jukebox|kettle|key|kite|knife|ladder|lamp|lantern|laptop|lawn mower|leaf|lemonade stand|lightbulb|lighthouse|lock|locker|magnet|mailbox|map|mask|microphone|microscope|mirror|mitten|mop|motorcycle|mug|nest|net|newspaper|notebook|oven|paintbrush|pan|parachute|parrot cage|passport|pencil case|piano|pillow|pizza box|plate|plug|pocket watch|pogo stick|popcorn machine|postcard|pot|pumpkin|puzzle|pyramid|quilt|racket|radio|rake|ring|robot arm|rocking chair|roller coaster|roller skates|rope|rug|sailboat|saw|scale|scarf|scooter|screwdriver|seesaw|shelf|shovel|shower|sign|skateboard|sled|slide|snowboard|soap|sofa|spoon|stamp|stapler|stool|stove|suitcase|sundial|swing set|syringe|table|tambourine|tape|teapot|teddy bear|telephone|tent|thermos|ticket|tire|toaster|toilet|toothbrush|towel|toy car|tractor|traffic light|trash truck|treasure map|tricycle|trophy|trumpet|tunnel|umbrella|vase|violin|wagon|wallet|washing machine|watch|water bottle|watering can|wheel|whistle|windmill|window|wreath|yo-yo|
beach|bridge|canyon|castle tower|cave|city|coral reef|desert island|dock|farm|forest|glacier|harbor|iceberg|jungle|lake|meadow|mountain|ocean wave|park|pond|rainforest|river|snowy hill|sunset|swamp|tornado|treehouse|volcano|waterfall|
astronaut|chef|clown|cowboy|detective|dragon|elf|fairy|firefighter|giant|knight|mermaid|ninja|pirate|princess|robot|scarecrow|scientist|snowman|superhero|vampire|werewolf|wizard|zombie|
apple pie|bacon|bagel|birthday cake|burrito|cereal bowl|cheeseburger|cherry|chocolate bar|corn on the cob|cotton candy|donut|egg|fried egg|grapes|ice cream cone|jelly|lemon|lollipop|mango|marshmallow|noodles|orange|pancake stack|peanut|pear|pineapple|pretzel|ramen|salad|sandwich|spaghetti|strawberry|sushi roll|taco|toast|waffle|
airplane|ambulance|bicycle|cable car|canoe|cruise ship|dump truck|fire truck|go-kart|helicopter|hovercraft|jet ski|limousine|monster truck|police car|rocket ship|school bus|space shuttle|submarine|taxi|tow truck|train|tugboat|UFO|van|
bone marrow|brain|ear|eye|foot|hand|heart|lungs|mouth|nose|skeleton|skull|tooth|tongue|
cactus plant|daisy|fern|mushroom|palm tree|pine tree|rose|seed|sprout|sunflower|tulip|venus flytrap|
rain boot|sneaker|sock|sweater|top hat|t-shirt|tutu|
birthday party|campfire|fireworks|picnic|snowball fight|sandcastle|piggy bank|time machine|haunted house|igloo|pirate flag|tightrope|trampoline|
`);

export const EXTRA2_TELEPHONE_PROMPTS = split(`
A llama delivering the mail|A pirate teaching yoga|A squirrel driving a school bus|A ghost stuck in a vending machine|A giraffe getting a haircut|A robot cat chasing a laser|A hippo on a trampoline|A very polite dragon|A snowman at the beach|A grandma on a skateboard|A fish riding a bicycle|A cow in a spaceship|A penguin at a barbecue|A bear winning a pie contest|A cactus giving a hug|A turtle chasing a bus|A pizza chasing a hungry kid|An elephant hiding behind a lamppost|A mouse wearing a crown|A kangaroo in a movie theater|A raccoon running a bakery|A unicorn with a skateboard|A sloth in a race|A frog doing magic tricks|A duck with a jetpack|A tiny dinosaur on a swing|A wizard who lost his hat|A chicken learning to swim|A monkey as a mail carrier|A sandwich with a mustache|A shark eating ice cream|A bunny on a pogo stick|Two snails having a race|A bee in a bowtie|A walrus playing the drums|A fox reading a book|A mummy on a roller coaster|A crab selling lemonade|A spider knitting socks|A goat on a mountain of pancakes|A kitten flying a kite|A rocket powered by pizza|A knight and a dragon having tea|A baby whale in a bathtub|A seagull stealing fries|A moose at the library|A parrot telling jokes|A zebra changing stripes|A jellyfish at a disco|A robot washing the dishes|A camel in the snow|An owl with sunglasses|A snowman melting in a hot tub|A cheetah stuck in traffic|A ladybug on a surfboard|A llama with a top hat|An astronaut planting a flag on a cupcake|A mad scientist and a hamster|A farmer and his flying cow|A squirrel with a tiny umbrella|A tortoise on a skateboard|A bear in a tutu|A pirate afraid of seagulls|A volcano making popcorn|A cloud sneezing rain|The moon wearing pajamas|A tree house in a giant mushroom|A pig flying a kite|A fish bowl on wheels|A chef and a grumpy lobster|A dancing taco|A shy ghost at school|A bookworm in a library|An ant carrying a giant cookie|A dog who drives a taxi|A cat in a spacesuit|A hot dog on vacation|A brave little toaster|A turkey on a diet|A rainbow slide|A bubble blowing contest|A sandcastle with a moat|A treasure chest full of socks|A pencil with legs|A paper airplane pilot|A time-traveling hamster|A very fast snail|A tiger learning ballet|A whale at a pool party|A dragon with the hiccups|A pumpkin carving a pumpkin|A snowman building a person|A bat afraid of the dark|A caterpillar in a hurry|A bear with a balloon|A horse in a raincoat|A seal balancing a ball|A pelican with a big grocery bag|A rooster who cannot wake up|A mouse in a maze made of cheese|A fish telling a fish story|A magician pulling out a bigger magician
`);

const W = (word, related) => ({ word, related: related.split(" ").map((x) => x.replace(/_/g, " ")) });
export const EXTRA2_IMPOSTER_WORDS = [
  W("BAKERY", "croissant oven dough pastry flour cake"), W("ARCADE", "tokens joystick prizes high_score pinball claw"), W("AQUARIUM", "tank fish glass shark jellyfish feeding"),
  W("CAMPGROUND", "tent marshmallow flashlight s'mores sleeping_bag trail"), W("PLANETARIUM", "dome stars projector constellation telescope dark"), W("RESTAURANT", "menu waiter table chef tip reservation"),
  W("PET STORE", "puppy hamster leash cage aquarium treats"), W("BOOKSTORE", "shelves novel cashier bestseller bookmark aisle"), W("GAS STATION", "pump fuel snacks receipt car attendant"),
  W("SKI RESORT", "slope lift snow goggles lodge chairlift"), W("HOTEL", "lobby key suite bellhop elevator reservation"), W("GYM", "weights treadmill locker trainer workout mat"),
  W("DANCE CLASS", "studio mirror music steps ballet partner"), W("RECESS", "playground tag swings whistle ball friends"), W("FIELD TRIP", "bus permission slip museum chaperone lunch group"),
  W("SCHOOL BUS", "driver seats stop window backpack route"), W("CAFETERIA", "tray lunch line milk table menu"), W("SPELLING BEE", "word letters stage judge bell microphone"),
  W("SCIENCE FAIR", "poster volcano display judge project experiment"), W("TALENT SHOW", "stage curtain act audience applause costume"), W("PARADE", "floats band confetti crowd balloons marching"),
  W("FIREWORKS", "sparkle boom night sky colors crowd"), W("SLEEPOVER", "pillow movie popcorn sleeping_bag snacks pajamas"), W("BEACH DAY", "sunscreen towel sandcastle waves umbrella seashell"),
  W("ROAD TRIP", "map snacks playlist backseat gas windows"), W("PICNIC", "blanket basket sandwich ants grass lemonade"), W("GARAGE SALE", "boxes price bargain table old_toys coins"),
  W("FARMERS MARKET", "stall vegetables baskets honey bags fresh"), W("FOOD TRUCK", "window menu line tacos wheels order"), W("LAUNDROMAT", "washer dryer coins soap basket socks"),
  W("CASTLE", "drawbridge tower dungeon knight banner king"), W("LABYRINTH", "maze walls lost path minotaur exit"), W("MOUNTAIN CABIN", "fireplace logs snow cocoa blanket porch"),
  W("PIRATE SHIP", "sails plank treasure flag crew cannon"), W("SPACE ROCKET", "launch countdown fuel astronaut orbit flames"), W("DINOSAUR MUSEUM", "skeleton fossils bones tickets giant roar"),
  W("JUNGLE", "vines monkeys humid canopy parrots river"), W("COAL MINE", "tunnel helmet cart dark pickaxe underground"), W("ICE CREAM SHOP", "scoop cone sprinkles flavors sundae counter"),
  W("CARNIVAL", "rides tickets games cotton_candy prizes lights"), W("ROLLER RINK", "skates music lights wheels disco rental"), W("BOWLING ALLEY", "pins lane strike shoes ball score"),
  W("MINI GOLF", "putter windmill hole course score tiny"), W("TREE HOUSE", "ladder branches rope secret club hideout"), W("LIGHTNING STORM", "thunder flash rain clouds sky loud"),
  W("MAGIC TRICK", "rabbit hat wand cape cards audience"), W("RAINFOREST CAFE", "fake_vines animals mist menu loud jungle"), W("SNOW FORT", "walls snowballs mittens shovel icy tunnel"),
  W("LEMONADE", "sour sugar pitcher ice lemons glass"), W("BIRTHDAY CAKE", "candles frosting slice wish song plate"),
];

const Q = (concept, q, right, w1, w2, w3, explain) => ({ concept, q, right, wrong: [w1, w2, w3], explain });
const RAW = [
  // Fractions & decimals
  Q("Fractions", "Which fraction is equal to 0.5?", "1/2", "1/5", "2/5", "5/10 is wrong"),
  Q("Fractions", "What is 1/4 + 1/4?", "1/2", "1/8", "2/8", "1/4", "Two quarters make a half."),
  Q("Fractions", "Which is larger: 3/4 or 2/3?", "3/4", "2/3", "They are equal", "Cannot tell"),
  Q("Fractions", "What is 3/5 as a decimal?", "0.6", "0.35", "0.53", "3.5"),
  Q("Fractions", "Simplify 6/8.", "3/4", "2/3", "1/2", "4/6"),
  Q("Fractions", "What is 1/2 of 18?", "9", "8", "6", "36"),
  Q("Fractions", "What is 2/3 of 12?", "8", "6", "9", "10"),
  Q("Fractions", "Which fraction is smallest?", "1/8", "1/4", "1/3", "1/2"),
  Q("Fractions", "What is 0.75 as a fraction?", "3/4", "7/5", "1/75", "3/5"),
  Q("Fractions", "What is 1/3 + 1/3?", "2/3", "1/6", "2/6", "1/3"),
  // Multiplication & division
  Q("Multiplication", "What is 8 x 7?", "56", "54", "63", "48"),
  Q("Multiplication", "What is 9 x 9?", "81", "72", "99", "89"),
  Q("Multiplication", "What is 12 x 11?", "132", "122", "142", "121"),
  Q("Multiplication", "What is 6 x 14?", "84", "74", "94", "64"),
  Q("Multiplication", "What is 72 divided by 8?", "9", "8", "7", "12"),
  Q("Multiplication", "What is 144 divided by 12?", "12", "11", "14", "13"),
  Q("Multiplication", "What is 15 x 4?", "60", "45", "50", "64"),
  Q("Multiplication", "What is 7 x 8 + 4?", "60", "64", "52", "88"),
  Q("Multiplication", "What is 25 x 4?", "100", "75", "125", "90"),
  Q("Multiplication", "What is 200 divided by 5?", "40", "50", "25", "45"),
  // Geometry
  Q("Geometry", "How many sides does a hexagon have?", "6", "5", "7", "8"),
  Q("Geometry", "What is the perimeter of a rectangle 3 by 5?", "16", "15", "8", "30"),
  Q("Geometry", "What is the area of a rectangle 4 by 6?", "24", "20", "10", "48"),
  Q("Geometry", "How many degrees are in a straight line?", "180", "90", "360", "100"),
  Q("Geometry", "What is the sum of angles in a triangle?", "180", "90", "270", "360"),
  Q("Geometry", "A triangle with all sides equal is...", "Equilateral", "Scalene", "Isosceles", "Right"),
  Q("Geometry", "How many faces does a cube have?", "6", "4", "8", "12"),
  Q("Geometry", "A circle's distance across through its center is the...", "Diameter", "Radius", "Circumference", "Area"),
  Q("Geometry", "An angle of 90 degrees is called...", "Right angle", "Acute angle", "Obtuse angle", "Straight angle"),
  Q("Geometry", "How many vertices does a triangular prism have?", "6", "5", "8", "9"),
  // Life science
  Q("Living things", "What do plants release during photosynthesis?", "Oxygen", "Carbon dioxide", "Nitrogen", "Methane"),
  Q("Living things", "What is the powerhouse of the cell?", "Mitochondria", "Nucleus", "Ribosome", "Vacuole"),
  Q("Living things", "Which organ pumps blood around the body?", "Heart", "Lungs", "Liver", "Kidney"),
  Q("Living things", "Animals that eat both plants and meat are called...", "Omnivores", "Herbivores", "Carnivores", "Decomposers"),
  Q("Living things", "What is a baby frog called?", "Tadpole", "Larva", "Pup", "Fry"),
  Q("Living things", "Which part of a plant holds it in the soil?", "Roots", "Stem", "Leaf", "Flower"),
  Q("Living things", "Which group of animals has backbones?", "Vertebrates", "Invertebrates", "Insects", "Arachnids"),
  Q("Living things", "What do we call an animal that hunts others for food?", "Predator", "Prey", "Scavenger", "Producer"),
  Q("Living things", "Which gas do humans breathe out?", "Carbon dioxide", "Oxygen", "Helium", "Hydrogen"),
  Q("Living things", "Butterflies go through which stage after the caterpillar?", "Chrysalis", "Egg", "Larva", "Adult only"),
  Q("Living things", "Bats are classified as...", "Mammals", "Birds", "Reptiles", "Insects"),
  Q("Living things", "What is the main job of the stomach?", "Digest food", "Pump blood", "Filter air", "Think"),
  // Earth & space
  Q("Earth and space", "How long does Earth take to orbit the Sun?", "About 365 days", "About 30 days", "24 hours", "About 7 days"),
  Q("Earth and space", "What causes day and night?", "Earth rotating", "Earth orbiting the Sun", "The Moon moving", "Clouds"),
  Q("Earth and space", "Which planet has the shortest year?", "Mercury", "Venus", "Mars", "Neptune"),
  Q("Earth and space", "What is the name of the force that holds us to Earth?", "Gravity", "Friction", "Magnetism", "Inertia"),
  Q("Earth and space", "Which layer of Earth is made of molten metal?", "Outer core", "Crust", "Mantle", "Atmosphere"),
  Q("Earth and space", "What type of rock is formed from cooled lava?", "Igneous", "Sedimentary", "Metamorphic", "Fossil"),
  Q("Earth and space", "What do we call the path of a planet around the Sun?", "Orbit", "Rotation", "Eclipse", "Phase"),
  Q("Earth and space", "Which planet is known as the Morning Star or Evening Star?", "Venus", "Mars", "Jupiter", "Saturn"),
  Q("Earth and space", "What is the Moon's light actually?", "Reflected sunlight", "Its own light", "Starlight", "Earthlight"),
  Q("Earth and space", "A solar eclipse happens when the...", "Moon blocks the Sun", "Earth blocks the Moon", "Sun blocks Earth", "Mars passes Earth"),
  Q("Earth and space", "What is the largest planet?", "Jupiter", "Saturn", "Neptune", "Earth"),
  Q("Earth and space", "Weather is measured in the layer called the...", "Troposphere", "Stratosphere", "Exosphere", "Mesosphere"),
  // Matter & energy
  Q("Matter and energy", "What state of matter has a definite shape?", "Solid", "Liquid", "Gas", "Plasma only"),
  Q("Matter and energy", "Water turning into ice is called...", "Freezing", "Melting", "Evaporation", "Condensation"),
  Q("Matter and energy", "What is the chemical symbol for water?", "H2O", "CO2", "O2", "NaCl"),
  Q("Matter and energy", "Which is a good conductor of electricity?", "Copper", "Wood", "Rubber", "Plastic"),
  Q("Matter and energy", "What type of energy does a moving car have?", "Kinetic", "Potential", "Chemical only", "Nuclear"),
  Q("Matter and energy", "Which of these is a renewable energy source?", "Wind", "Coal", "Oil", "Natural gas"),
  Q("Matter and energy", "Sound travels fastest through...", "Solids", "Liquids", "Gases", "A vacuum"),
  Q("Matter and energy", "What do we call a mixture where one thing dissolves in another?", "Solution", "Suspension", "Compound", "Element"),
  Q("Matter and energy", "At what temperature does water boil at sea level (Celsius)?", "100", "90", "212", "0"),
  Q("Matter and energy", "Which is a physical change?", "Ice melting", "Wood burning", "Iron rusting", "Milk spoiling"),
  Q("Matter and energy", "What is the unit of force?", "Newton", "Joule", "Watt", "Volt"),
  Q("Matter and energy", "Light bends when it passes through water. This is called...", "Refraction", "Reflection", "Absorption", "Diffraction"),
  // US history & civics
  Q("US history", "Who was the first President of the United States?", "George Washington", "Thomas Jefferson", "John Adams", "Abraham Lincoln"),
  Q("US history", "In which year did the Declaration of Independence get signed?", "1776", "1789", "1812", "1492"),
  Q("US history", "Who wrote most of the Declaration of Independence?", "Thomas Jefferson", "Benjamin Franklin", "George Washington", "James Madison"),
  Q("US history", "Which war was fought between the North and the South?", "The Civil War", "The Revolutionary War", "World War I", "The War of 1812"),
  Q("US history", "Who was President during the Civil War?", "Abraham Lincoln", "Andrew Jackson", "Ulysses Grant", "Theodore Roosevelt"),
  Q("US history", "What are the first ten amendments to the Constitution called?", "The Bill of Rights", "The Preamble", "The Articles", "The Federalist Papers"),
  Q("US history", "How many branches of government does the US have?", "3", "2", "4", "5"),
  Q("US history", "Which branch of government makes laws?", "Legislative", "Executive", "Judicial", "Military"),
  Q("US history", "Which ship brought the Pilgrims to America in 1620?", "The Mayflower", "The Santa Maria", "The Titanic", "The Nina"),
  Q("US history", "Who was the first person to walk on the Moon?", "Neil Armstrong", "Buzz Aldrin", "John Glenn", "Yuri Gagarin"),
  Q("US history", "What was the Underground Railroad?", "A secret route to freedom", "A subway line", "A train company", "A tunnel to Canada"),
  Q("US history", "How many states are in the United States?", "50", "48", "52", "51"),
  // World history
  Q("World history", "Which ancient civilization built the pyramids at Giza?", "Egyptians", "Romans", "Greeks", "Aztecs"),
  Q("World history", "Who sailed across the Atlantic in 1492 and reached the Americas?", "Christopher Columbus", "Marco Polo", "Ferdinand Magellan", "James Cook"),
  Q("World history", "The Great Wall was built in which country?", "China", "Japan", "India", "Mongolia"),
  Q("World history", "Which empire was ruled by Julius Caesar?", "Roman", "Greek", "Persian", "Ottoman"),
  Q("World history", "What was the Renaissance?", "A rebirth of art and learning", "A war", "A plague", "A voyage"),
  Q("World history", "Which city was the center of the ancient Olympic Games?", "Olympia", "Athens", "Sparta", "Rome"),
  Q("World history", "In which country did the Industrial Revolution begin?", "Britain", "France", "Germany", "Russia"),
  Q("World history", "The ancient Maya lived mostly in what is now...", "Mexico and Central America", "Peru", "Egypt", "Canada"),
  Q("World history", "Who is known for the theory of gravity and the laws of motion?", "Isaac Newton", "Albert Einstein", "Galileo", "Aristotle"),
  Q("World history", "Which writing system did ancient Egyptians use?", "Hieroglyphs", "Cuneiform", "Runes", "Latin"),
  Q("World history", "What did Johannes Gutenberg invent?", "The printing press", "The telescope", "The steam engine", "The compass"),
  Q("World history", "Which ancient people invented democracy?", "The Greeks", "The Romans", "The Egyptians", "The Persians"),
  // Geography
  Q("Geography", "Which is the longest river in the world?", "The Nile", "The Amazon", "The Mississippi", "The Yangtze"),
  Q("Geography", "What is the capital of Australia?", "Canberra", "Sydney", "Melbourne", "Perth"),
  Q("Geography", "Which continent is the Sahara Desert on?", "Africa", "Asia", "Australia", "South America"),
  Q("Geography", "What is the capital of Canada?", "Ottawa", "Toronto", "Vancouver", "Montreal"),
  Q("Geography", "Which country has the most people?", "India", "United States", "Brazil", "Russia"),
  Q("Geography", "Mount Everest is part of which mountain range?", "The Himalayas", "The Andes", "The Alps", "The Rockies"),
  Q("Geography", "Which ocean is the smallest?", "Arctic", "Indian", "Atlantic", "Pacific"),
  Q("Geography", "What is the capital of Brazil?", "Brasilia", "Rio de Janeiro", "Sao Paulo", "Buenos Aires"),
  Q("Geography", "Which two continents does Egypt touch?", "Africa and Asia", "Africa and Europe", "Asia and Europe", "Africa and South America"),
  Q("Geography", "What line divides Earth into Northern and Southern Hemispheres?", "The Equator", "Prime Meridian", "Tropic of Cancer", "International Date Line"),
  Q("Geography", "Which is the largest country by area?", "Russia", "Canada", "China", "United States"),
  Q("Geography", "Which US state is the biggest by area?", "Alaska", "Texas", "California", "Montana"),
  // Grammar & vocabulary
  Q("Grammar", "Which word is a noun?", "Happiness", "Quickly", "Run", "Beautiful"),
  Q("Grammar", "Which sentence is punctuated correctly?", "Where are you going?", "Where are you going.", "Where, are you going?", "Where are you going"),
  Q("Grammar", "What is the plural of 'cactus'?", "Cacti", "Cactuses only", "Cactus", "Cactis"),
  Q("Grammar", "Which word is an adverb?", "Slowly", "Slow", "Slowness", "Slows"),
  Q("Grammar", "Choose the correct word: 'They left ___ bags here.'", "their", "there", "they're", "thier"),
  Q("Grammar", "What is the past tense of 'swim'?", "Swam", "Swimmed", "Swum", "Swimming"),
  Q("Grammar", "Which word is a synonym for 'angry'?", "Furious", "Calm", "Tired", "Silly"),
  Q("Grammar", "What is the opposite of 'generous'?", "Selfish", "Kind", "Rich", "Loud"),
  Q("Grammar", "Which is a complete sentence?", "The dog barked loudly.", "Barking loudly the.", "The dog.", "Because it was loud."),
  Q("Grammar", "Which punctuation mark ends an excited sentence?", "Exclamation mark", "Comma", "Period", "Colon"),
  Q("Grammar", "A word that sounds the same as another but is spelled differently is a...", "Homophone", "Synonym", "Antonym", "Prefix"),
  Q("Grammar", "What does the prefix 'un-' usually mean?", "Not", "Again", "Before", "Too much"),
  // Reading & literature
  Q("Reading", "The main character in a story is called the...", "Protagonist", "Antagonist", "Narrator", "Author"),
  Q("Reading", "The time and place of a story is its...", "Setting", "Plot", "Theme", "Conflict"),
  Q("Reading", "A story told by a character using 'I' is in which point of view?", "First person", "Second person", "Third person", "Fourth person"),
  Q("Reading", "A comparison using 'like' or 'as' is a...", "Simile", "Metaphor", "Idiom", "Alliteration"),
  Q("Reading", "Which is an example of alliteration?", "Peter picked a pickled pepper", "Cool as a cucumber", "Time is money", "It's raining cats and dogs"),
  Q("Reading", "A story with talking animals that teaches a lesson is a...", "Fable", "Biography", "Diary", "News report"),
  Q("Reading", "What is the central message of a story called?", "Theme", "Setting", "Title", "Dialogue"),
  Q("Reading", "A true story about a person's life written by someone else is a...", "Biography", "Autobiography", "Fiction", "Poem"),
  Q("Reading", "Words that mean the opposite are called...", "Antonyms", "Synonyms", "Homonyms", "Acronyms"),
  Q("Reading", "What is an author's purpose when writing to teach?", "To inform", "To entertain", "To persuade", "To confuse"),
  // Money & measurement
  Q("Measurement", "How many centimeters are in a meter?", "100", "10", "1000", "50"),
  Q("Measurement", "How many ounces are in a pound?", "16", "12", "10", "8"),
  Q("Measurement", "How many cups are in a quart?", "4", "2", "8", "6"),
  Q("Measurement", "How many minutes are in an hour and a half?", "90", "60", "100", "120"),
  Q("Measurement", "Which unit would you use to measure the length of a pencil?", "Centimeters", "Kilometers", "Liters", "Kilograms"),
  Q("Measurement", "How many feet are in a yard?", "3", "12", "5", "10"),
  Q("Measurement", "How many milliliters are in a liter?", "1000", "100", "10", "10000"),
  Q("Measurement", "If a movie starts at 2:15 and lasts 90 minutes, when does it end?", "3:45", "3:15", "4:15", "3:30"),
  Q("Measurement", "How many quarters make 2 dollars?", "8", "4", "10", "20"),
  Q("Measurement", "What is 15% of 60?", "9", "6", "15", "12"),
  // Patterns & algebra basics
  Q("Patterns", "What comes next: 2, 4, 8, 16, ...?", "32", "24", "20", "30"),
  Q("Patterns", "What comes next: 5, 10, 15, 20, ...?", "25", "30", "35", "22"),
  Q("Patterns", "Solve: x + 7 = 15. What is x?", "8", "7", "22", "9"),
  Q("Patterns", "Solve: 3x = 21. What is x?", "7", "6", "18", "63"),
  Q("Patterns", "What is the value of 2 squared plus 3?", "7", "10", "5", "12"),
  Q("Patterns", "Which number is prime?", "13", "15", "21", "27"),
  Q("Patterns", "What is the next number: 1, 1, 2, 3, 5, 8, ...?", "13", "11", "12", "10"),
  Q("Patterns", "What is 3 + 4 x 2?", "11", "14", "10", "9"),
  Q("Patterns", "What is the greatest common factor of 12 and 18?", "6", "3", "9", "12"),
  Q("Patterns", "What is the least common multiple of 4 and 6?", "12", "24", "10", "2"),
];
export const EXTRA2_QUESTIONS = RAW.map((r, i) => {
  const pos = (i * 7 + 1) % 4;                 // vary where the right answer sits, deterministically
  const choices = [...r.wrong]; choices.splice(pos, 0, r.right);
  return { q: r.q, choices, answer: pos, concept: r.concept, ...(r.explain ? { explain: r.explain } : {}) };
});
