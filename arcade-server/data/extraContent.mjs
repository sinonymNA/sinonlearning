// Extra built-in prompts so repeat plays stay fresh. Plain data: edit freely.
const split = (s) => s.split("|").map((x) => x.trim()).filter(Boolean);

export const EXTRA_DRAW_PROMPTS = split(`
pancake|waffle|spaghetti|taco|sushi|cookie|donut|pretzel|hot dog|french fries|strawberry|pineapple|grapes|cherry|lemon|pear|broccoli|corn|mushroom|pumpkin|
lion|tiger|bear|monkey|zebra|kangaroo|koala|panda|dolphin|whale|octopus|crab|jellyfish|seahorse|frog|duck|chicken|cow|pig|horse|sheep|snail|bee|ladybug|ant|caterpillar|bat|hedgehog|squirrel|fox|wolf|camel|flamingo|peacock|parrot|toucan|crocodile|dinosaur|dragon|unicorn|mermaid|
tree|flower|cactus|mountain|volcano|rainbow|cloud|sun|moon|star|snowman|waterfall|island|desert|cave|campfire|umbrella|tornado|lightning|
robot|spaceship|alien|astronaut|satellite|telescope|planet|saturn|submarine|helicopter|hot air balloon|skateboard|scooter|fire truck|ambulance|ice cream truck|motorcycle|sailboat|
backpack|pencil|scissors|globe|ruler|calculator|clock|bookshelf|desk|chalkboard|microscope|magnet|paper airplane|trophy|medal|
guitar|drum|piano|trumpet|headphones|microphone|camera|television|laptop|phone|lamp|key|door|window|ladder|wheelbarrow|
crown|wizard hat|sword|shield|treasure chest|pirate ship|knight|ghost|witch|vampire|snow globe|
football|basketball|soccer ball|tennis racket|baseball bat|kite|yo-yo|jump rope|trampoline|swing|slide|sandcastle|
glasses|sneaker|boot|mitten|sock|t-shirt|sunglasses|top hat|
heart|smiley face|spiderweb|nest|anchor|compass|map|candle|birthday cake|present|balloon|fireworks|
rain cloud|bridge troll|haunted house|farm|barn|bakery|library|hospital|airport|castle moat|
fish bowl|bird house|bone|paw print|dog house|cat toy|hamster wheel|
sandwich|milkshake|lollipop|candy cane|gingerbread man|pie|honey jar|
thermometer|stethoscope|bandage|test tube|beaker|dna|atom|volcano model|
pyramid|great wall|eiffel tower|statue of liberty|windmill|totem pole|igloo|teepee
`);

export const EXTRA_TELEPHONE_PROMPTS = split(`
A cow doing yoga|A turtle winning a race|A llama at the dentist|A bear riding a unicycle|A snowman on vacation|A fish walking a dog|
A knight afraid of a mouse|A mermaid in a bathtub|A giraffe in a tiny car|A spider knitting a sweater|An octopus playing drums|
A superhero who sneezes a lot|A teacher made of spaghetti|A potato running for president|A chicken crossing a rainbow|
A pirate who is scared of water|A robot eating cereal|A giant carrot attacking a city|A cat flying a kite|
Two penguins on a first date|A dinosaur at a school bus stop|A banana slipping on a banana peel|A bee delivering pizza|
A koala hugging a cactus|A mouse driving a monster truck|A shark at a pool party|An alien learning to skateboard|
A wizard making a sandwich|A pumpkin playing basketball|A duck in a raincoat|A snail on a rocket|A sloth on a trampoline|
A moose wearing a tutu|A dragon stuck in a chimney|A clown balancing on a bowling ball|A raccoon opening a lemonade stand|
A bunny doing karate|A crab playing the piano|A hippo on a diving board|A monkey painting a masterpiece|
A cloud raining spaghetti|A tiny elephant in a teacup|A frog king on a lily pad|A fox in a library|An owl taking a selfie|
A yeti baking cupcakes|A zebra with polka dots|A cowboy riding a giant snail|A unicorn at a gas station|
A ghost doing homework|A bear catching a fish with a fishing rod|A pig flying a helicopter|A cat and dog sharing an umbrella|
A snowman melting at the beach|A mummy playing hide and seek|A turtle with a jetpack|A walrus ordering coffee|
A robot teaching a class|A squirrel stealing a sandwich|A flamingo doing ballet|A goat on a skyscraper|
A rocket made of cheese|A bus full of dinosaurs|A princess fixing a car|A lion learning to read|
A giraffe changing a lightbulb|A school of fish in a classroom|A penguin chef|A mad scientist with a puppy|
A cactus getting a hug|A baby dragon's first fire|A tree house with a slide|A treasure map with a mystery|
A cupcake with a crown|A hamster in a sports car|A kangaroo playing soccer|A sleepy bear at a bus stop|
A raccoon DJ|A jellyfish in a top hat|A pizza with legs running away|A volcano erupting confetti|
A dog teaching a cat to swim|A lighthouse keeper and a seagull|A robot dog at the park|A bat hanging out at the mall|
A whale wearing roller skates|A mouse and an elephant on a seesaw|A turkey running a marathon|A moon with sunglasses|
A caterpillar becoming a butterfly|The water cycle as a cartoon|A plant growing toward the sun|A rock cycle adventure
`);

