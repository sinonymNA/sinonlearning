// Abyss prompt bank. Every prompt is an open question with many valid answers sorted into six rarity tiers.
// Tier meaning (editorial judgement, see ARCADE_ABYSS.md):
//   bubble = the obvious answers anyone gives        clever = the "I'll be clever" answers many others also pick
//   shoal  = solid, ordinary-knowledge answers       reef   = noticeably less familiar
//   trench = specialist knowledge                    pearl  = standout deep cuts
// Answers are "name=alias=alias" separated by "|". `rule` is verified by the test-suite so prompts can't contradict themselves.
const t = (s) => s.split("|").map((x) => x.trim()).filter(Boolean);
const P = (id, cat, prompt, tiers, rule = null) => ({ id, cat, prompt, rule, tiers: Object.fromEntries(Object.entries(tiers).map(([k, v]) => [k, t(v)])) });

export const ABYSS_PROMPTS = [
  P("country-b", "Geography", "Name a country that begins with the letter B", {
    bubble: "brazil=brasil|belgium", clever: "bhutan|brunei=brunei darussalam", shoal: "bolivia|bulgaria|bahamas=the bahamas|bangladesh|belarus",
    reef: "bahrain|barbados|belize|botswana", trench: "bosnia and herzegovina=bosnia|benin|burundi", pearl: "burkina faso",
  }, { startsWith: "b" }),
  P("element", "Science", "Name an element from the periodic table", {
    bubble: "oxygen|hydrogen|gold|iron|carbon|helium", clever: "xenon|krypton|plutonium",
    shoal: "nitrogen|silver|copper|zinc|lead|sodium|calcium|chlorine|neon|sulfur=sulphur|argon|tin|nickel|lithium|silicon|uranium|mercury|aluminum=aluminium|potassium|magnesium|phosphorus|iodine|titanium",
    reef: "tungsten|cobalt|boron|platinum|bismuth|cadmium|chromium|manganese|fluorine|arsenic|antimony|barium|radon|beryllium|selenium|gallium",
    trench: "ytterbium|rubidium|tellurium|hafnium|rhenium|osmium|iridium|scandium|vanadium|zirconium|niobium|molybdenum|strontium|indium|thallium|polonium|francium|astatine|praseodymium",
    pearl: "dysprosium|protactinium|roentgenium|livermorium|holmium|thulium|europium|lutetium|seaborgium|flerovium",
  }),
  P("emperor", "History", "Name a Roman emperor", {
    bubble: "augustus|nero|caligula|constantine=constantine the great|trajan", clever: "romulus augustulus|tiberius|claudius",
    shoal: "hadrian|marcus aurelius|vespasian|titus|domitian|diocletian|commodus|caracalla|septimius severus|nerva|antoninus pius",
    reef: "galba|otho|vitellius|valerian|aurelian|probus|theodosius|julian|gordian|decius|macrinus|elagabalus|pertinax|jovian",
    trench: "didius julianus|carus|numerian|carinus|tacitus|florian|balbinus|pupienus|hostilian|aemilian|quintillus|lucius verus|maximinus thrax",
    pearl: "majorian|avitus|glycerius|libius severus|olybrius|anthemius|petronius maximus",
  }),
  P("shark", "Nature", "Name a species of shark", {
    bubble: "great white=great white shark|hammerhead=hammerhead shark|tiger shark=tiger|bull shark=bull|whale shark",
    clever: "goblin shark|megalodon|cookiecutter shark=cookiecutter|greenland shark",
    shoal: "nurse shark|mako=mako shark|blue shark|thresher shark=thresher|lemon shark|basking shark|reef shark|blacktip shark|whitetip shark=oceanic whitetip|angel shark|leopard shark|zebra shark|spiny dogfish=dogfish",
    reef: "frilled shark|wobbegong|sandbar shark|silky shark|porbeagle|salmon shark|bonnethead|bluntnose sixgill shark=sixgill shark|horn shark|epaulette shark|catshark=cat shark|tope shark|carpet shark|lantern shark|sleeper shark|crocodile shark|swell shark|bamboo shark",
    trench: "megamouth shark=megamouth|pyjama shark|kitefin shark|gulper shark|bramble shark|sawshark|pocket shark|viper dogfish",
    pearl: "taillight shark|velvet belly lanternshark|blackmouth catshark|bigeye thresher|dwarf lanternshark",
  }),
  P("car", "Brands", "Name a car manufacturer", {
    bubble: "toyota|ford|honda|bmw|chevrolet=chevy|tesla|mercedes=mercedes-benz",
    clever: "lamborghini|ferrari|bugatti|rolls-royce=rolls royce|bentley|maserati|aston martin|mclaren",
    shoal: "audi|volkswagen=vw|nissan|hyundai|kia|mazda|subaru|jeep|dodge|porsche|volvo|fiat|jaguar|land rover|lexus|chrysler|cadillac|mini|suzuki|mitsubishi|buick|peugeot|renault",
    reef: "citroen|alfa romeo|saab|lotus|pontiac|oldsmobile|dacia|skoda|seat|opel|infiniti|acura|ram|gmc|lincoln|genesis|polestar|rivian|lucid|plymouth|hummer|isuzu|daihatsu",
    trench: "tata|mahindra|geely|byd|chery|great wall|nio|lada|zastava|holden|proton|perodua|ssangyong|vauxhall|tatra|spyker|koenigsegg|pagani|morgan|caterham|ariel|lancia|delorean|tucker|studebaker|packard|hudson|duesenberg",
    pearl: "trabant|moskvitch|borgward|hispano-suiza=hispano suiza|wartburg|gumpert",
  }),
  P("dog", "Nature", "Name a dog breed", {
    bubble: "labrador=labrador retriever=lab|golden retriever|german shepherd|poodle|bulldog|beagle|pug|chihuahua",
    clever: "shiba inu|corgi=pembroke welsh corgi|husky=siberian husky|dachshund",
    shoal: "rottweiler|boxer|great dane|doberman=doberman pinscher|border collie|dalmatian|shih tzu|pomeranian|yorkshire terrier=yorkie|cocker spaniel|saint bernard=st bernard|australian shepherd|maltese|bichon frise|akita|greyhound|bloodhound|basset hound|pit bull=pitbull|mastiff|samoyed|whippet|schnauzer|collie|jack russell terrier=jack russell|french bulldog|newfoundland|cavalier king charles spaniel|weimaraner|vizsla",
    reef: "bernese mountain dog|chow chow|shar pei|afghan hound|borzoi|papillon|pekingese|irish setter|english setter|airedale terrier|scottish terrier|west highland terrier=westie|bull terrier|staffordshire bull terrier|rhodesian ridgeback|great pyrenees|alaskan malamute=malamute|leonberger|brittany|pointer|lhasa apso|havanese|basenji|saluki|bullmastiff|keeshond|schipperke",
    trench: "xoloitzcuintli=xolo|lagotto romagnolo|azawakh|otterhound|norwegian lundehund=lundehund|komondor|puli|bergamasco|sloughi|pumi|mudi|finnish lapphund|kooikerhondje|entlebucher|swedish vallhund|affenpinscher|brussels griffon|chinese crested",
    pearl: "bracco italiano|peruvian inca orchid|kromfohrlander|thai ridgeback|stabyhoun|drever|lancashire heeler|sealyham terrier",
  }),
  P("ology", "Language", "Name a word that ends in -ology", {
    bubble: "biology|psychology|geology|technology|ecology",
    clever: "ideology|methodology|terminology",
    shoal: "sociology|anthropology|archaeology|theology|zoology|astrology|mythology|pathology|physiology|meteorology|etymology|cardiology|neurology|radiology|oncology|dermatology|toxicology|criminology|immunology|hydrology",
    reef: "ornithology|entomology|seismology|mycology|ufology|volcanology|herpetology|ichthyology|glaciology|cosmology|oenology|speleology|graphology|phrenology|pharmacology",
    trench: "dendrochronology|cetology|oology|pomology|malacology|arachnology|myrmecology|bryology|nephology|tribology|paleontology=palaeontology|limnology|ecclesiology",
    pearl: "vexillology|campanology|cryptozoology|hippology|coleopterology|lepidopterology|apiology",
  }, { endsWith: "ology" }),
  P("africa-capital", "Geography", "Name a capital city in Africa", {
    bubble: "cairo|nairobi", clever: "addis ababa|ouagadougou|djibouti",
    shoal: "pretoria|accra|abuja|rabat|tunis|dakar|algiers|tripoli|khartoum|kampala|harare|lusaka|kinshasa",
    reef: "windhoek|maputo|luanda|kigali|bamako|niamey|lilongwe|antananarivo|mogadishu|gaborone|conakry|freetown|monrovia|brazzaville|libreville|juba|dodoma|yaounde|ndjamena|asmara",
    trench: "porto-novo=porto novo|lome|nouakchott|banjul|bissau|malabo|maseru|mbabane|moroni|praia|port louis|gitega|bangui|yamoussoukro",
    pearl: "victoria|sao tome|bloemfontein",
  }),
  P("greek-myth", "Myth", "Name a figure from Greek mythology", {
    bubble: "zeus|poseidon|athena|apollo|hades|hera",
    clever: "medusa|hercules=heracles|achilles|odysseus",
    shoal: "aphrodite|ares|artemis|demeter|dionysus|hermes|hephaestus|persephone|hestia|eros|pan|prometheus|atlas|cronus=kronos|gaia|nike|helios|selene|hecate|nemesis|morpheus|theseus|perseus|orpheus|pandora|icarus",
    reef: "eos|hypnos|thanatos|iris|hebe|rhea|themis|tyche|nyx|erebus|oceanus|hyperion|iapetus|coeus|theia|phoebe|tethys|mnemosyne|metis|asclepius|triton|aeolus|boreas|zephyrus|eris|enyo|momus|jason|atalanta|ariadne|cassandra",
    trench: "aether|ananke|chaos|hemera|pontus|uranus|ourea|thalassa|leto|dione|asteria|eurybia|astraeus|pallas|perses|styx|pheme|ate|hygieia|panacea|achlys|bellerophon|daedalus|tantalus|sisyphus",
    pearl: "kratos|bia|zelos=zelus|kairos|nerites|palaemon|arke",
  }),
  P("instrument", "Music", "Name a musical instrument", {
    bubble: "piano|guitar|drums=drum|violin|flute|trumpet", clever: "theremin|didgeridoo|kazoo|bagpipes",
    shoal: "saxophone=sax|clarinet|cello|harp|trombone|tuba|oboe|bass guitar|ukulele|banjo|accordion|harmonica|xylophone|tambourine|organ|double bass|viola|mandolin|bassoon|french horn=horn|piccolo|recorder|triangle|cymbals|maracas|bongo=bongos|synthesizer=synth|keyboard|sitar|bugle|cornet",
    reef: "harpsichord|lute|zither|dulcimer|glockenspiel|marimba|vibraphone|celesta|bandoneon|concertina|ocarina|panpipes=pan flute|balalaika|bouzouki|djembe|castanets|cowbell|tabla|erhu|shamisen|koto|pipa|oud|cajon|kalimba=mbira|steel drum=steelpan|hurdy-gurdy=hurdy gurdy|sousaphone|flugelhorn|euphonium|english horn=cor anglais|bass clarinet|contrabassoon|melodica|autoharp",
    trench: "sackbut|serpent|crumhorn|shawm|rebec|vielle|theorbo|viola da gamba=viol|cimbalom|kantele|guzheng|morin khuur|hang drum=hang|nyckelharpa|hardanger fiddle|bodhran|tin whistle|uilleann pipes|santoor|sarod|veena|shehnai|duduk|kora|balafon|berimbau|charango|quena",
    pearl: "ondes martenot|cristal baschet|waterphone|octobass|stroh violin|contrabass flute",
  }),
  P("fruit", "Food", "Name a fruit", {
    bubble: "apple|banana|orange|strawberry|grape=grapes|watermelon", clever: "dragon fruit=dragonfruit|durian|kiwi",
    shoal: "pear|peach|cherry|pineapple|mango|lemon|lime|blueberry|raspberry|plum|grapefruit|cantaloupe=melon|avocado|coconut|pomegranate|apricot|blackberry|papaya|fig|nectarine|tangerine=mandarin|cranberry|passion fruit|guava|lychee",
    reef: "persimmon|quince|star fruit=starfruit|jackfruit|mulberry|gooseberry|blackcurrant=currant|elderberry|kumquat|tamarind|plantain|date|honeydew|clementine|boysenberry|loganberry|cloudberry|lingonberry|rambutan|mangosteen|cherimoya|pomelo|ugli fruit=ugli|soursop",
    trench: "jabuticaba|salak=snake fruit|longan|langsat|marang|sapodilla|feijoa=pineapple guava|medlar|jujube|loquat|cupuacu|breadfruit|ackee|black sapote|tamarillo|cape gooseberry=physalis|miracle fruit|jostaberry|sea buckthorn",
    pearl: "pulasan|santol|abiu|bilimbi|kepel|buddha's hand=buddhas hand|noni",
  }),
  P("moon", "Space", "Name a moon in our solar system", {
    bubble: "moon=the moon|luna|titan|europa|io", clever: "phobos|deimos",
    shoal: "ganymede|callisto|triton|enceladus|charon|mimas|oberon|titania|miranda|ariel|umbriel|iapetus|rhea|dione|tethys|hyperion|phoebe|nereid|amalthea",
    reef: "himalia|pandora|prometheus|janus|epimetheus|atlas|pan|daphnis|puck|portia|juliet|cordelia|ophelia|belinda|proteus|larissa|despina|galatea|thalassa|naiad|metis|adrastea|thebe|elara|ananke|carme|pasiphae|sinope|lysithea|leda|hydra|nix|kerberos|styx",
    trench: "cressida|desdemona|bianca|cupid|mab|perdita|rosalind|sycorax|caliban|prospero|setebos|stephano|trinculo|francisco|margaret|ferdinand",
    pearl: "hati|skoll|fenrir|ymir|kiviuq|paaliaq|siarnaq|tarvos|mundilfari|suttungr",
  }),
  P("shakespeare", "Literature", "Name a play by William Shakespeare", {
    bubble: "hamlet|romeo and juliet|macbeth|othello|king lear", clever: "titus andronicus|the tempest=tempest",
    shoal: "a midsummer night's dream=midsummer nights dream|much ado about nothing|twelfth night|the merchant of venice=merchant of venice|julius caesar|as you like it|the taming of the shrew=taming of the shrew|richard iii|henry v|antony and cleopatra|the winter's tale=winters tale|coriolanus|richard ii",
    reef: "cymbeline|pericles|timon of athens|troilus and cressida|measure for measure|all's well that ends well|love's labour's lost=loves labours lost|the comedy of errors=comedy of errors|the two gentlemen of verona=two gentlemen of verona|king john|henry iv|henry vi|henry viii|the merry wives of windsor=merry wives of windsor",
    trench: "the two noble kinsmen=two noble kinsmen|edward iii|cardenio",
    pearl: "sir thomas more",
  }),
  P("mountain", "Geography", "Name a famous mountain", {
    bubble: "everest=mount everest|k2|kilimanjaro|mont blanc|matterhorn|denali|fuji=mount fuji", clever: "olympus=mount olympus|sinai=mount sinai|kosciuszko=mount kosciuszko",
    shoal: "mount rushmore|mount st helens=mount saint helens|ben nevis|aconcagua|annapurna|kangchenjunga|lhotse|makalu|cho oyu|elbrus=mount elbrus|vesuvius=mount vesuvius|etna=mount etna|mount whitney|mount rainier=rainier|eiger|snowdon|table mountain|half dome|pikes peak",
    reef: "nanga parbat|dhaulagiri|manaslu|shishapangma|gasherbrum|broad peak|mount cook=aoraki|mount kenya|mount stanley|jungfrau|monch|mount logan|mount washington|mount hood|mount shasta|mount baker|mount mckinley|pico de orizaba|chimborazo|cotopaxi|mount ararat=ararat|mount cameroon",
    trench: "mount vinson|mount tyree|puncak jaya|carstensz pyramid|mount wilhelm|mount kinabalu|mount toubkal=toubkal|mount meru|mount nyiragongo|mount erebus|cerro torre|fitz roy|mount roraima=roraima|huascaran|ojos del salado|mount sidley",
    pearl: "gangkhar puensum|mount ulu muda|ama dablam|mount shkhara|pik pobeda|mount belukha=belukha|mount kazbek|mount damavand=damavand",
  }),
  P("painter", "Art", "Name a famous painter", {
    bubble: "picasso=pablo picasso|van gogh=vincent van gogh|da vinci=leonardo da vinci|monet=claude monet|michelangelo|rembrandt", clever: "banksy|bob ross|jackson pollock=pollock|andy warhol=warhol",
    shoal: "salvador dali=dali|frida kahlo=kahlo|georgia o'keeffe=georgia okeeffe|edvard munch=munch|raphael|botticelli|vermeer=johannes vermeer|renoir=pierre-auguste renoir|cezanne=paul cezanne|matisse=henri matisse|gauguin=paul gauguin|degas=edgar degas|manet=edouard manet|goya=francisco goya|rubens|caravaggio|klimt=gustav klimt|magritte=rene magritte|mondrian=piet mondrian|hokusai|turner=j.m.w. turner|constable|hopper=edward hopper|rothko=mark rothko",
    reef: "titian|tintoretto|el greco|velazquez=diego velazquez|bosch=hieronymus bosch|bruegel=pieter bruegel|durer=albrecht durer|holbein=hans holbein|poussin|watteau|fragonard|david=jacques-louis david|delacroix=eugene delacroix|courbet=gustave courbet|millet=jean-francois millet|seurat=georges seurat|signac|pissarro=camille pissarro|sisley=alfred sisley|toulouse-lautrec=henri de toulouse-lautrec|chagall=marc chagall|kandinsky=wassily kandinsky|miro=joan miro|braque=georges braque|schiele=egon schiele|modigliani=amedeo modigliani|lichtenstein=roy lichtenstein",
    trench: "artemisia gentileschi=gentileschi|hilma af klint|remedios varo|leonora carrington|paula rego|tamara de lempicka=lempicka|gwen john|berthe morisot=morisot|mary cassatt=cassatt|rosa bonheur|elisabeth vigee le brun=vigee le brun|sofonisba anguissola|angelica kauffman|jacob lawrence|kehinde wiley|yayoi kusama=kusama|zhang daqian|hiroshige|utamaro|sesshu",
    pearl: "bartolome esteban murillo=murillo|giovanni battista tiepolo=tiepolo|joaquin sorolla=sorolla|akseli gallen-kallela=gallen-kallela|ilya repin=repin|ivan aivazovsky=aivazovsky|vilhelm hammershoi=hammershoi|carl larsson",
  }),
  P("cheese", "Food", "Name a type of cheese", {
    bubble: "cheddar|mozzarella|swiss|parmesan|brie|american", clever: "gouda|feta|blue cheese|camembert",
    shoal: "provolone|gruyere|havarti|monterey jack=jack|colby|pepper jack|ricotta|cottage cheese|cream cheese|goat cheese=chevre|gorgonzola|roquefort|emmental=emmenthal|edam|manchego|halloumi|paneer|mascarpone|asiago|muenster|stilton|fontina|swiss cheese|pecorino|string cheese",
    reef: "jarlsberg|raclette|comte|burrata|cotija|queso fresco|limburger|taleggio|red leicester|double gloucester|wensleydale|cheshire|caerphilly|manouri|kefalotyri|gjetost|tilsit|emmentaler|reblochon|munster|epoisses|saint-nectaire|cantal|morbier|boursin|neufchatel|labneh|queso blanco|oaxaca cheese|requeson",
    trench: "mimolette|vacherin|brillat-savarin|ossau-iraty|abondance|beaufort|livarot|pont-l'eveque|tete de moine|appenzeller|sbrinz|bitto|castelmagno|piave|caciocavallo|scamorza|stracchino|robiola|crescenza|montasio|asiago pressato|idiazabal|mahon|tetilla|zamorano",
    pearl: "casu marzu|pule|stinking bishop|milbenkase|cashel blue|durrus|gubbeen|cabrales|valdeon|shropshire blue",
  }),
  P("pasta", "Food", "Name a shape or type of pasta", {
    bubble: "spaghetti|penne|macaroni|lasagna=lasagne|fettuccine", clever: "ravioli|tortellini",
    shoal: "linguine|rigatoni|fusilli|farfalle|bowtie pasta|orzo|ziti|angel hair=capellini|cannelloni|gnocchi|tagliatelle|pappardelle|rotini|shells=conchiglie|manicotti|vermicelli|ditalini|elbow macaroni",
    reef: "orecchiette|cavatappi|bucatini|campanelle|radiatori|gemelli|tortelloni|agnolotti|cappelletti|strozzapreti|trofie|garganelli|paccheri|casarecce|mafaldine|tripoline|anelli|stelline|fregola|cavatelli|pastina|calamarata|maltagliati|pici|spaetzle",
    trench: "malloreddus|culurgiones|corzetti|trenette|scialatielli|busiate|fileja|lumache|sagnarelli|passatelli|tajarin|testaroli|bigoli|maccheroni alla chitarra|spaghetti alla chitarra|mezzelune|casoncelli|pizzoccheri|lagane",
    pearl: "lorighittas|su filindeu|sorprese|croxetti|cjarsons|tortelli di zucca|mandilli de sea|anolini|bringoli|ciriole",
  }),
  P("board-game", "Games", "Name a board game", {
    bubble: "monopoly|chess|checkers=draughts|scrabble|clue|risk|battleship|candy land", clever: "catan=settlers of catan|go|backgammon|ticket to ride",
    shoal: "sorry|trouble|connect four|jenga|uno|mancala|othello|life=the game of life|operation|mouse trap|guess who|yahtzee|stratego|pictionary|trivial pursuit|cluedo|carcassonne|pandemic|dominion|azul|codenames|twister|chutes and ladders=snakes and ladders|parcheesi=ludo|boggle",
    reef: "wingspan|splendor|terraforming mars|agricola|puerto rico|power grid|twilight struggle|scythe|gloomhaven|root|everdell|7 wonders|small world|king of tokyo|dixit|sagrada|patchwork|hive|blokus|qwirkle|rummikub|cranium|taboo|apples to apples|sequence|payday|careers|masterpiece|stay alive|hungry hungry hippos|perfection",
    trench: "arkham horror|eldritch horror|dune imperium|brass birmingham=brass|spirit island|great western trail|race for the galaxy|food chain magnate|through the ages|twilight imperium|advanced squad leader|diplomacy|axis and allies|shogi|xiangqi|nine men's morris|hnefatafl|senet|royal game of ur=game of ur|pachisi|fox and geese|tafl|bagh-chal",
    pearl: "tak|santorini|onitama|cosmic encounter|rex|tzolkin|caylus|le havre",
  }),
  P("currency", "Geography", "Name a currency used somewhere in the world", {
    bubble: "dollar|euro|pound|yen|peso", clever: "bitcoin|rupee|franc",
    shoal: "yuan=renminbi|rouble=ruble|won|krona|krone|rand|real|lira|dirham|shekel|baht|zloty|forint|dinar|rial|ringgit|rupiah|dong|naira|cedi|shilling|kwacha|peseta",
    reef: "kuna|lev|leu|koruna|hryvnia|tenge|som|manat|lari|dram|tugrik|taka|kyat|riel|kip|ngultrum|afghani|rufiyaa|pula|metical|kwanza|birr|nakfa|dalasi|leone|ouguiya|ariary|loti|lilangeni|denar|lek|tala|vatu|kina|pa'anga=paanga|quetzal|lempira|cordoba|colon|balboa|boliviano|guarani|sol|gourde",
    trench: "bolivar|sucre|inti|austral|cruzado|escudo|drachma|mark|guilder|schilling|markka|punt|lats|litas|kroon|tolar|pataca|denarius|florin|ducat|groat|farthing|guinea|crown|thaler",
    pearl: "rai|cruzeiro|zaire|obol|stater|sestertius|aureus|noble|angel|moidore|pistole",
  }),
  P("dinosaur", "Nature", "Name a dinosaur", {
    bubble: "tyrannosaurus rex=t rex=t-rex=tyrannosaurus|triceratops|velociraptor|stegosaurus|brachiosaurus|diplodocus", clever: "spinosaurus|ankylosaurus|pteranodon|allosaurus",
    shoal: "apatosaurus|brontosaurus|iguanodon|parasaurolophus|pachycephalosaurus|compsognathus|gallimimus|dilophosaurus|megalosaurus|carnotaurus|giganotosaurus|archaeopteryx|oviraptor|deinonychus|utahraptor|baryonyx|therizinosaurus|protoceratops|styracosaurus|maiasaura|edmontosaurus|hadrosaurus|argentinosaurus|plateosaurus|coelophysis|troodon|microraptor|ceratosaurus|kentrosaurus|sauropelta",
    reef: "albertosaurus|gorgosaurus|daspletosaurus|carcharodontosaurus|acrocanthosaurus|suchomimus|irritator|ouranosaurus|amargasaurus|nigersaurus|camarasaurus|barosaurus|mamenchisaurus|shunosaurus|saltasaurus|titanosaurus|patagotitan|dreadnoughtus|centrosaurus|chasmosaurus|pentaceratops|torosaurus|anzu|citipati|ornithomimus|struthiomimus|deinocheirus|tarbosaurus|yutyrannus|dilong|sinosauropteryx|psittacosaurus",
    trench: "qianzhousaurus|zhuchengtyrannus|raptorex|xiongguanlong|guanlong|limusaurus|zuul|nasutoceratops|diabloceratops|regaliceratops|albertaceratops|kosmoceratops|vagaceratops|bambiraptor|saurornitholestes|buitreraptor|rahonavis|mahakala|austroraptor|tsaagan|linhevenator|shuvuuia|mononykus|albertonykus|haplocheirus|beipiaosaurus|alxasaurus|nothronychus|falcarius|erlikosaurus|segnosaurus",
    pearl: "kryptops|eocarcharia|lythronax|teratophoneus|bistahieversor|moros|suskityrannus|zhenyuanlong|tianyuraptor|changyuraptor|serikornis|epidexipteryx|yi qi|ambopteryx|scansoriopteryx|eoraptor|herrerasaurus|staurikosaurus|saturnalia|pampadromaeus",
  }),
  P("sea", "Geography", "Name a sea or ocean", {
    bubble: "pacific=pacific ocean|atlantic=atlantic ocean|indian ocean|arctic ocean|mediterranean=mediterranean sea", clever: "dead sea|red sea|caribbean=caribbean sea|black sea",
    shoal: "southern ocean=antarctic ocean|north sea|baltic sea|caspian sea|arabian sea|south china sea|sea of japan|bering sea|coral sea|tasman sea|adriatic sea|aegean sea|irish sea|norwegian sea|barents sea|yellow sea|java sea|sargasso sea|ionian sea",
    reef: "tyrrhenian sea|ligurian sea|alboran sea|white sea|kara sea|laptev sea|east siberian sea|chukchi sea|beaufort sea|labrador sea|greenland sea|celtic sea|bay of biscay|bay of bengal|andaman sea|timor sea|arafura sea|banda sea|celebes sea|sulu sea|philippine sea|east china sea|sea of okhotsk|gulf of mexico|hudson bay",
    trench: "weddell sea|ross sea|amundsen sea|bellingshausen sea|scotia sea|davis sea|lazarev sea|riiser-larsen sea|cosmonauts sea|somov sea|mawson sea|king haakon vii sea|d'urville sea|sea of azov|sea of marmara=marmara sea|sea of galilee|aral sea|sea of crete|thracian sea|myrtoan sea|cretan sea|levantine sea|libyan sea|balearic sea|sea of sardinia",
    pearl: "molucca sea|halmahera sea|seram sea|flores sea|bali sea|savu sea|inner sea=seto inland sea|sea of the hebrides|wadden sea|skagerrak|kattegat|gulf of bothnia|gulf of finland|gulf of riga|pechora sea|lincoln sea",
  }),
  P("composer", "Music", "Name a classical composer", {
    bubble: "mozart=wolfgang amadeus mozart|beethoven=ludwig van beethoven|bach=johann sebastian bach|chopin|tchaikovsky|vivaldi", clever: "debussy|handel|brahms|wagner",
    shoal: "haydn|schubert|liszt|mendelssohn|schumann|verdi|puccini|rossini|dvorak|grieg|rachmaninoff|stravinsky|ravel|bizet|strauss|mahler|bruckner|sibelius|copland|gershwin|holst|elgar|purcell|saint-saens|satie|prokofiev|shostakovich|paganini|monteverdi|bartok",
    reef: "faure|franck|berlioz|gounod|massenet|offenbach|donizetti|bellini|smetana|janacek|glinka|mussorgsky|rimsky-korsakov|borodin|balakirev|scriabin|glazunov|nielsen|grainger|vaughan williams|britten|walton|delius|tallis|byrd|dowland|palestrina|lully|rameau|couperin|scarlatti|corelli|albinoni|telemann|buxtehude|pachelbel|gluck|salieri",
    trench: "ligeti|penderecki|lutoslawski|gorecki|part=arvo part|messiaen|boulez|stockhausen|xenakis|varese|ives|cage|reich|glass|adams|barber|bernstein|ginastera|villa-lobos|piazzolla|chavez|revueltas|takemitsu|tan dun|ades|saariaho|kaija saariaho|dutilleux|honegger|poulenc|milhaud|koechlin|roussel|chausson|dukas",
    pearl: "hildegard of bingen=hildegard|machaut=guillaume de machaut|josquin des prez=josquin|ockeghem|dufay|perotin|leonin|gesualdo|de victoria|cabezon|sweelinck|schein|schutz|biber|muffat|zelenka|boccherini|clementi|dussek|hummel",
  }),
  P("bird", "Nature", "Name a species of bird", {
    bubble: "eagle|owl|penguin|parrot|robin|sparrow|duck|chicken|crow|pigeon", clever: "flamingo|peacock|kiwi|toucan|ostrich",
    shoal: "hawk|falcon|swan|goose|seagull=gull|hummingbird|woodpecker|cardinal|blue jay=jay|pelican|crane|heron|stork|vulture|condor|albatross|puffin|cockatoo|macaw|canary|finch|swallow|dove|turkey|pheasant|quail|raven|magpie|starling|nightingale|kingfisher|emu|cassowary|bluebird",
    reef: "kestrel|osprey|harrier|merlin|goshawk|buzzard|kite|ibis|spoonbill|egret|bittern|cormorant|gannet|booby|frigatebird|tern|skua|petrel|shearwater|fulmar|auk|guillemot|razorbill|oystercatcher|plover|sandpiper|curlew|godwit|avocet|lapwing|snipe|woodcock|nuthatch|treecreeper|wren|dunnock|chiffchaff|blackcap|whitethroat|warbler|stonechat|wheatear|redstart|bullfinch|chaffinch|goldfinch|siskin|crossbill|linnet|yellowhammer|bunting",
    trench: "hoatzin|shoebill|kakapo|takahe|quetzal|resplendent quetzal|lyrebird|bird of paradise|cock-of-the-rock|bowerbird|secretarybird|hornbill|oilbird|potoo|frogmouth|nightjar|whip-poor-will|tinamou|rhea|kagu|sunbittern|limpkin|jacana|screamer|trumpeter|seriema|bustard|sandgrouse|turaco|mousebird|trogon|motmot|jacamar|puffbird|barbet|honeyguide|todies|broadbill|pitta|manakin|cotinga",
    pearl: "spoon-billed sandpiper|rufous-vented chachalaca|bristle-thighed curlew|marvelous spatuletail|southern cassowary|great frigatebird|waved albatross|sword-billed hummingbird|giant ibis|bulwer's pheasant|kinabalu pitta|hooded pitohui|laysan albatross|inaccessible island rail|spix's macaw|great auk|dodo|moa",
  }),
];
