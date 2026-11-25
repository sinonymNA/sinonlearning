// Original word + clue bank for Back Issues crosswords and word searches (clues are written for this game). Lines are "WORD|clue|difficulty 1-3", grouped by crate theme.
const RAW = {
  animals: `OTTER|River swimmer that sleeps holding hands|1
EAGLE|Bird of prey with amazing eyesight|1
ZEBRA|Striped grazer of the African plains|1
KOALA|Eucalyptus-munching marsupial from Australia|1
TIGER|Biggest wild cat, with orange and black stripes|1
SHARK|Ocean hunter with a famous fin|1
HORSE|You can ride it, and it neighs|1
SNAKE|Slithering reptile with no legs|1
PANDA|Black-and-white bamboo lover|1
LLAMA|Woolly mountain animal that may spit|2
CAMEL|Desert traveler with humps|1
GIRAFFE|The tallest animal on Earth|1
PENGUIN|Flightless bird that waddles on ice|1
DOLPHIN|Clever sea mammal that clicks and whistles|1
OCTOPUS|Eight-armed ocean dweller|1
KANGAROO|Hops with a baby in its pouch|1
BUTTERFLY|The grown-up form of a caterpillar|2
HEDGEHOG|Spiky little garden visitor|2
FLAMINGO|Pink bird that stands on one leg|2
CHEETAH|The fastest land animal|1
GORILLA|The largest of the apes|2
BEAVER|Dam-building rodent|2
TURTLE|Reptile that carries its shell|1
PARROT|Colorful bird that can copy speech|1`,
  geography: `CANADA|Country just north of the United States|1
EGYPT|Land of pyramids and the Nile|1
JAPAN|Island nation with Mount Fuji|1
BRAZIL|South America's biggest country|1
AFRICA|Continent that holds the Sahara|1
EUROPE|Continent with France and Italy|1
ASIA|The largest continent|1
RIVER|Flowing water on its way to the sea|1
ISLAND|Land surrounded by water|1
DESERT|Dry place with very little rain|1
VOLCANO|Mountain that can erupt|1
OCEAN|Huge body of salt water|1
MOUNTAIN|Very high landform with a peak|1
PACIFIC|The largest ocean|2
ATLANTIC|Ocean between the Americas and Europe|2
AMAZON|Giant South American river and rainforest|2
EQUATOR|Imaginary line around Earth's middle|2
CAPITAL|City where a country's government sits|2
CONTINENT|One of Earth's seven great landmasses|2
GLACIER|Slow river of ice|2
CANYON|Deep valley carved by a river|2
ARCTIC|Frozen region around the North Pole|2
PYRAMID|Ancient Egyptian tomb shape|1
ITALY|Boot-shaped country in Europe|1`,
  science: `ATOM|Tiny building block of matter|1
GRAVITY|Force that pulls things toward Earth|1
ENERGY|The ability to do work|1
MAGNET|Pulls on iron and steel|1
PLANT|Makes its own food from sunlight|1
CELL|Smallest unit of life|1
FOSSIL|Preserved remains of ancient life|1
OXYGEN|Gas we breathe in|1
LIQUID|State of matter that flows, like water|1
SOLID|State of matter with a fixed shape|1
SCIENCE|Study of the natural world|1
ELECTRIC|Kind of current that lights a lamp|2
BATTERY|Stores power for a toy or torch|1
THUNDER|Rumble that follows lightning|1
LIGHTNING|Bright flash during a storm|1
MOLECULE|Group of atoms joined together|3
PRISM|Glass shape that splits light into colors|2
FRICTION|Rubbing force that slows sliding|2
EVAPORATE|What puddles do when the sun shines|3
MICROSCOPE|Tool for seeing tiny things|2
SKELETON|The frame of bones in your body|1
HABITAT|An animal's natural home|2
EXPERIMENT|A test to find something out|2
ROBOT|Machine that can follow programmed steps|1`,
  food: `PIZZA|Cheesy round Italian favorite|1
PASTA|Spaghetti or macaroni|1
BREAD|Baked loaf used for sandwiches|1
CHEESE|Made from milk, like cheddar|1
BANANA|Yellow fruit with a peel|1
APPLE|Fruit said to keep the doctor away|1
ORANGE|Juicy citrus fruit and a color|1
PEANUT|Nut-like legume made into butter|1
COOKIE|Sweet baked treat, maybe with chips|1
POPCORN|Corn that pops, popular at movies|1
PANCAKE|Flat breakfast treat flipped in a pan|1
SANDWICH|Fillings between two slices of bread|1
CARROT|Orange root vegetable rabbits love|1
POTATO|Starchy tuber made into fries|1
TOMATO|Red fruit used in ketchup|1
LEMON|Sour yellow citrus|1
MANGO|Sweet tropical fruit with a big stone|2
HONEY|Sweet food made by bees|1
CEREAL|Breakfast food poured into milk|1
YOGURT|Creamy cultured milk snack|2
BROCCOLI|Green vegetable shaped like tiny trees|2
CHOCOLATE|Sweet treat made from cacao|1
SPAGHETTI|Long thin noodles|1
WAFFLE|Gridded breakfast treat|2`,
  history: `KNIGHT|Medieval soldier in armor|1
CASTLE|Fortified home of a lord|1
PIRATE|Sea robber with a skull-and-crossbones flag|1
EXPLORER|Traveler who seeks new places|2
EMPIRE|Many lands ruled together|2
ROMAN|Citizen of ancient Rome|1
VIKING|Norse seafarer in a longship|1
PHARAOH|Ruler of ancient Egypt|2
COLONY|Settlement far from its home country|2
TREATY|Written agreement between nations|3
REVOLUTION|Big sudden change, often against rulers|3
INVENTOR|Makes something brand new|2
MUSEUM|Place that keeps old treasures|1
ARMOR|Metal covering for a knight|1
SCROLL|Rolled-up ancient document|2
THRONE|Seat for a king or queen|1
DYNASTY|Line of rulers from one family|3
GLADIATOR|Roman arena fighter|2
PIONEER|One of the first to settle a region|2
ANCIENT|Very, very old|1
CROWN|Royal headgear|1
KINGDOM|Land ruled by a monarch|1
TELEGRAPH|Old way to send messages by wire|2
STEAMBOAT|Paddle vessel powered by boiling water|2`,
  space: `PLANET|Orbits a star|1
GALAXY|Huge group of stars, like the Milky Way|1
COMET|Icy visitor with a glowing tail|1
ORBIT|Path around a planet or star|1
ROCKET|Launches into space|1
ASTEROID|Rocky chunk drifting through space|2
SATURN|Planet with famous rings|1
JUPITER|The largest planet|1
MARS|The red planet|1
VENUS|The hottest planet|2
MERCURY|Planet closest to the Sun|2
NEPTUNE|Distant blue planet|2
ECLIPSE|When one world blocks another's light|2
TELESCOPE|Brings faraway stars closer|2
ASTRONAUT|Person who travels in space|1
CRATER|Bowl-shaped dent on the Moon|1
UNIVERSE|Everything that exists|2
SOLAR|Relating to the Sun|1
METEOR|Shooting star streaking through the sky|2
SPACESHIP|Vehicle for traveling among the stars|1
LUNAR|Relating to the Moon|2
STAR|Giant ball of burning gas, like the Sun|1
MOON|Earth's natural satellite|1
ALIEN|Visitor from another world, in stories|1`,
  sports: `SOCCER|Game with goals and a round ball you kick|1
TENNIS|Racket game played over a net|1
HOCKEY|Sport played with sticks and a puck|1
BASEBALL|Bat, ball and bases|1
BASKETBALL|Dribble and shoot at a hoop|1
SWIMMING|Racing through a pool|1
GOLF|Hit a small ball into 18 holes|1
RUGBY|Oval-ball team game|1
CRICKET|Bat-and-wicket game, also a chirping insect|2
MARATHON|Very long race of 26 miles|2
ARCHERY|Shooting arrows at a target|2
SKATING|Gliding on ice or on wheels|1
GYMNAST|Performs flips and balance beam routines|2
SPRINT|Short, fast race|1
MEDAL|Prize hung around a winner's neck|1
TROPHY|Cup awarded to champions|1
REFEREE|Official who enforces the rules|2
STADIUM|Big venue for games|1
RELAY|Race where teammates pass a baton|2
GOALIE|Defends the net|2
SKIING|Gliding downhill on snow|1
BOWLING|Rolling a ball to knock down pins|1
KARATE|Martial art from Japan|2
WRESTLING|Grappling sport on a mat|2`,
  nature: `FOREST|Large area full of trees|1
MEADOW|Grassy field of wildflowers|2
BLOSSOM|Flower on a fruit tree|2
RAINBOW|Colorful arc after rain|1
WATERFALL|Water dropping over a cliff|1
SEASON|One of four parts of the year|1
AUTUMN|Season when leaves fall|1
WINTER|The coldest season|1
SPRING|Season of new growth|1
SUMMER|The warmest season|1
CLOUD|Fluffy thing in the sky|1
BREEZE|A gentle wind|2
SNOWFLAKE|One frozen crystal, no two alike|1
POND|Small body of still water|1
LEAF|Green part of a tree that makes food|1
BRANCH|Limb of a tree|1
ROOT|Underground part that drinks water|1
SEED|A plant's tiny beginning|1
MOSS|Soft green carpet on rocks|2
VALLEY|Low land between hills|1
JUNGLE|Dense tropical rainforest|1
SUNRISE|The start of the day|1
TIDE|The rising and falling of the sea|2
CORAL|Builder of ocean reefs|2`,
  school: `PENCIL|Writing tool with an eraser, maybe|1
LIBRARY|Quiet place full of books|1
TEACHER|Person who leads the class|1
HOMEWORK|Work you take home from class|1
NOTEBOOK|Book for writing notes|1
RULER|Measures in centimeters|1
ERASER|Rubs out mistakes|1
BACKPACK|Bag carried on your shoulders|1
LESSON|One period of teaching|1
GRAMMAR|The rules of language|2
HISTORY|Subject about the past|1
MATHS|Subject of sums and shapes|1
SPELLING|Putting letters in the right order|1
RECESS|Playtime break|1
CLASSROOM|Where students learn|1
DESK|A student's table|1
CHALK|Used on a blackboard|1
MARKER|Pen for a whiteboard|1
SCISSORS|You cut paper with these|1
GLUE|Sticky stuff for crafts|1
DICTIONARY|Book of word meanings|2
ALPHABET|Letters from A to Z, in order|1
ESSAY|Short piece of writing on one topic|2
EXAM|A test of what you know|1`,
  music: `GUITAR|Six-stringed instrument|1
PIANO|Keyboard with black and white keys|1
DRUMS|Beaten to keep the rhythm|1
VIOLIN|Bowed string instrument|1
TRUMPET|Brass horn with three valves|2
FLUTE|Woodwind you blow across|1
CHOIR|Group of singers|1
MELODY|A tune you can hum|2
RHYTHM|Pattern of beats|2
HARMONY|Notes that sound good together|2
CONCERT|Live music show|1
SINGER|Performs with a voice|1
BANJO|Twangy country instrument|2
CELLO|Big cousin of the violin|2
LYRICS|The words of a song|2
TEMPO|Speed of the music|2
OPERA|A play that is sung|2
ORCHESTRA|Large group of instrumentalists|2
XYLOPHONE|Percussion instrument with wooden bars|3
SAXOPHONE|Curved jazz horn|3
MICROPHONE|Makes a voice louder|2
GUITARIST|Person who plays six strings|2
NOTE|A single musical sound or its symbol|1
SCALE|The do-re-mi ladder|2`,
};
export const THEMES = Object.keys(RAW);
export const WORDS = Object.fromEntries(THEMES.map((t) => [t, RAW[t].split("\n").map((l) => { const [w, c, d] = l.split("|"); return { w, c, d: +d, t }; })]));
export const ALL_WORDS = THEMES.flatMap((t) => WORDS[t]);