const W = (word, related) => ({ word, related: related.split(" ").map((x) => x.replace(/_/g, " ")) });
export const EXTRA_IMPOSTER_WORDS = [
  W("CAMPING", "tent campfire marshmallows sleeping_bag hiking forest"),
  W("BIRTHDAY", "cake candles presents balloons party song"),
  W("HOSPITAL", "doctor nurse bandage waiting_room medicine bed"),
  W("AIRPORT", "plane luggage ticket security runway pilot"),
  W("CIRCUS", "clown tent acrobat tightrope popcorn lion"),
  W("FARM", "barn tractor cow hay chicken field"),
  W("CASTLE", "knight moat drawbridge tower king dragon"),
  W("SUPERMARKET", "cart aisle cashier groceries checkout shelves"),
  W("PLAYGROUND", "swing slide seesaw sandbox monkey_bars recess"),
  W("BAKERY", "bread oven dough pastry flour cupcakes"),
  W("OCEAN", "waves fish salt deep whale tide"),
  W("RAINFOREST", "jungle monkeys humid canopy vines parrot"),
  W("DESERT", "sand cactus camel dunes hot oasis"),
  W("ARCTIC", "ice polar_bear snow penguin igloo freezing"),
  W("VOLCANO", "lava eruption ash crater magma mountain"),
  W("THUNDERSTORM", "lightning thunder rain clouds umbrella wind"),
  W("MUSEUM", "exhibit statue guide quiet painting history"),
  W("FIRE STATION", "firefighter hose truck siren pole helmet"),
  W("POST OFFICE", "mail stamp letter package mailbox delivery"),
  W("BARBERSHOP", "haircut scissors mirror chair comb clippers"),
  W("MOVIE THEATER", "popcorn screen seats trailer tickets dark"),
  W("SOCCER", "goal kick referee field team net"),
  W("BASKETBALL", "hoop dribble court dunk free_throw team"),
  W("SWIMMING POOL", "lifeguard diving_board splash goggles lane towel"),
  W("SNOWMAN", "carrot scarf coal hat snowball winter"),
  W("HALLOWEEN", "costume candy pumpkin trick_or_treat ghost spooky"),
  W("THANKSGIVING", "turkey feast family pie grateful dinner"),
  W("CAMERA", "photo lens flash picture zoom selfie"),
  W("GARDEN", "seeds flowers soil water weeds bees"),
  W("KITCHEN", "stove fridge sink pots recipe chef"),
  W("SUBMARINE", "underwater periscope deep crew torpedo sonar"),
  W("PIRATE", "treasure ship parrot map eyepatch sea"),
  W("DINOSAUR", "fossil extinct bones roar museum giant"),
  W("ROBOT", "metal circuits battery program beep arms"),
  W("MAGIC SHOW", "wand rabbit hat tricks cape audience"),
  W("LIGHTHOUSE", "beam coast ships tower rocks keeper"),
  W("TRAIN", "tracks station conductor whistle tunnel ticket"),
  W("DENTIST", "teeth floss cavity chair brush check_up"),
  W("SKATEPARK", "ramp skateboard helmet tricks wheels bowl"),
  W("CLASSROOM", "whiteboard teacher desks books pencils students"),
  W("SCIENCE LAB", "beaker goggles experiment microscope chemicals notebook"),
  W("RIVER", "flow fish bridge current banks canoe"),
  W("ISLAND", "palm_trees beach surrounded boat coconut sand"),
  W("WINTER", "snow coat cold sled hot_chocolate ice"),
  W("SUMMER", "sun swimming vacation ice_cream hot shorts"),
  W("AUTUMN", "leaves pumpkin harvest cool_weather scarf acorns"),
  W("SPRING", "flowers rain bloom baby_animals green butterflies"),
  W("MARKET", "stalls vendors fruit bargain crowd bags"),
  W("THEATER", "stage actors curtain script costumes audience"),
  W("CONCERT", "band stage crowd lights music tickets"),
  W("TREEHOUSE", "ladder branches secret club hideout leaves rope"),
  W("SNOW DAY", "sled no_school hot_chocolate boots pajamas blizzard"),
  W("LEMONADE STAND", "pitcher cups sign sugar customers summer"),
  W("SPACE STATION", "astronaut orbit floating airlock earth experiments"),
  W("MOUNTAIN", "peak climb hiking snow altitude summit"),
  W("BEEHIVE", "honey queen buzzing wax pollen flowers"),
  W("CAMPFIRE", "stories smores logs smoke night sparks"),
  W("CHESS", "king queen board pawn checkmate strategy"),
  W("TREASURE", "gold chest map jewels buried pirate"),
];

