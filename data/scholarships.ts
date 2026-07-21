export interface Scholarship {
  id: string;
  name: string;
  provider: string;
  amount: number | null;
  amountLabel: string;
  deadline: string | null;
  deadlineLabel: string;
  url: string;
  description: string;
  scope: "city" | "county" | "state" | "regional" | "national";
  eligibleStates?: string[];
  eligibleGpaMin?: number;
  eligibleGrades: string[];
  eligibleCitizenship?: ("us_citizen" | "permanent_resident" | "daca")[];
  eligibleHeritage?: string[];
  eligibleMajors?: string[];
  eligibleInterests?: string[];
  eligibleFirstGen?: true;
  eligibleFinancialNeed?: true;
  eligibleExtracurriculars?: string[];
  quirkyFact?: string;
  estimatedApplicants: number;
  tags: string[];
}

const ALL_HS = ["9", "10", "11", "12"];
const HS_UPPERCLASS = ["11", "12"];
const HS_SENIOR = ["12"];
const ALL_COLLEGE = ["college-1", "college-2", "college-3", "college-4"];
const ALL_UNDERGRAD = [...HS_SENIOR, ...ALL_COLLEGE];
const ENTERING_COLLEGE = ["12", "college-1"];

export const scholarships: Scholarship[] = [
  // ─── HERITAGE: Italian ────────────────────────────────────────────────────

  {
    id: "niaf-general",
    name: "NIAF Scholarship Program",
    provider: "National Italian American Foundation",
    amount: 2500,
    amountLabel: "$2,500–$12,000",
    deadline: "2025-03-01",
    deadlineLabel: "March 1 annually",
    url: "https://niaf.org/scholarships/",
    description:
      "Open to students of Italian heritage or students studying Italian language, culture, or studies. Multiple award tiers based on merit, leadership, and financial need.",
    scope: "national",
    eligibleGpaMin: 3.5,
    eligibleGrades: ALL_UNDERGRAD,
    eligibleCitizenship: ["us_citizen", "permanent_resident"],
    eligibleHeritage: ["italian"],
    estimatedApplicants: 800,
    tags: ["heritage", "italian", "merit"],
  },
  {
    id: "osia-lodge",
    name: "Order Sons and Daughters of Italy — Local Lodge Award",
    provider: "Order Sons and Daughters of Italy in America",
    amount: 1000,
    amountLabel: "$500–$3,000 (varies by lodge)",
    deadline: null,
    deadlineLabel: "Varies by local lodge (typically February–April)",
    url: "https://osia.org/scholarships/",
    description:
      "Each local OSIA lodge awards scholarships independently to students of Italian heritage in their area. The local awards have far fewer applicants than the national program — often 5–15 per lodge. Find your nearest lodge at osia.org.",
    scope: "city",
    eligibleGrades: ALL_UNDERGRAD,
    eligibleHeritage: ["italian"],
    quirkyFact:
      "Local lodge awards often receive fewer than 15 applications — same money, tiny applicant pool.",
    estimatedApplicants: 12,
    tags: ["heritage", "italian", "local", "lodge"],
  },

  // ─── HERITAGE: Greek ─────────────────────────────────────────────────────

  {
    id: "ahepa-scholarship",
    name: "AHEPA Scholarship Program",
    provider: "American Hellenic Educational Progressive Association",
    amount: 2000,
    amountLabel: "$500–$2,000",
    deadline: "2025-03-31",
    deadlineLabel: "March 31 annually",
    url: "https://www.ahepa.org/scholarships/",
    description:
      "Scholarships for students of Greek descent or members/children of members of AHEPA and affiliated organizations. Local chapter awards are available in addition to national awards.",
    scope: "national",
    eligibleGrades: ALL_UNDERGRAD,
    eligibleHeritage: ["greek"],
    estimatedApplicants: 300,
    tags: ["heritage", "greek", "merit"],
  },
  {
    id: "ahepa-chapter",
    name: "AHEPA Local Chapter Scholarship",
    provider: "AHEPA Local Chapter",
    amount: 500,
    amountLabel: "$500–$1,500 (varies by chapter)",
    deadline: null,
    deadlineLabel: "Typically February–April (check local chapter)",
    url: "https://www.ahepa.org/chapters/",
    description:
      "Individual AHEPA chapters across the U.S. run their own scholarship programs. Local chapter awards often receive only 5–20 applications from eligible community members.",
    scope: "city",
    eligibleGrades: ALL_UNDERGRAD,
    eligibleHeritage: ["greek"],
    quirkyFact: "Most local AHEPA chapters award scholarships with fewer than 20 applicants.",
    estimatedApplicants: 15,
    tags: ["heritage", "greek", "local"],
  },

  // ─── HERITAGE: Japanese ──────────────────────────────────────────────────

  {
    id: "jacl-national",
    name: "JACL National Scholarship Program",
    provider: "Japanese American Citizens League",
    amount: 3000,
    amountLabel: "$1,000–$5,000",
    deadline: "2025-04-01",
    deadlineLabel: "April 1 annually",
    url: "https://jacl.org/scholarships/",
    description:
      "Scholarships for students of Japanese American heritage or students involved in the Japanese American community. Multiple categories including performing arts, law, and general academic.",
    scope: "national",
    eligibleGpaMin: 2.7,
    eligibleGrades: ALL_UNDERGRAD,
    eligibleCitizenship: ["us_citizen", "permanent_resident"],
    eligibleHeritage: ["japanese"],
    estimatedApplicants: 400,
    tags: ["heritage", "japanese", "merit"],
  },

  // ─── HERITAGE: Korean ────────────────────────────────────────────────────

  {
    id: "kasf-regional",
    name: "Korean American Scholarship Foundation Regional Award",
    provider: "Korean American Scholarship Foundation",
    amount: 2000,
    amountLabel: "$1,000–$2,000",
    deadline: "2025-05-30",
    deadlineLabel: "Late May annually (varies by region)",
    url: "https://kasf.org/",
    description:
      "KASF awards scholarships through 8 regional chapters across the U.S. Each region has its own applicant pool and committee. Regional competition is significantly lower than national scholarships.",
    scope: "regional",
    eligibleGpaMin: 3.0,
    eligibleGrades: ALL_COLLEGE,
    eligibleCitizenship: ["us_citizen", "permanent_resident"],
    eligibleHeritage: ["korean"],
    estimatedApplicants: 180,
    tags: ["heritage", "korean", "regional"],
  },

  // ─── HERITAGE: Hispanic / Latino ─────────────────────────────────────────

  {
    id: "hsf-general",
    name: "Hispanic Scholarship Fund General Award",
    provider: "Hispanic Scholarship Fund",
    amount: 5000,
    amountLabel: "$500–$5,000",
    deadline: "2025-02-15",
    deadlineLabel: "February 15 annually",
    url: "https://www.hsf.net/scholarship",
    description:
      "The HSF scholarship supports Hispanic and Latino students pursuing higher education. Merit and need are both considered. GPA minimum 3.0.",
    scope: "national",
    eligibleGpaMin: 3.0,
    eligibleGrades: ALL_COLLEGE,
    eligibleCitizenship: ["us_citizen", "permanent_resident", "daca"],
    eligibleHeritage: ["hispanic", "latino"],
    estimatedApplicants: 12000,
    tags: ["heritage", "hispanic", "latino", "need-based"],
  },
  {
    id: "lulac-local",
    name: "LULAC National Scholarship Fund — Local Council Award",
    provider: "League of United Latin American Citizens",
    amount: 500,
    amountLabel: "$250–$1,000 (varies by council)",
    deadline: null,
    deadlineLabel: "March–April (varies by local council)",
    url: "https://lnesc.org/",
    description:
      "LULAC's 1,000+ local councils across the U.S. each run their own scholarship programs. Local council competitions are much smaller than the national award — many receive fewer than 20 applications.",
    scope: "city",
    eligibleHeritage: ["hispanic", "latino"],
    eligibleGrades: ALL_UNDERGRAD,
    quirkyFact: "Many LULAC councils award scholarships to 2–5 students from a pool of under 20 applicants.",
    estimatedApplicants: 18,
    tags: ["heritage", "hispanic", "latino", "local"],
  },

  // ─── HERITAGE: Polish ────────────────────────────────────────────────────

  {
    id: "paf-scholarship",
    name: "Polish American Foundation Scholarship",
    provider: "Polish American Foundation",
    amount: 1500,
    amountLabel: "$1,000–$2,000",
    deadline: "2025-04-15",
    deadlineLabel: "April 15 annually",
    url: "https://polish-american-foundation.org/",
    description:
      "For students of Polish descent pursuing higher education. Merit and community involvement considered.",
    scope: "national",
    eligibleGrades: ALL_UNDERGRAD,
    eligibleHeritage: ["polish"],
    estimatedApplicants: 200,
    tags: ["heritage", "polish", "merit"],
  },
  {
    id: "polish-local-club",
    name: "Local Polish American Club Scholarship",
    provider: "Polish American Club (varies by city)",
    amount: 500,
    amountLabel: "$250–$1,000",
    deadline: null,
    deadlineLabel: "Spring (search '[your city] Polish American Club scholarship')",
    url: "https://google.com/search?q=polish+american+club+scholarship+near+me",
    description:
      "Hundreds of Polish American clubs across the U.S. run annual scholarship programs for students of Polish descent. These local awards often receive fewer than 10 applications. Search for your city's Polish American club to find local deadlines.",
    scope: "city",
    eligibleHeritage: ["polish"],
    eligibleGrades: ALL_UNDERGRAD,
    quirkyFact: "Many local Polish clubs award to every eligible student who applies — some years the number of applicants equals the number of awards.",
    estimatedApplicants: 8,
    tags: ["heritage", "polish", "local", "club"],
  },

  // ─── HERITAGE: Armenian ──────────────────────────────────────────────────

  {
    id: "agbu-scholarship",
    name: "AGBU Scholarship Program",
    provider: "Armenian General Benevolent Union",
    amount: 5000,
    amountLabel: "$1,000–$7,500",
    deadline: "2025-04-30",
    deadlineLabel: "April 30 annually",
    url: "https://agbu.org/youth-programs/scholarship-programs/",
    description:
      "For students of Armenian descent. Multiple programs including the Graduate Loan Scholarship and the U.S. Armenian Scholarship for undergraduates.",
    scope: "national",
    eligibleGpaMin: 3.0,
    eligibleGrades: ALL_UNDERGRAD,
    eligibleCitizenship: ["us_citizen", "permanent_resident"],
    eligibleHeritage: ["armenian"],
    estimatedApplicants: 250,
    tags: ["heritage", "armenian", "merit"],
  },

  // ─── HERITAGE: Scandinavian ───────────────────────────────────────────────

  {
    id: "sons-of-norway",
    name: "Sons of Norway Foundation Scholarship",
    provider: "Sons of Norway",
    amount: 3000,
    amountLabel: "$1,500–$3,000",
    deadline: "2025-03-01",
    deadlineLabel: "March 1 annually",
    url: "https://www.sonsofnorway.com/scholarships",
    description:
      "Scholarships for members or children of members of Sons of Norway lodges, or for students pursuing Norwegian studies. Local lodge awards available.",
    scope: "national",
    eligibleGrades: ALL_UNDERGRAD,
    eligibleHeritage: ["norwegian", "scandinavian"],
    estimatedApplicants: 150,
    tags: ["heritage", "norwegian", "scandinavian", "lodge"],
  },
  {
    id: "scandinavian-foundation",
    name: "American-Scandinavian Foundation Scholarship",
    provider: "American-Scandinavian Foundation",
    amount: 5000,
    amountLabel: "$3,000–$23,000",
    deadline: "2025-11-01",
    deadlineLabel: "November 1 annually",
    url: "https://www.amscan.org/fellowships-and-grants/fellowships-and-grants-for-americans/",
    description:
      "Fellowships and grants for U.S. students to study or conduct research in Scandinavia. Also funds Scandinavian students in the U.S.",
    scope: "national",
    eligibleGrades: ["college-3", "college-4", "graduate"],
    estimatedApplicants: 200,
    tags: ["heritage", "scandinavian", "study-abroad", "research"],
  },

  // ─── HERITAGE: Irish ─────────────────────────────────────────────────────

  {
    id: "irish-fellowship-chicago",
    name: "Irish Fellowship Club of Chicago Scholarship",
    provider: "Irish Fellowship Club of Chicago",
    amount: 2500,
    amountLabel: "$2,500",
    deadline: "2025-02-28",
    deadlineLabel: "Late February annually",
    url: "https://irishfellowshipclub.org/",
    description:
      "For students of Irish descent attending Illinois colleges. Local award with limited applicants compared to national Irish heritage scholarships.",
    scope: "state",
    eligibleStates: ["IL"],
    eligibleGrades: ALL_UNDERGRAD,
    eligibleHeritage: ["irish"],
    estimatedApplicants: 45,
    tags: ["heritage", "irish", "state", "illinois"],
  },

  // ─── HERITAGE: Native American ────────────────────────────────────────────

  {
    id: "american-indian-college-fund",
    name: "American Indian College Fund Scholarship",
    provider: "American Indian College Fund",
    amount: 2500,
    amountLabel: "$1,000–$5,000",
    deadline: "2025-05-31",
    deadlineLabel: "May 31 annually",
    url: "https://collegefund.org/",
    description:
      "For American Indian and Alaska Native students attending tribal colleges, universities, or mainstream colleges. One of the largest Native American scholarship funds.",
    scope: "national",
    eligibleGrades: ALL_UNDERGRAD,
    eligibleCitizenship: ["us_citizen", "permanent_resident"],
    eligibleHeritage: ["native-american", "alaska-native"],
    estimatedApplicants: 1800,
    tags: ["heritage", "native-american", "tribal"],
  },
  {
    id: "tribal-scholarship",
    name: "Tribal Nation Scholarship (Locally Administered)",
    provider: "Your Tribal Nation",
    amount: 3000,
    amountLabel: "Varies by tribe (often $1,000–$5,000/year)",
    deadline: null,
    deadlineLabel: "Contact your tribe's education department",
    url: "https://www.bia.gov/scholarships",
    description:
      "Most federally recognized tribes administer their own scholarship programs for enrolled members. These are often the best-funded and easiest to win because eligibility is limited to enrolled members of one specific tribe. Contact your tribe's education department directly.",
    scope: "city",
    eligibleGrades: ALL_UNDERGRAD,
    eligibleHeritage: ["native-american", "alaska-native"],
    quirkyFact:
      "Tribal scholarships are typically available only to enrolled members of one specific tribe — the pool is extremely small.",
    estimatedApplicants: 20,
    tags: ["heritage", "native-american", "tribal", "local"],
  },

  // ─── HERITAGE: African American ──────────────────────────────────────────

  {
    id: "uncf-general",
    name: "UNCF Scholarship Program",
    provider: "United Negro College Fund",
    amount: 5000,
    amountLabel: "$2,000–$10,000",
    deadline: "2025-03-01",
    deadlineLabel: "Varies by specific award (check uncf.org)",
    url: "https://uncf.org/scholarships",
    description:
      "UNCF manages over 400 scholarship programs for Black American students. Eligibility, amounts, and deadlines vary by specific award — some have very specific criteria with small applicant pools.",
    scope: "national",
    eligibleGpaMin: 2.5,
    eligibleGrades: ALL_COLLEGE,
    eligibleHeritage: ["african-american", "black"],
    eligibleFinancialNeed: true,
    estimatedApplicants: 3500,
    tags: ["heritage", "african-american", "need-based"],
  },
  {
    id: "ron-brown-scholar",
    name: "Ron Brown Scholar Program",
    provider: "Ron Brown Scholar Program",
    amount: 40000,
    amountLabel: "$40,000 ($10,000/year for 4 years)",
    deadline: "2025-01-09",
    deadlineLabel: "Early January annually",
    url: "https://www.ronbrown.org/",
    description:
      "For African American high school seniors who demonstrate exceptional academic achievement, leadership, service, and financial need. One of the most prestigious scholarships in the country.",
    scope: "national",
    eligibleGpaMin: 3.5,
    eligibleGrades: HS_SENIOR,
    eligibleCitizenship: ["us_citizen", "permanent_resident"],
    eligibleHeritage: ["african-american", "black"],
    eligibleFinancialNeed: true,
    estimatedApplicants: 8000,
    tags: ["heritage", "african-american", "leadership", "need-based", "prestigious"],
  },

  // ─── HERITAGE: Filipino ──────────────────────────────────────────────────

  {
    id: "fahsi-scholarship",
    name: "Filipino American Human Services Scholarship",
    provider: "Filipino American Human Services, Inc.",
    amount: 1000,
    amountLabel: "$1,000",
    deadline: "2025-05-01",
    deadlineLabel: "May 1 annually",
    url: "https://fahsi.org/scholarship/",
    description:
      "For Filipino American students in New York. Community-based award with limited regional competition.",
    scope: "state",
    eligibleStates: ["NY"],
    eligibleGrades: ALL_UNDERGRAD,
    eligibleHeritage: ["filipino"],
    estimatedApplicants: 80,
    tags: ["heritage", "filipino", "state", "new-york"],
  },

  // ─── HERITAGE: Chinese American ──────────────────────────────────────────

  {
    id: "caca-scholarship",
    name: "Chinese American Citizens Alliance Foundation Scholarship",
    provider: "Chinese American Citizens Alliance",
    amount: 1000,
    amountLabel: "$500–$2,000",
    deadline: "2025-04-01",
    deadlineLabel: "April 1 annually",
    url: "https://cacasf.org/scholarship/",
    description:
      "For students of Chinese descent at local CACA lodge chapters. Local lodge awards receive far fewer applications than national programs.",
    scope: "city",
    eligibleGrades: ALL_UNDERGRAD,
    eligibleHeritage: ["chinese"],
    estimatedApplicants: 25,
    tags: ["heritage", "chinese", "local", "lodge"],
  },

  // ─── HERITAGE: Vietnamese ────────────────────────────────────────────────

  {
    id: "vsa-scholarship",
    name: "Vietnamese Scholarship Association Award",
    provider: "Vietnamese Student Association (varies by region)",
    amount: 500,
    amountLabel: "$500–$1,500",
    deadline: null,
    deadlineLabel: "Varies by local chapter (check your region's VSA)",
    url: "https://google.com/search?q=Vietnamese+scholarship+association+scholarship",
    description:
      "Many regional Vietnamese Student Associations and Vietnamese American community organizations offer local scholarships. These are especially available in California, Texas, and Virginia.",
    scope: "city",
    eligibleGrades: ALL_UNDERGRAD,
    eligibleHeritage: ["vietnamese"],
    estimatedApplicants: 30,
    tags: ["heritage", "vietnamese", "local"],
  },

  // ─── NICHE: Tall People ──────────────────────────────────────────────────

  {
    id: "tall-clubs-international",
    name: "Tall Clubs International Scholarship",
    provider: "Tall Clubs International",
    amount: 1000,
    amountLabel: "$1,000",
    deadline: "2025-03-01",
    deadlineLabel: "March 1 annually",
    url: "https://www.tallclubs.org/scholarship/",
    description:
      "For students entering their first year of college who meet height requirements: 6'2\" or taller for men, 5'10\" or taller for women. Open to members and children of members of Tall Clubs.",
    scope: "national",
    eligibleGrades: ENTERING_COLLEGE,
    quirkyFact: "You must be at least 6'2\" (men) or 5'10\" (women) to qualify.",
    estimatedApplicants: 100,
    tags: ["quirky", "height", "niche"],
  },

  // ─── NICHE: Golf Caddies ─────────────────────────────────────────────────

  {
    id: "evans-scholars",
    name: "Evans Scholars Foundation",
    provider: "Western Golf Association",
    amount: null,
    amountLabel: "Full tuition + housing",
    deadline: "2025-09-30",
    deadlineLabel: "September 30 annually",
    url: "https://wgaesf.com/",
    description:
      "Full scholarship covering tuition and housing at one of 18 partner universities for golf caddies with financial need and strong academics. One of the most valuable niche scholarships in the country.",
    scope: "national",
    eligibleGpaMin: 3.2,
    eligibleGrades: HS_SENIOR,
    eligibleCitizenship: ["us_citizen"],
    eligibleFinancialNeed: true,
    eligibleExtracurriculars: ["golf-caddie"],
    quirkyFact: "Must be an active golf caddie to qualify.",
    estimatedApplicants: 2500,
    tags: ["niche", "golf", "caddie", "full-scholarship"],
  },

  // ─── NICHE: Ham Radio ────────────────────────────────────────────────────

  {
    id: "arrl-foundation",
    name: "ARRL Foundation Scholarship Program",
    provider: "American Radio Relay League Foundation",
    amount: 5000,
    amountLabel: "$500–$5,000",
    deadline: "2025-01-31",
    deadlineLabel: "January 31 annually",
    url: "https://www.arrl.org/scholarship-program",
    description:
      "Over 100 individual scholarship programs for amateur (ham) radio license holders. Many scholarships are highly specific by state, major, or license class — drastically reducing competition.",
    scope: "national",
    eligibleGrades: ALL_UNDERGRAD,
    eligibleExtracurriculars: ["ham-radio"],
    quirkyFact: "Must hold an FCC amateur radio license. Some individual awards are limited to one state.",
    estimatedApplicants: 180,
    tags: ["niche", "ham-radio", "stem", "technology"],
  },

  // ─── NICHE: Duct Tape ────────────────────────────────────────────────────

  {
    id: "duck-brand-prom",
    name: "Duck Brand Stuck at Prom Scholarship",
    provider: "ShurTech Brands (Duck Brand)",
    amount: 10000,
    amountLabel: "$10,000 (couple) + $5,000 runner-up",
    deadline: "2025-06-08",
    deadlineLabel: "First Monday in June",
    url: "https://www.duckbrand.com/stuck-at-prom",
    description:
      "Go to prom wearing outfits made substantially or entirely from Duck Brand duct tape. Submit photos for a public vote. Best outfits win. One of the most fun scholarships in existence.",
    scope: "national",
    eligibleGrades: HS_UPPERCLASS,
    quirkyFact: "Your entire prom outfit must be made from Duck Brand duct tape.",
    estimatedApplicants: 1200,
    tags: ["quirky", "creative", "prom", "contest"],
  },

  // ─── NICHE: Vegetarian ───────────────────────────────────────────────────

  {
    id: "vrg-scholarship",
    name: "Vegetarian Resource Group Scholarship",
    provider: "Vegetarian Resource Group",
    amount: 10000,
    amountLabel: "$5,000–$10,000",
    deadline: "2025-02-20",
    deadlineLabel: "February 20 annually",
    url: "https://www.vrg.org/student/scholar.htm",
    description:
      "For graduating high school seniors who have promoted vegetarianism or veganism in their school or community. Essay required on vegetarian/vegan advocacy.",
    scope: "national",
    eligibleGrades: HS_SENIOR,
    eligibleInterests: ["environment", "health", "vegetarian-vegan"],
    quirkyFact: "Must have actively promoted vegetarianism or veganism in their community.",
    estimatedApplicants: 350,
    tags: ["niche", "vegetarian", "vegan", "advocacy"],
  },

  // ─── NICHE: Fire Sprinklers ──────────────────────────────────────────────

  {
    id: "afsa-scholarship",
    name: "Fire Sprinkler Essay Scholarship",
    provider: "American Fire Sprinkler Association",
    amount: 2000,
    amountLabel: "$1,000–$2,000",
    deadline: "2025-09-06",
    deadlineLabel: "Early September annually",
    url: "https://www.afsa.org/scholarship",
    description:
      "High school seniors and college freshmen read a short informational essay about fire sprinklers, then answer 10 questions. Open to ALL students — no field of study requirement.",
    scope: "national",
    eligibleGrades: ENTERING_COLLEGE,
    quirkyFact:
      "Winners are drawn at random from correct entries. Read the essay, answer questions, enter the drawing.",
    estimatedApplicants: 900,
    tags: ["niche", "essay", "drawing", "fire-safety"],
  },

  // ─── NICHE: FFA / Agriculture ────────────────────────────────────────────

  {
    id: "ffa-collegiate",
    name: "National FFA Organization Scholarship Program",
    provider: "National FFA Organization",
    amount: 2500,
    amountLabel: "$1,000–$25,000",
    deadline: "2025-02-01",
    deadlineLabel: "February 1 annually",
    url: "https://www.ffa.org/participate/grants-and-scholarships/scholarships/",
    description:
      "Over 1,700 scholarships sponsored by businesses and foundations through the FFA. Many are highly specific by state, major, or type of agricultural operation — dramatically reducing the applicant pool.",
    scope: "national",
    eligibleGrades: HS_SENIOR,
    eligibleExtracurriculars: ["ffa"],
    estimatedApplicants: 150,
    tags: ["agriculture", "ffa", "niche", "major-specific"],
  },

  // ─── NICHE: 4-H ──────────────────────────────────────────────────────────

  {
    id: "4h-state-scholarship",
    name: "4-H State Council Scholarship",
    provider: "Your State 4-H Council",
    amount: 1500,
    amountLabel: "$500–$2,000",
    deadline: null,
    deadlineLabel: "Typically February–April (check your state 4-H office)",
    url: "https://4-h.org/",
    description:
      "Every state's 4-H Council awards scholarships to active 4-H members pursuing higher education. State awards have far fewer applicants than national competitions — some state programs see under 100 applicants.",
    scope: "state",
    eligibleGrades: HS_SENIOR,
    eligibleExtracurriculars: ["4h"],
    estimatedApplicants: 85,
    tags: ["4h", "agriculture", "youth", "state"],
  },
  {
    id: "4h-county-scholarship",
    name: "4-H County Extension Office Scholarship",
    provider: "County Extension Office (USDA)",
    amount: 500,
    amountLabel: "$250–$1,000",
    deadline: null,
    deadlineLabel: "Typically January–March (contact your county extension office)",
    url: "https://4-h.org/",
    description:
      "Many county 4-H extension offices award local scholarships independently. With only county-level competition, these awards often go to 2–5 students from a pool of under 25 applicants.",
    scope: "county",
    eligibleGrades: HS_SENIOR,
    eligibleExtracurriculars: ["4h"],
    quirkyFact:
      "Contact your county's Cooperative Extension Service — many give awards to every student who applies.",
    estimatedApplicants: 18,
    tags: ["4h", "agriculture", "local", "county"],
  },

  // ─── NICHE: Eagle Scout ──────────────────────────────────────────────────

  {
    id: "bsa-eagle-national",
    name: "Boy Scouts of America National Eagle Scout Scholarship",
    provider: "National Eagle Scout Association",
    amount: 50000,
    amountLabel: "$2,500–$50,000",
    deadline: "2025-10-31",
    deadlineLabel: "October 31 annually",
    url: "https://nesa.org/scholarships/",
    description:
      "Multiple scholarships exclusively for Eagle Scouts. The NESA Merit Scholarship ($25K), Academic ($50K), and others are open only to Eagle Scouts — a pool of about 65,000 Eagle Scouts per year in the U.S.",
    scope: "national",
    eligibleGrades: HS_SENIOR,
    eligibleExtracurriculars: ["scouting"],
    estimatedApplicants: 4000,
    tags: ["scouting", "eagle-scout", "leadership", "merit"],
  },
  {
    id: "local-scout-scholarship",
    name: "Local BSA Council Eagle Scout Scholarship",
    provider: "BSA Local Council",
    amount: 1000,
    amountLabel: "$500–$2,500",
    deadline: null,
    deadlineLabel: "Varies by council (typically spring)",
    url: "https://www.scouting.org/awards/scholarships/",
    description:
      "Individual BSA councils award their own scholarships to Eagle Scouts in their geographic area. Many councils have very few applicants since eligibility is limited to Eagle Scouts in one district or council.",
    scope: "city",
    eligibleGrades: HS_SENIOR,
    eligibleExtracurriculars: ["scouting"],
    quirkyFact: "Local council competitions are sometimes limited to one district — some receive under 20 applications.",
    estimatedApplicants: 20,
    tags: ["scouting", "eagle-scout", "local", "council"],
  },

  // ─── NICHE: VFW (Local Chapter) ──────────────────────────────────────────

  {
    id: "vfw-voice-of-democracy",
    name: "VFW Voice of Democracy Audio-Essay Scholarship — Local Post",
    provider: "Veterans of Foreign Wars — Local Post",
    amount: 30000,
    amountLabel: "$1,000–$30,000 (varies by level)",
    deadline: "2025-10-31",
    deadlineLabel: "October 31 annually (local post level)",
    url: "https://www.vfw.org/community/youth-and-education/youth-scholarships",
    description:
      "Students record a short patriotic audio essay. Competition starts at the local VFW Post level (often under 10 entrants per post), advances to state, then national. Winning at local level earns $1,000+. Very few people know about the post-level competition.",
    scope: "city",
    eligibleGrades: ALL_HS,
    quirkyFact:
      "Local VFW Post competitions often receive fewer than 5 entries — the competition is remarkably small at this level.",
    estimatedApplicants: 5,
    tags: ["veterans", "essay", "audio", "local", "patriotic"],
  },

  // ─── NICHE: American Legion ──────────────────────────────────────────────

  {
    id: "american-legion-oratorical",
    name: "American Legion National High School Oratorical Contest",
    provider: "American Legion",
    amount: 18000,
    amountLabel: "$1,500–$18,000",
    deadline: "2025-01-15",
    deadlineLabel: "Varies by local post (typically January)",
    url: "https://www.legion.org/scholarships/oratorical",
    description:
      "Students deliver speeches on the U.S. Constitution. Starts at local post level with very few competitors, advancing to state and national. Local post winner earns $1,500. The most common post competitions receive under 5 entries.",
    scope: "city",
    eligibleGrades: ALL_HS,
    quirkyFact: "Local American Legion post contests often have fewer than 5 participants.",
    estimatedApplicants: 4,
    tags: ["veterans", "speech", "constitution", "local"],
  },

  // ─── NICHE: Ham Radio / STEM ─────────────────────────────────────────────

  {
    id: "arrl-state-specific",
    name: "ARRL State-Specific Ham Radio Scholarship",
    provider: "ARRL Foundation",
    amount: 2000,
    amountLabel: "$500–$2,500",
    deadline: "2025-01-31",
    deadlineLabel: "January 31 annually",
    url: "https://www.arrl.org/scholarship-program",
    description:
      "The ARRL Foundation offers many scholarships restricted to specific states (e.g., Massachusetts, North Carolina, Iowa). These state-specific awards within the ham radio community see very few applicants.",
    scope: "state",
    eligibleExtracurriculars: ["ham-radio"],
    eligibleGrades: ALL_UNDERGRAD,
    estimatedApplicants: 25,
    tags: ["niche", "ham-radio", "stem", "state-specific"],
  },

  // ─── NICHE: Bowling ──────────────────────────────────────────────────────

  {
    id: "bcf-scholarship",
    name: "Bowling Scholarship Foundation Award",
    provider: "United States Bowling Congress",
    amount: 5000,
    amountLabel: "$500–$5,000",
    deadline: "2025-12-01",
    deadlineLabel: "December 1 annually",
    url: "https://www.bowl.com/scholarships/",
    description:
      "Multiple scholarship programs for USBC-registered bowlers in good standing. The Billy Welu Scholarship, Chuck Hall Star of Tomorrow, and others are available. Competitive, but the bowling community is niche.",
    scope: "national",
    eligibleGrades: ALL_UNDERGRAD,
    eligibleExtracurriculars: ["bowling"],
    estimatedApplicants: 350,
    tags: ["niche", "bowling", "sports"],
  },

  // ─── MAJOR-SPECIFIC: Nursing ─────────────────────────────────────────────

  {
    id: "anf-scholarship",
    name: "American Nurses Foundation Scholarship",
    provider: "American Nurses Foundation",
    amount: 2500,
    amountLabel: "$1,500–$10,000",
    deadline: "2025-06-01",
    deadlineLabel: "June 1 annually",
    url: "https://www.nursingworld.org/foundation/programs/scholarships/",
    description:
      "For nursing students at all levels. Multiple specific programs with different eligibility requirements — some limited to specific states or populations, reducing competition significantly.",
    scope: "national",
    eligibleGrades: ALL_COLLEGE,
    eligibleMajors: ["nursing"],
    estimatedApplicants: 800,
    tags: ["nursing", "healthcare", "major-specific"],
  },
  {
    id: "state-nursing-shortage",
    name: "State Nursing Shortage Scholarship (varies by state)",
    provider: "State Health Department or Nursing Association",
    amount: 5000,
    amountLabel: "$2,500–$7,500",
    deadline: null,
    deadlineLabel: "Varies by state (check your state nursing association)",
    url: "https://google.com/search?q=nursing+shortage+scholarship+[your+state]",
    description:
      "Many states with nursing shortages offer scholarships in exchange for a commitment to practice in the state after graduation. These are often underutilized because students don't know about them.",
    scope: "state",
    eligibleGrades: ALL_COLLEGE,
    eligibleMajors: ["nursing"],
    estimatedApplicants: 120,
    tags: ["nursing", "healthcare", "state", "service-commitment"],
  },

  // ─── MAJOR-SPECIFIC: Engineering ─────────────────────────────────────────

  {
    id: "swe-scholarship",
    name: "Society of Women Engineers Scholarship",
    provider: "Society of Women Engineers",
    amount: 16000,
    amountLabel: "$1,000–$16,000",
    deadline: "2025-02-15",
    deadlineLabel: "February 15 annually",
    url: "https://scholarships.swe.org/",
    description:
      "For women and non-binary students studying engineering or engineering technology. Over 200 individual awards with varying eligibility, many restricted by company sponsor, state, or major.",
    scope: "national",
    eligibleGrades: ALL_UNDERGRAD,
    eligibleMajors: ["engineering", "computer-science"],
    estimatedApplicants: 7000,
    tags: ["engineering", "women-in-stem", "major-specific"],
  },
  {
    id: "asce-scholarship",
    name: "ASCE Foundation Scholarship",
    provider: "American Society of Civil Engineers",
    amount: 3000,
    amountLabel: "$1,000–$3,000",
    deadline: "2025-02-10",
    deadlineLabel: "February 10 annually",
    url: "https://www.asce.org/career-growth/scholarships/",
    description:
      "For civil engineering students. ASCE has both national and regional section scholarships. Regional awards see far fewer applicants than the national competition.",
    scope: "national",
    eligibleGrades: ALL_COLLEGE,
    eligibleMajors: ["civil-engineering", "engineering"],
    estimatedApplicants: 500,
    tags: ["engineering", "civil-engineering", "major-specific"],
  },

  // ─── MAJOR-SPECIFIC: Education ───────────────────────────────────────────

  {
    id: "teach-grant",
    name: "TEACH Grant",
    provider: "U.S. Department of Education",
    amount: 4000,
    amountLabel: "Up to $4,000/year",
    deadline: null,
    deadlineLabel: "Rolling (apply through your college's financial aid office)",
    url: "https://studentaid.gov/understand-aid/types/grants/teach",
    description:
      "Grant (not a loan) for students pursuing teaching in high-need subject areas at low-income schools. Converts to a loan only if you don't fulfill the 4-year service commitment. Significantly underutilized — many eligible students don't apply.",
    scope: "national",
    eligibleGrades: ALL_COLLEGE,
    eligibleMajors: ["education", "teaching"],
    estimatedApplicants: 2500,
    tags: ["education", "teaching", "grant", "federal", "service-commitment"],
  },

  // ─── MAJOR-SPECIFIC: Agriculture ─────────────────────────────────────────

  {
    id: "usda-1890-scholarship",
    name: "USDA/1890 National Scholars Program",
    provider: "USDA National Institute of Food and Agriculture",
    amount: null,
    amountLabel: "Full tuition, fees, books, room & board, summer internship salary",
    deadline: "2025-01-15",
    deadlineLabel: "January 15 annually",
    url: "https://www.nifa.usda.gov/grants/programs/scholarships-fellowships/1890-scholars",
    description:
      "Extraordinarily generous scholarship for agriculture, food science, or related fields at 1890 historically Black Land-Grant institutions. Covers essentially all college costs plus paid USDA internships.",
    scope: "national",
    eligibleGpaMin: 3.0,
    eligibleGrades: HS_SENIOR,
    eligibleCitizenship: ["us_citizen"],
    eligibleMajors: ["agriculture", "food-science", "natural-resources"],
    estimatedApplicants: 600,
    tags: ["agriculture", "food-science", "federal", "full-scholarship"],
  },

  // ─── MAJOR-SPECIFIC: Social Work ─────────────────────────────────────────

  {
    id: "nasw-scholarship",
    name: "NASW Foundation Scholarships",
    provider: "National Association of Social Workers Foundation",
    amount: 2500,
    amountLabel: "$500–$4,000",
    deadline: "2025-03-31",
    deadlineLabel: "March 31 annually",
    url: "https://www.naswfoundation.org/Our-Work/Scholarships-and-Awards",
    description:
      "Multiple scholarship programs for social work students. Some awards are limited to specific states or populations, keeping competition manageable.",
    scope: "national",
    eligibleGrades: ALL_COLLEGE,
    eligibleMajors: ["social-work"],
    estimatedApplicants: 400,
    tags: ["social-work", "human-services", "major-specific"],
  },

  // ─── MAJOR-SPECIFIC: Architecture ────────────────────────────────────────

  {
    id: "aia-scholarship",
    name: "AIA/AAF Scholarship for Professional Degree Students",
    provider: "American Institute of Architects / American Architecture Foundation",
    amount: 4000,
    amountLabel: "$2,500–$4,000",
    deadline: "2025-02-01",
    deadlineLabel: "February 1 annually",
    url: "https://www.architecturefoundation.org/programs/scholarships/",
    description:
      "For architecture students in accredited professional degree programs demonstrating financial need. Multiple award tiers.",
    scope: "national",
    eligibleGrades: ["college-3", "college-4", "graduate"],
    eligibleMajors: ["architecture"],
    eligibleFinancialNeed: true,
    estimatedApplicants: 600,
    tags: ["architecture", "design", "major-specific", "need-based"],
  },

  // ─── MAJOR-SPECIFIC: Culinary / Hospitality ──────────────────────────────

  {
    id: "iacf-scholarship",
    name: "International Association of Culinary Professionals Foundation",
    provider: "IACP Foundation",
    amount: 5000,
    amountLabel: "$1,500–$5,000",
    deadline: "2025-12-01",
    deadlineLabel: "December 1 annually",
    url: "https://www.iacp.com/scholarships",
    description:
      "For students enrolled in or planning to enroll in culinary arts or food-related programs. A community of professional chefs and educators.",
    scope: "national",
    eligibleGrades: ALL_UNDERGRAD,
    eligibleMajors: ["culinary-arts", "hospitality"],
    estimatedApplicants: 300,
    tags: ["culinary-arts", "food", "hospitality", "major-specific"],
  },

  // ─── MAJOR-SPECIFIC: Journalism ──────────────────────────────────────────

  {
    id: "spj-scholarship",
    name: "SPJ Foundation Scholarship",
    provider: "Society of Professional Journalists Foundation",
    amount: 3000,
    amountLabel: "$1,000–$3,000",
    deadline: "2025-04-01",
    deadlineLabel: "April 1 annually",
    url: "https://www.spj.org/scholarships.asp",
    description:
      "For journalism students with demonstrated financial need and commitment to the profession. National and regional chapter awards available.",
    scope: "national",
    eligibleGrades: ALL_COLLEGE,
    eligibleMajors: ["journalism", "communications"],
    eligibleFinancialNeed: true,
    estimatedApplicants: 700,
    tags: ["journalism", "writing", "media", "major-specific"],
  },

  // ─── MAJOR-SPECIFIC: Computer Science / Tech ─────────────────────────────

  {
    id: "google-lime-scholarship",
    name: "Google Lime Scholarship for Students with Disabilities",
    provider: "Google & Lime Connect",
    amount: 10000,
    amountLabel: "$10,000",
    deadline: "2025-12-01",
    deadlineLabel: "December 1 annually",
    url: "https://www.limeconnect.com/opportunities/page/google-lime-scholarship",
    description:
      "For students with disabilities pursuing computer science or a related field. Very specific eligibility criteria keeps the pool small despite the large award amount.",
    scope: "national",
    eligibleGrades: ALL_UNDERGRAD,
    eligibleMajors: ["computer-science", "engineering"],
    estimatedApplicants: 500,
    tags: ["computer-science", "disability", "technology", "google"],
  },

  // ─── MAJOR-SPECIFIC: Math ────────────────────────────────────────────────

  {
    id: "actuarial-foundation",
    name: "Actuarial Foundation Scholarship Program",
    provider: "Actuarial Foundation",
    amount: 4000,
    amountLabel: "$2,000–$4,000",
    deadline: "2025-06-01",
    deadlineLabel: "June 1 annually",
    url: "https://www.actuarialfoundation.org/scholarships/",
    description:
      "For students pursuing a career in actuarial science. Must be planning to take actuarial exams. A highly specific major keeps competition low.",
    scope: "national",
    eligibleGrades: ALL_COLLEGE,
    eligibleMajors: ["actuarial-science", "mathematics", "statistics"],
    estimatedApplicants: 200,
    tags: ["actuarial-science", "mathematics", "finance", "major-specific"],
  },

  // ─── FIRST-GEN / NEED ────────────────────────────────────────────────────

  {
    id: "questbridge",
    name: "QuestBridge National College Match",
    provider: "QuestBridge",
    amount: null,
    amountLabel: "Full scholarship at 50+ partner colleges",
    deadline: "2025-09-26",
    deadlineLabel: "Late September annually",
    url: "https://www.questbridge.org/",
    description:
      "Connects high-achieving, low-income students with full scholarships to top colleges. One of the most valuable need-based scholarships. Partners include Yale, MIT, Stanford, and 47+ others.",
    scope: "national",
    eligibleGpaMin: 3.5,
    eligibleGrades: HS_SENIOR,
    eligibleCitizenship: ["us_citizen", "permanent_resident", "daca"],
    eligibleFinancialNeed: true,
    eligibleFirstGen: true,
    estimatedApplicants: 18000,
    tags: ["need-based", "first-gen", "prestigious", "full-scholarship"],
  },
  {
    id: "gates-scholarship",
    name: "Gates Scholarship",
    provider: "Bill & Melinda Gates Foundation",
    amount: null,
    amountLabel: "Full cost of attendance (remaining unmet need)",
    deadline: "2025-09-15",
    deadlineLabel: "Mid-September annually",
    url: "https://www.thegatesscholarship.org/",
    description:
      "For underrepresented minority students with exceptional academic record, leadership, and financial need. Covers all unmet financial need for 4 years. Highly competitive but also highly specific eligibility.",
    scope: "national",
    eligibleGpaMin: 3.3,
    eligibleGrades: HS_SENIOR,
    eligibleCitizenship: ["us_citizen", "permanent_resident"],
    eligibleHeritage: ["african-american", "black", "hispanic", "latino", "native-american", "asian-pacific-islander"],
    eligibleFinancialNeed: true,
    estimatedApplicants: 40000,
    tags: ["need-based", "first-gen", "prestigious", "full-scholarship", "urm"],
  },
  {
    id: "posse-foundation",
    name: "Posse Foundation Scholarship",
    provider: "Posse Foundation",
    amount: null,
    amountLabel: "Full tuition at partner university",
    deadline: "2025-10-31",
    deadlineLabel: "Nomination-based (ask your school counselor)",
    url: "https://www.possefoundation.org/",
    description:
      "Students are nominated by their high school and go through a multi-step selection process. Covers full tuition at one of 60+ Posse partner universities. Leadership, teamwork, and academic potential are key criteria.",
    scope: "national",
    eligibleGrades: HS_SENIOR,
    estimatedApplicants: 12000,
    tags: ["need-based", "leadership", "diverse", "nomination", "full-scholarship"],
  },
  {
    id: "dell-scholars",
    name: "Dell Scholars Program",
    provider: "Michael & Susan Dell Foundation",
    amount: 20000,
    amountLabel: "$20,000 + laptop + resources",
    deadline: "2025-12-01",
    deadlineLabel: "December 1 annually",
    url: "https://www.dellscholars.org/",
    description:
      "For students who have overcome significant obstacles to reach college. Must be a college-ready, first-gen student with financial need. Award includes ongoing support throughout college.",
    scope: "national",
    eligibleGrades: HS_SENIOR,
    eligibleCitizenship: ["us_citizen", "permanent_resident"],
    eligibleFinancialNeed: true,
    eligibleFirstGen: true,
    estimatedApplicants: 15000,
    tags: ["need-based", "first-gen", "resilience"],
  },
  {
    id: "elks-mvs",
    name: "Elks National Foundation Most Valuable Student Scholarship",
    provider: "Elks National Foundation",
    amount: 50000,
    amountLabel: "$4,000–$50,000 (4-year)",
    deadline: "2025-11-05",
    deadlineLabel: "November 5 annually",
    url: "https://www.elks.org/scholars/scholarships/mvs.cfm",
    description:
      "Open to ALL U.S. citizens who are graduating high school seniors — no Elks affiliation required. Competition starts at local lodge level (often under 20 applicants per lodge). Local lodge winner goes to state.",
    scope: "city",
    eligibleGrades: HS_SENIOR,
    eligibleCitizenship: ["us_citizen"],
    quirkyFact:
      "Local Elks Lodge competitions often have fewer than 15 applicants — winning locally is achievable.",
    estimatedApplicants: 15,
    tags: ["leadership", "merit", "local", "lodge", "open-to-all"],
  },
  {
    id: "coca-cola-scholars",
    name: "Coca-Cola Scholars Program",
    provider: "Coca-Cola Scholars Foundation",
    amount: 20000,
    amountLabel: "$20,000",
    deadline: "2025-10-31",
    deadlineLabel: "October 31 annually",
    url: "https://www.coca-colascholars.org/",
    description:
      "For high school seniors with strong academics and leadership. Merit-based. Highly competitive nationally, but the application process surfaces students for other Coca-Cola Foundation awards as well.",
    scope: "national",
    eligibleGrades: HS_SENIOR,
    eligibleCitizenship: ["us_citizen", "permanent_resident"],
    estimatedApplicants: 100000,
    tags: ["leadership", "merit", "prestigious"],
  },
  {
    id: "horatio-alger",
    name: "Horatio Alger Scholarship",
    provider: "Horatio Alger Association",
    amount: 25000,
    amountLabel: "$7,000–$25,000",
    deadline: "2025-10-25",
    deadlineLabel: "October 25 annually",
    url: "https://scholars.horatioalger.org/",
    description:
      "For students who have overcome adversity to achieve academic success. Financial need required. Strong emphasis on perseverance and overcoming obstacles.",
    scope: "national",
    eligibleGrades: HS_SENIOR,
    eligibleCitizenship: ["us_citizen"],
    eligibleFinancialNeed: true,
    estimatedApplicants: 25000,
    tags: ["need-based", "adversity", "resilience", "first-gen"],
  },

  // ─── STATE-SPECIFIC ───────────────────────────────────────────────────────

  {
    id: "boettcher-foundation",
    name: "Boettcher Foundation Scholarship",
    provider: "Boettcher Foundation",
    amount: null,
    amountLabel: "Full tuition, fees, books + stipend for 4 years",
    deadline: "2025-11-01",
    deadlineLabel: "November 1 annually",
    url: "https://boettcherfoundation.org/scholarships/",
    description:
      "One of Colorado's most prestigious scholarships. Full 4-year scholarship for Colorado high school seniors. Only 42 awards given per year — highly competitive within Colorado but limited to CO residents.",
    scope: "state",
    eligibleStates: ["CO"],
    eligibleGpaMin: 3.75,
    eligibleGrades: HS_SENIOR,
    eligibleCitizenship: ["us_citizen"],
    estimatedApplicants: 4000,
    tags: ["state", "colorado", "prestigious", "full-scholarship"],
  },
  {
    id: "kalamazoo-promise",
    name: "Kalamazoo Promise",
    provider: "Kalamazoo Community Foundation",
    amount: null,
    amountLabel: "Up to 100% of tuition at Michigan public colleges",
    deadline: null,
    deadlineLabel: "Automatic for eligible students",
    url: "https://kalamazoopromise.com/",
    description:
      "Free college tuition (up to 100%) for graduates of Kalamazoo Public Schools who have attended from K-12. If you've attended KPS, you likely qualify — many eligible students never apply.",
    scope: "city",
    eligibleStates: ["MI"],
    eligibleGrades: HS_SENIOR,
    quirkyFact:
      "Only for Kalamazoo Public Schools graduates — but up to 100% tuition covered for 10 years.",
    estimatedApplicants: 500,
    tags: ["state", "michigan", "kalamazoo", "city", "automatic"],
  },
  {
    id: "wv-promise",
    name: "West Virginia PROMISE Scholarship",
    provider: "West Virginia Higher Education Policy Commission",
    amount: 5000,
    amountLabel: "Up to $5,000/year",
    deadline: "2025-03-01",
    deadlineLabel: "March 1 annually",
    url: "https://secure.cfwv.com/Financial_Aid_Planning/Scholarships/PROMISE_Scholarship/PROMISE_Scholarship.aspx",
    description:
      "For West Virginia high school graduates meeting academic standards. Must maintain GPA requirements to renew. Limited to WV residents attending WV colleges.",
    scope: "state",
    eligibleStates: ["WV"],
    eligibleGpaMin: 3.0,
    eligibleGrades: HS_SENIOR,
    eligibleCitizenship: ["us_citizen"],
    estimatedApplicants: 3500,
    tags: ["state", "west-virginia", "merit"],
  },
  {
    id: "north-dakota-merit",
    name: "North Dakota Academic Scholarship",
    provider: "North Dakota University System",
    amount: 6000,
    amountLabel: "Up to $6,000 total",
    deadline: null,
    deadlineLabel: "Applied through ND high school (automatic for qualifying seniors)",
    url: "https://www.ndus.edu/resources/financial-aid/scholarships/",
    description:
      "Automatic merit scholarship for North Dakota high school graduates who complete the Scholars course requirements and meet GPA and ACT/SAT thresholds. Many eligible students don't realize they qualify.",
    scope: "state",
    eligibleStates: ["ND"],
    eligibleGrades: HS_SENIOR,
    estimatedApplicants: 1200,
    tags: ["state", "north-dakota", "merit", "automatic"],
  },
  {
    id: "georgia-hope",
    name: "Georgia HOPE Scholarship",
    provider: "Georgia Student Finance Commission",
    amount: 10000,
    amountLabel: "Up to $10,258/year (full tuition at GA public colleges)",
    deadline: null,
    deadlineLabel: "Automatic for qualifying Georgia residents",
    url: "https://gsfc.georgia.gov/hope",
    description:
      "Merit-based scholarship for Georgia residents attending Georgia public colleges. 3.0 high school GPA required. One of the largest state scholarship programs in the country.",
    scope: "state",
    eligibleStates: ["GA"],
    eligibleGpaMin: 3.0,
    eligibleGrades: HS_SENIOR,
    estimatedApplicants: 50000,
    tags: ["state", "georgia", "merit"],
  },
  {
    id: "ok-promise",
    name: "Oklahoma's Promise (OHLAP)",
    provider: "Oklahoma State Regents for Higher Education",
    amount: null,
    amountLabel: "Full tuition at Oklahoma colleges",
    deadline: null,
    deadlineLabel: "Must enroll in 8th or 9th grade — not a traditional application",
    url: "https://www.okhighered.org/okpromise/",
    description:
      "Must be enrolled by 8th or 9th grade. Students meeting income and academic requirements receive free tuition at Oklahoma public colleges. Income limit: family income under $55,000. Often missed because enrollment happens years before college.",
    scope: "state",
    eligibleStates: ["OK"],
    eligibleGpaMin: 2.5,
    eligibleGrades: ["9", "10"],
    eligibleFinancialNeed: true,
    quirkyFact: "Must enroll while in 8th or 9th grade — parents often miss this window.",
    estimatedApplicants: 8000,
    tags: ["state", "oklahoma", "need-based", "free-tuition"],
  },
  {
    id: "new-mexico-lottery",
    name: "New Mexico Lottery Scholarship",
    provider: "New Mexico Lottery / NM Higher Education Department",
    amount: null,
    amountLabel: "Covers approximately 40-50% of tuition at NM public colleges",
    deadline: null,
    deadlineLabel: "Automatic for qualifying NM residents",
    url: "https://hed.nm.gov/students-parents/college-financing/scholarships/new-mexico-lottery-scholarship",
    description:
      "For New Mexico high school graduates or GED earners. Attend any NM public college as a full-time student. One of the easiest state scholarships to qualify for — just graduate from NM high school.",
    scope: "state",
    eligibleStates: ["NM"],
    eligibleGrades: HS_SENIOR,
    estimatedApplicants: 4500,
    tags: ["state", "new-mexico", "merit", "automatic"],
  },
  {
    id: "florida-bright-futures",
    name: "Florida Bright Futures Scholarship",
    provider: "Florida Department of Education",
    amount: null,
    amountLabel: "75-100% of tuition at Florida public colleges",
    deadline: null,
    deadlineLabel: "Apply during senior year of high school",
    url: "https://www.floridastudentfinancialaidsg.org/SAPHome/SAPHome",
    description:
      "Merit scholarship for Florida high school graduates based on GPA and SAT/ACT. The Florida Academic Scholars award covers 100% of tuition; the Medallion Scholars award covers 75%.",
    scope: "state",
    eligibleStates: ["FL"],
    eligibleGpaMin: 3.5,
    eligibleGrades: HS_SENIOR,
    eligibleCitizenship: ["us_citizen", "permanent_resident"],
    estimatedApplicants: 40000,
    tags: ["state", "florida", "merit", "automatic"],
  },

  // ─── COMMUNITY FOUNDATIONS ───────────────────────────────────────────────

  {
    id: "community-foundation-local",
    name: "Your Local Community Foundation Scholarship",
    provider: "Community Foundation (varies by county/city)",
    amount: 2000,
    amountLabel: "$500–$5,000 (varies by fund)",
    deadline: null,
    deadlineLabel: "Typically February–April (check your county's community foundation)",
    url: "https://www.cof.org/community-foundation-locator",
    description:
      "There are 1,700+ community foundations across the U.S., most administering multiple scholarship funds for local students. These scholarships are restricted to one county or region and many receive fewer than 20 applications. Use the Council on Foundations locator to find yours.",
    scope: "county",
    eligibleGrades: ALL_UNDERGRAD,
    quirkyFact:
      "Most community foundation scholarships see under 30 applicants because eligibility is limited to one county. Some awards go unclaimed every year.",
    estimatedApplicants: 22,
    tags: ["local", "community-foundation", "county", "hidden-gem"],
  },
  {
    id: "rotary-local-scholarship",
    name: "Rotary Club Local Scholarship",
    provider: "Local Rotary Club",
    amount: 2000,
    amountLabel: "$500–$3,000 (varies by club)",
    deadline: null,
    deadlineLabel: "Typically February–April (search '[your city] Rotary Club scholarship')",
    url: "https://www.rotary.org/en/get-involved/scholarships",
    description:
      "There are 35,000+ Rotary clubs worldwide, and most run local scholarship programs for students in their community. Awards are limited to the club's immediate service area, keeping competition very low — typically 5–30 applicants per club.",
    scope: "city",
    eligibleGrades: ALL_UNDERGRAD,
    quirkyFact:
      "Many Rotary clubs award $1,000–$2,000 scholarships to every student who submits a complete application.",
    estimatedApplicants: 15,
    tags: ["local", "rotary", "service", "community", "hidden-gem"],
  },
  {
    id: "kiwanis-local",
    name: "Kiwanis Club Local Scholarship",
    provider: "Local Kiwanis Club",
    amount: 1000,
    amountLabel: "$500–$2,000",
    deadline: null,
    deadlineLabel: "Varies by club (typically March–May)",
    url: "https://www.kiwanis.org/",
    description:
      "Kiwanis clubs across the U.S. award local scholarships. With eligibility limited to students in one city or area, competition is extremely low — some clubs award to everyone who applies.",
    scope: "city",
    eligibleGrades: ALL_UNDERGRAD,
    estimatedApplicants: 12,
    tags: ["local", "kiwanis", "service", "community", "hidden-gem"],
  },
  {
    id: "lions-club-local",
    name: "Lions Club District Scholarship",
    provider: "Local Lions Club",
    amount: 1000,
    amountLabel: "$500–$2,000",
    deadline: null,
    deadlineLabel: "Varies by club (typically spring)",
    url: "https://www.lionsclubs.org/en/resources-for-members/resource-center/scholarships",
    description:
      "Local Lions Clubs award scholarships to students in their service area. Limited local eligibility means a small applicant pool. Search for your local Lions Club to get specific deadlines and requirements.",
    scope: "city",
    eligibleGrades: ALL_UNDERGRAD,
    estimatedApplicants: 14,
    tags: ["local", "lions-club", "service", "community"],
  },
  {
    id: "credit-union-scholarship",
    name: "Local Credit Union Scholarship",
    provider: "Your Local Credit Union",
    amount: 1000,
    amountLabel: "$500–$3,000",
    deadline: null,
    deadlineLabel: "Varies (check your credit union's website each spring)",
    url: "https://google.com/search?q=credit+union+scholarship+near+me",
    description:
      "Most credit unions offer annual scholarships to members and their children. If your family banks at a credit union, you may already be eligible. These scholarships receive very few applications because members don't know about them — sometimes as few as 5 applicants.",
    scope: "city",
    eligibleGrades: ALL_UNDERGRAD,
    quirkyFact:
      "If your family is already a credit union member, you may qualify with almost no competition.",
    estimatedApplicants: 8,
    tags: ["local", "credit-union", "member", "hidden-gem"],
  },

  // ─── MILITARY / SERVICE ──────────────────────────────────────────────────

  {
    id: "usaa-scholarship",
    name: "USAA Scholarship",
    provider: "USAA Educational Foundation",
    amount: 3000,
    amountLabel: "$1,000–$3,000",
    deadline: "2025-03-01",
    deadlineLabel: "March 1 annually",
    url: "https://www.usaa.com/inet/wc/advice-member-perks-scholarship",
    description:
      "For USAA members and their dependents. USAA serves military families, so eligibility is limited to current or former military and their families.",
    scope: "national",
    eligibleGrades: ALL_UNDERGRAD,
    eligibleInterests: ["military-family"],
    estimatedApplicants: 5000,
    tags: ["military", "service", "usaa"],
  },
  {
    id: "daughters-american-revolution",
    name: "DAR Scholarship Program",
    provider: "Daughters of the American Revolution",
    amount: 5000,
    amountLabel: "$1,000–$5,000",
    deadline: "2025-12-01",
    deadlineLabel: "December 1 annually for some awards; varies by state chapter",
    url: "https://www.dar.org/national-society/scholarships",
    description:
      "Multiple scholarship programs for descendants of Revolutionary War patriots, as well as open-topic awards. State and local chapter competitions receive far fewer applications than national.",
    scope: "state",
    eligibleGrades: ALL_UNDERGRAD,
    estimatedApplicants: 350,
    tags: ["heritage", "american-history", "dar", "patriotic"],
  },

  // ─── EMPLOYER / FAMILY CONNECTION ───────────────────────────────────────

  {
    id: "parent-employer-scholarship",
    name: "Parent's Employer Scholarship (varies by company)",
    provider: "Various corporations",
    amount: 3000,
    amountLabel: "$1,000–$10,000",
    deadline: null,
    deadlineLabel: "Varies (check HR or union — typically January–March)",
    url: "https://google.com/search?q=[employer+name]+scholarship+for+dependents",
    description:
      "Many large employers offer scholarships for the children of employees. These are massively underutilized — many employees never ask HR. Common providers: Walmart, Target, UPS, McDonald's, Costco, Lowe's, FedEx, and nearly every major union.",
    scope: "national",
    eligibleGrades: ALL_UNDERGRAD,
    quirkyFact:
      "Ask your parent to check with HR or their union rep. Many of these go unclaimed every year because employees don't know they exist.",
    estimatedApplicants: 50,
    tags: ["employer", "parent-connection", "hidden-gem"],
  },
  {
    id: "walmart-associates",
    name: "Walmart Associates in Critical Need Trust (ACNT)",
    provider: "Walmart Foundation",
    amount: 6000,
    amountLabel: "Up to $6,000/year (renewable)",
    deadline: "2025-04-01",
    deadlineLabel: "April 1 annually",
    url: "https://give.walmartfoundation.org/",
    description:
      "For children of Walmart or Sam's Club employees with financial need. Given the large number of Walmart employees, competition is higher than other employer scholarships — but still manageable.",
    scope: "national",
    eligibleGrades: ENTERING_COLLEGE,
    eligibleFinancialNeed: true,
    estimatedApplicants: 8000,
    tags: ["employer", "walmart", "need-based"],
  },

  // ─── FAITH-BASED ─────────────────────────────────────────────────────────

  {
    id: "knights-of-columbus",
    name: "Knights of Columbus Scholarship Program",
    provider: "Knights of Columbus",
    amount: 1500,
    amountLabel: "$1,500/year (renewable)",
    deadline: null,
    deadlineLabel: "Varies by council (typically February–April)",
    url: "https://www.kofc.org/en/members/scholarships.html",
    description:
      "For children of Knights of Columbus members. Local council scholarships are limited to the council's geographic area. With limited eligibility (must have a KofC member parent), competition is very small.",
    scope: "city",
    eligibleGrades: ENTERING_COLLEGE,
    eligibleHeritage: ["catholic"],
    quirkyFact: "Must have a parent who is a current Knight of Columbus member.",
    estimatedApplicants: 10,
    tags: ["faith-based", "catholic", "local", "parent-connection"],
  },

  // ─── STEM / RESEARCH ─────────────────────────────────────────────────────

  {
    id: "siemens-competition",
    name: "Regeneron Science Talent Search",
    provider: "Regeneron / Society for Science",
    amount: 250000,
    amountLabel: "$25,000–$250,000",
    deadline: "2025-11-12",
    deadlineLabel: "Mid-November annually",
    url: "https://www.societyforscience.org/regeneron-sts/",
    description:
      "The most prestigious pre-college science competition in the U.S. Submit original research in any science area. Very competitive nationally, but local and state science fairs that feed into this have much smaller pools.",
    scope: "national",
    eligibleGrades: HS_SENIOR,
    eligibleInterests: ["stem", "research"],
    estimatedApplicants: 2000,
    tags: ["stem", "research", "science-fair", "prestigious"],
  },
  {
    id: "nmsf",
    name: "National Merit Scholarship",
    provider: "National Merit Scholarship Corporation",
    amount: 2500,
    amountLabel: "$2,500 (National Merit) + sponsored awards",
    deadline: null,
    deadlineLabel: "Take the PSAT junior year",
    url: "https://www.nationalmerit.org/",
    description:
      "Based on PSAT scores. Each state has its own cutoff. Many corporations and colleges sponsor additional National Merit scholarships — some for students from specific states or fields, which are far less competitive.",
    scope: "national",
    eligibleGrades: HS_UPPERCLASS,
    estimatedApplicants: 50000,
    tags: ["merit", "psat", "academic", "prestigious"],
  },

  // ─── GENERAL / ESSAY ─────────────────────────────────────────────────────

  {
    id: "ayn-rand-essay",
    name: "Ayn Rand Institute Essay Contests",
    provider: "Ayn Rand Institute",
    amount: 10000,
    amountLabel: "$30–$10,000",
    deadline: "2025-04-25",
    deadlineLabel: "Varies by essay (check ari.ayn-rand.org)",
    url: "https://www.aynrand.org/students/essay-contests",
    description:
      "Essay contests on Ayn Rand novels (The Fountainhead, Atlas Shrugged, Anthem, We the Living). The Anthem contest for 8th–10th graders has many small prizes. Unpopular subject matter among many students — competition is lower than you'd expect.",
    scope: "national",
    eligibleGrades: ALL_HS,
    estimatedApplicants: 8000,
    tags: ["essay", "philosophy", "writing", "contest"],
  },
  {
    id: "prudential-spirit-of-community",
    name: "Prudential Spirit of Community Award",
    provider: "Prudential Financial / NASSP",
    amount: 5000,
    amountLabel: "$1,000–$5,000",
    deadline: "2025-11-08",
    deadlineLabel: "November 8 annually",
    url: "https://spirit.prudential.com/",
    description:
      "For middle and high school students who have made meaningful volunteer contributions to their communities. State-level competitions before national. Community service focus.",
    scope: "state",
    eligibleGrades: ALL_HS,
    eligibleInterests: ["community-service"],
    estimatedApplicants: 600,
    tags: ["community-service", "volunteering", "leadership"],
  },
  {
    id: "stonier-scholarship",
    name: "American Bankers Association Stonier Scholarship",
    provider: "ABA Foundation",
    amount: 3000,
    amountLabel: "$1,000–$3,000",
    deadline: "2025-04-01",
    deadlineLabel: "April 1 annually",
    url: "https://www.aba.com/training-events/schools-conferences/stonier-graduate-school/scholarships",
    description:
      "For students with a family connection to banking, interested in finance or business. Niche enough that competition is manageable.",
    scope: "national",
    eligibleGrades: ALL_COLLEGE,
    eligibleMajors: ["finance", "business", "economics"],
    estimatedApplicants: 250,
    tags: ["finance", "banking", "business", "major-specific"],
  },

  // ─── DISABILITIES ────────────────────────────────────────────────────────

  {
    id: "nfb-scholarship",
    name: "NFB Scholarship Program",
    provider: "National Federation of the Blind",
    amount: 12000,
    amountLabel: "$3,000–$12,000",
    deadline: "2025-03-31",
    deadlineLabel: "March 31 annually",
    url: "https://nfb.org/programs-services/scholarships",
    description:
      "For legally blind students pursuing undergraduate or graduate degrees. Very specific eligibility ensures a small but qualified applicant pool.",
    scope: "national",
    eligibleGrades: ALL_UNDERGRAD,
    eligibleCitizenship: ["us_citizen", "permanent_resident"],
    estimatedApplicants: 400,
    tags: ["disability", "blind", "accessibility"],
  },
  {
    id: "google-lime-cs",
    name: "Google Lime Scholarship",
    provider: "Google & Lime Connect",
    amount: 10000,
    amountLabel: "$10,000",
    deadline: "2025-12-01",
    deadlineLabel: "December 1 annually",
    url: "https://www.limeconnect.com/opportunities/page/google-lime-scholarship",
    description:
      "For students with disabilities pursuing computer science or related degrees. Extremely specific criteria (disability + CS major) creates a small applicant pool relative to the award size.",
    scope: "national",
    eligibleGrades: ALL_UNDERGRAD,
    eligibleMajors: ["computer-science", "engineering"],
    estimatedApplicants: 500,
    tags: ["disability", "computer-science", "technology"],
  },

  // ─── LGBTQ+ ──────────────────────────────────────────────────────────────

  {
    id: "pflag-scholarship",
    name: "PFLAG National Scholarship Program",
    provider: "PFLAG National",
    amount: 3000,
    amountLabel: "$1,000–$3,000",
    deadline: "2025-04-15",
    deadlineLabel: "April 15 annually",
    url: "https://pflag.org/scholarship/",
    description:
      "For LGBTQ+ students and straight allies. Open to high school seniors and college students. Emphasizes community advocacy and authenticity.",
    scope: "national",
    eligibleGrades: ALL_UNDERGRAD,
    eligibleInterests: ["lgbtq", "advocacy"],
    estimatedApplicants: 1200,
    tags: ["lgbtq", "identity", "advocacy", "community"],
  },

  // ─── ENVIRONMENT ─────────────────────────────────────────────────────────

  {
    id: "garden-club-scholarship",
    name: "National Garden Clubs Scholarship",
    provider: "National Garden Clubs, Inc.",
    amount: 3500,
    amountLabel: "$3,500",
    deadline: "2025-01-10",
    deadlineLabel: "January 10 annually",
    url: "https://gardenclub.org/ngc-scholarships",
    description:
      "For students studying horticulture, landscape design, environmental studies, or related fields. State affiliates also have their own scholarships with local competition.",
    scope: "national",
    eligibleGpaMin: 3.25,
    eligibleGrades: ALL_COLLEGE,
    eligibleMajors: ["horticulture", "landscape-design", "environmental-science", "botany"],
    estimatedApplicants: 350,
    tags: ["environment", "horticulture", "plants", "major-specific"],
  },

  // ─── PERFORMING ARTS ─────────────────────────────────────────────────────

  {
    id: "arts-scholarships-usa",
    name: "Scholarship America Arts Scholarship",
    provider: "Scholarship America / YoungArts",
    amount: 10000,
    amountLabel: "$100–$10,000",
    deadline: "2025-10-13",
    deadlineLabel: "October 13 annually",
    url: "https://www.youngarts.org/",
    description:
      "For students in visual arts, design, film, photography, music, theater, voice, dance, writing, and spoken word. YoungArts winners qualify for the U.S. Presidential Scholars in the Arts.",
    scope: "national",
    eligibleGrades: HS_UPPERCLASS,
    eligibleInterests: ["arts", "music", "theater", "dance", "film"],
    estimatedApplicants: 12000,
    tags: ["arts", "music", "theater", "dance", "creative"],
  },
];

export function getScholarshipById(id: string): Scholarship | undefined {
  return scholarships.find((s) => s.id === id);
}