/** Short sayings for cryptograms: public-domain proverbs and a few invented front-page headlines. Letters and spaces only. */
export const SAYINGS = [
  "A STITCH IN TIME SAVES NINE", "THE EARLY BIRD CATCHES THE WORM", "ACTIONS SPEAK LOUDER THAN WORDS", "BETTER LATE THAN NEVER", "PRACTICE MAKES PERFECT", "KINDNESS COSTS NOTHING",
  "WHERE THERE IS A WILL THERE IS A WAY", "EVERY CLOUD HAS A SILVER LINING", "A PICTURE IS WORTH A THOUSAND WORDS", "SLOW AND STEADY WINS THE RACE", "TWO HEADS ARE BETTER THAN ONE", "LOOK BEFORE YOU LEAP",
  "THE PEN IS MIGHTIER THAN THE SWORD", "HONESTY IS THE BEST POLICY", "KNOWLEDGE IS POWER", "ROME WAS NOT BUILT IN A DAY", "ALL THAT GLITTERS IS NOT GOLD", "A FRIEND IN NEED IS A FRIEND INDEED",
  "LOCAL CAT RESCUED FROM TALL TREE", "MYSTERY LIGHTS SEEN OVER THE HARBOR", "BAKERY SELLS RECORD NUMBER OF PIES", "TOWN CLOCK RUNS BACKWARD FOR AN HOUR", "SCHOOL BAND WINS THE COUNTY CUP", "GIANT PUMPKIN WEIGHS OVER A TON",
  "NEW LIBRARY OPENS ITS DOORS", "DOG LEADS PARADE IN WRONG DIRECTION", "FARMER FINDS BURIED TREASURE IN CORNFIELD", "BALLOON FLIGHT LANDS IN WRONG TOWN", "MAYOR SWAPS HAT FOR A BEE HIVE", "SNOW FALLS ON THE FIRST DAY OF SUMMER",
  "WHEN IN DOUBT WRITE IT DOWN", "MANY HANDS MAKE LIGHT WORK", "A SMILE IS THE SAME IN EVERY LANGUAGE", "CURIOSITY IS THE START OF WISDOM", "FORTUNE FAVORS THE BRAVE", "THE BEST TIME TO START IS NOW",
  "READ ALL ABOUT IT", "STOP THE PRESSES", "EXTRA EXTRA READ ALL ABOUT IT", "BIG NEWS IN A SMALL TOWN",
];