const Q = (q, a, b, c, d, answer) => ({ q, choices: [a, b, c, d], answer });
export const EXTRA_QUESTIONS = [
  Q("What is the largest planet in our solar system?", "Earth", "Saturn", "Jupiter", "Neptune", 2),
  Q("What is 6 x 9?", "54", "56", "63", "45", 0),
  Q("Which gas do humans need to breathe?", "Oxygen", "Carbon dioxide", "Helium", "Hydrogen", 0),
  Q("Which of these is a synonym for 'big'?", "Tiny", "Enormous", "Quiet", "Slow", 1),
  Q("What is the capital of Japan?", "Seoul", "Beijing", "Tokyo", "Bangkok", 2),
  Q("How many sides does an octagon have?", "6", "7", "8", "10", 2),
  Q("What is 100 - 37?", "63", "67", "73", "57", 0),
  Q("What do you call a baby kangaroo?", "Pup", "Joey", "Cub", "Kit", 1),
  Q("Which is the hardest natural material?", "Gold", "Iron", "Diamond", "Quartz", 2),
  Q("What is the plural of 'child'?", "Childs", "Childen", "Children", "Childrens", 2),
  Q("Which part of the body pumps blood?", "Lungs", "Heart", "Brain", "Stomach", 1),
  Q("What is the opposite of 'increase'?", "Grow", "Decrease", "Add", "Rise", 1),
  Q("Which planet is closest to the Sun?", "Venus", "Earth", "Mercury", "Mars", 2),
  Q("What is 3/4 as a decimal?", "0.34", "0.75", "0.43", "0.6", 1),
  Q("What kind of animal is a frog?", "Reptile", "Mammal", "Amphibian", "Fish", 2),
  Q("Which of these is a proper noun?", "city", "Paris", "river", "teacher", 1),
  Q("How many days are in a leap year?", "364", "365", "366", "367", 2),
  Q("What is the main source of energy for Earth?", "The Moon", "The Sun", "Wind", "Volcanoes", 1),
  Q("Which sense do you use your ears for?", "Sight", "Hearing", "Taste", "Smell", 1),
  Q("What is 12 x 12?", "122", "124", "144", "148", 2),
  Q("Which ocean is the largest?", "Atlantic", "Indian", "Pacific", "Arctic", 2),
  Q("What is a group of fish called?", "Herd", "School", "Pack", "Flock", 1),
  Q("What do we call a word that means the opposite?", "Synonym", "Antonym", "Homonym", "Acronym", 1),
  Q("Water freezes at what temperature in Celsius?", "-10", "0", "10", "32", 1),
  Q("Which is the tallest animal?", "Elephant", "Giraffe", "Ostrich", "Horse", 1),
  Q("What shape is a stop sign?", "Circle", "Square", "Octagon", "Triangle", 2),
  Q("What is the perimeter of a square with sides of 5?", "10", "15", "20", "25", 2),
  Q("Which continent is the largest?", "Africa", "Asia", "Europe", "North America", 1),
  Q("What is the past tense of 'eat'?", "Eated", "Ate", "Eaten", "Eating", 1),
  Q("What do you call a scientist who studies rocks?", "Biologist", "Geologist", "Chemist", "Botanist", 1),
  Q("Which fraction is the largest?", "1/2", "1/3", "1/4", "1/8", 0),
  Q("What is 8 squared?", "16", "56", "64", "82", 2),
  Q("What part of a plant takes in water?", "Leaves", "Roots", "Flowers", "Fruit", 1),
  Q("Which is a solid at room temperature?", "Water", "Rock", "Steam", "Air", 1),
  Q("What is the sum of the angles in a triangle?", "90", "180", "270", "360", 1),
  Q("Who painted the Mona Lisa?", "Picasso", "Van Gogh", "Leonardo da Vinci", "Monet", 2),
  Q("What is the study of living things called?", "Physics", "Biology", "Geology", "Astronomy", 1),
  Q("What do herbivores eat?", "Meat", "Plants", "Both", "Rocks", 1),
  Q("Which country is shaped like a boot?", "Spain", "Greece", "Italy", "Portugal", 2),
  Q("How many hours are in a day?", "12", "24", "36", "48", 1),
  Q("What is the process plants use to make food?", "Respiration", "Photosynthesis", "Digestion", "Evaporation", 1),
  Q("Which is the smallest unit of life?", "Atom", "Cell", "Organ", "Tissue", 1),
  Q("Which instrument is played with a bow?", "Drum", "Flute", "Violin", "Trumpet", 2),
  Q("What is 1000 / 10?", "10", "100", "1000", "10000", 1),
  Q("What is the name of our galaxy?", "Andromeda", "Milky Way", "Orion", "Sombrero", 1),
  Q("A sentence must end with...", "A comma", "Punctuation", "A number", "A capital", 1),
  Q("Which metal is liquid at room temperature?", "Iron", "Mercury", "Copper", "Silver", 1),
  Q("What is an angle less than 90 degrees called?", "Right", "Acute", "Obtuse", "Straight", 1),
  Q("Which layer of the atmosphere do we live in?", "Stratosphere", "Troposphere", "Mesosphere", "Exosphere", 1),
  Q("What is the main idea of a paragraph?", "The first word", "What it is mostly about", "The longest sentence", "The title only", 1),
  Q("Which of these is renewable energy?", "Coal", "Oil", "Solar", "Natural gas", 2),
  Q("What is the largest organ of the human body?", "Heart", "Liver", "Skin", "Brain", 2),
  Q("How many bones does an adult human have (about)?", "106", "206", "306", "406", 1),
  Q("Which number is even?", "17", "23", "28", "31", 2),
  Q("What is 25% of 80?", "15", "20", "25", "40", 1),
  Q("Which is an example of a simile?", "He is a lion", "He runs like the wind", "It's raining cats and dogs", "The wind whispered", 1),
  Q("What do we call frozen water falling from clouds?", "Rain", "Snow", "Fog", "Dew", 1),
  Q("Which tool measures length?", "Scale", "Ruler", "Thermometer", "Clock", 1),
  Q("What is the capital of Canada?", "Toronto", "Vancouver", "Ottawa", "Montreal", 2),
  Q("Which planet is known for its Great Red Spot?", "Mars", "Jupiter", "Saturn", "Venus", 1),
  Q("What is the product of 7 and 6?", "36", "42", "48", "49", 1),
  Q("Which is a mammal that lays eggs?", "Bat", "Platypus", "Whale", "Seal", 1),
  Q("What does a noun do in a sentence?", "Names something", "Describes a verb", "Joins words", "Shows action", 0),
  Q("Which two colors make orange?", "Blue and yellow", "Red and yellow", "Red and blue", "Green and red", 1),
  Q("What is the longest bone in the human body?", "Femur", "Humerus", "Spine", "Rib", 0),
  Q("Who discovered gravity after an apple fell (the story)?", "Einstein", "Newton", "Galileo", "Darwin", 1),
  Q("Which word is spelled correctly?", "Becuase", "Because", "Becasue", "Becaus", 1),
  Q("What is the value of pi rounded to two decimals?", "3.12", "3.14", "3.41", "3.18", 1),
  Q("What is a polygon with 5 sides called?", "Hexagon", "Pentagon", "Octagon", "Square", 1),
  Q("What is the main language of Mexico?", "Portuguese", "Spanish", "French", "English", 1),
  Q("What does a meteorologist study?", "Rocks", "Weather", "Animals", "Stars", 1),
  Q("What is 45 + 38?", "73", "83", "93", "82", 1),
  Q("Which is a prime number?", "21", "27", "29", "33", 2),
  Q("What type of triangle has three equal sides?", "Scalene", "Isosceles", "Equilateral", "Right", 2),
  Q("The Great Barrier Reef is near which country?", "Brazil", "Australia", "India", "Egypt", 1),
  Q("Which vitamin do we get from sunlight?", "A", "C", "D", "K", 2),
  Q("Which is a primary color?", "Green", "Orange", "Red", "Purple", 2),
  Q("A verb is a word that shows...", "A place", "Action or state", "A person", "A color", 1),
  Q("How many millimeters are in a centimeter?", "1", "10", "100", "1000", 1),
  Q("Which is the closest star to Earth?", "Sirius", "The Sun", "Polaris", "Alpha Centauri", 1),
];
