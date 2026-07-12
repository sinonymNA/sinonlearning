"use client";

import type { StoryBeat, QuickCheck } from "@/components/life-budget/lessons/NarrativeLesson";
import PEExplorerHook from "@/components/stock-market/hooks/PEExplorerHook";
import InflationEroderHook from "@/components/stock-market/hooks/InflationEroderHook";
import CorrelationDemoHook from "@/components/stock-market/hooks/CorrelationDemoHook";
import BiasSandboxHook from "@/components/stock-market/hooks/BiasSandboxHook";

// ── Color accents per unit ─────────────────────────────────────────────────────

export const UNIT_ACCENTS: Record<number, string> = {
  1: "#2563eb",
  2: "#7c3aed",
  3: "#0891b2",
  4: "#16a34a",
  5: "#ea580c",
  6: "#dc2626",
  7: "#854d0e",
  8: "#6d28d9",
  9: "#0f172a",
  10: "#0369a1",
  11: "#475569",
};

// ── Types ──────────────────────────────────────────────────────────────────────

export interface StockHookData {
  title: string;
  setup: React.ReactNode;
  question: string;
  reveal: {
    stat: string;
    statSub: string;
    explanation: string;
  };
  sandbox?: React.ReactNode;
}

export interface StockMission {
  title: string;
  description: string;
  steps: string[];
  tickerSuggestion?: string;
}

export interface StockUnit {
  num: number;
  slug: string;
  title: string;
  accent: string;
  previewHook: string;
  concepts: string[];
  hook: StockHookData;
  lesson: {
    title: string;
    character: string;
    beats: StoryBeat[];
    ctaLabel: string;
    ctaSubtitle: string;
  };
  mission: StockMission;
  unitQuiz: QuickCheck[];
}

// ── Helper components for beats ────────────────────────────────────────────────

function B({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: "#0f172a" }}>{children}</strong>;
}
function I({ children }: { children: React.ReactNode }) {
  return <em style={{ fontStyle: "italic", color: "#0f172a" }}>{children}</em>;
}

// ── Unit 1: What Is a Stock? ───────────────────────────────────────────────────

const U1_BEATS: StoryBeat[] = [
  {
    narrative: (
      <>
        <p>
          In July 1994, Jeff Bezos quit his job at a hedge fund, drove across the country in a
          car his wife drove while he wrote a business plan in the passenger seat, and started
          selling books out of a garage in Bellevue, Washington. He called it Amazon after the
          largest river in the world because he wanted to build the largest store.
        </p>
        <p>
          Three years later, in May 1997, Amazon went public on the NASDAQ. The stock priced at{" "}
          <B>$18 per share</B>. On the first day of trading, it hit <B>$30</B>. Wall Street was
          skeptical — Amazon had never turned a profit. Analysts called it "Amazon.toast."
          If you bought 100 shares on IPO day, you spent $1,800.
        </p>
      </>
    ),
    term: {
      name: "IPO — Initial Public Offering",
      definition:
        "An IPO is the first time a private company sells shares to the public. Before an IPO, only founders, employees, and investors own the company. After, anyone can. The company raises capital to grow; investors get a stake in its future. Amazon raised $54 million in its 1997 IPO — less than what a single large order of AWS servers costs today.",
      impact:
        "$18/share × 100 shares = $1,800 invested at Amazon's IPO. Today, after four stock splits, that $1,800 has grown to over $2.4 million — an 1,300-bagger. But first you had to survive watching your $1,800 turn into $110 during the dot-com crash.",
    },
    check: {
      q: "What does an IPO allow a company to do for the first time?",
      choices: [
        "Buy back its own shares on the open market",
        "Sell shares to the public and raise capital",
        "Avoid paying corporate income taxes",
        "Merge with a publicly traded competitor",
      ],
      correct: 1,
      explain: "An IPO (Initial Public Offering) is the first time a private company sells shares to the public — raising capital to grow while giving anyone the chance to become an owner.",
    },
  },
  {
    narrative: (
      <>
        <p>
          But what does it actually mean to own a share of Amazon? You&apos;re not getting a
          corner of a warehouse. You don&apos;t get to sit in Jeff Bezos&apos;s meetings. What
          you own is a fractional claim on Amazon&apos;s future earnings, assets, and decisions.
        </p>
        <p>
          Amazon has approximately <B>10.4 billion shares</B> outstanding. If you own 10 shares,
          you own 0.00000000096% of the company — a billionth of a percent. That fraction is
          worth exactly what other investors are willing to pay for it. When Amazon earns more,
          that fraction is worth more. When it loses money, less. Your returns are tied directly
          to how well the actual business performs.
        </p>
      </>
    ),
    term: {
      name: "Equity",
      definition:
        "Equity means ownership. When you buy stock, you buy equity — a legal claim to a share of the company's assets and a share of any profits distributed to shareholders. Equity is what's left after all debts are paid. A company worth $2 trillion with $500 billion in debt has equity value of $1.5 trillion, split among all outstanding shares.",
      impact:
        "Amazon's equity value (market capitalization) is roughly $2.2 trillion. With 10.4 billion shares outstanding, each share represents the market's current consensus on what that 1/10.4-billionth of Amazon is worth — about $211. If Amazon doubles its profits, that number should theoretically double too.",
    },
    check: {
      q: "A company has $2 trillion in assets and $500 billion in debt. What is its equity value?",
      choices: [
        "$2.5 trillion",
        "$1.5 trillion",
        "$500 billion",
        "$2 trillion",
      ],
      correct: 1,
      explain: "Equity = Assets − Liabilities. $2T − $0.5T = $1.5T. Equity is what shareholders own after all debts are paid — also called 'book value.'",
    },
  },
  {
    narrative: (
      <>
        <p>
          By early 1999, Amazon stock had climbed to <B>$113/share</B>. The internet bubble
          was inflating everything. Amazon had still never turned an annual profit. The Nasdaq
          was the hottest market in history. Then came the reckoning.
        </p>
        <p>
          By September 2001, Amazon stock was at <B>$5.97</B> — a <B>94% decline</B> from its
          peak. That $1,800 investment made at IPO had grown to $11,300, then collapsed to
          just $597. Most investors sold. The people who held through the bloodbath — who
          understood they owned part of a real business, not a number on a screen — are the
          ones who became millionaires.
        </p>
      </>
    ),
    term: {
      name: "Volatility",
      definition:
        "Volatility measures how much a stock's price swings over time. A volatile stock can gain or lose 20–30% in a week. A less volatile stock might move 1–2% per week. Volatility is not inherently bad — it creates the buying opportunities that let patient investors acquire great businesses at low prices. The problem isn't volatility; it's panic.",
      impact:
        "Amazon fell 94% from peak to trough during the dot-com crash — an almost incomprehensible decline. Yet the underlying business grew through all of it. By 2007, the stock was back above its 1999 peak. By 2024, it was 200× higher than that. Volatility rewards the patient and destroys the panicked.",
    },
    check: {
      q: "Amazon fell 94% during the dot-com crash. Investors who held on eventually became millionaires. What does this teach us?",
      choices: [
        "Only trade stocks that never fall more than 20%",
        "Volatility rewards patient investors who own real businesses — and destroys those who panic-sell",
        "Crashes are permanent and stocks rarely recover",
        "Always sell before a stock drops more than 10%",
      ],
      correct: 1,
      explain: "Volatility is normal — even the most successful companies fall dramatically at times. Investors who understood Amazon was a real, growing business held through the 94% drop and captured the eventual recovery.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Companies that pay out a portion of their profits directly to shareholders do so via{" "}
          <I>dividends</I>. Coca-Cola has paid a dividend every year since 1893 — through the
          Great Depression, two World Wars, the dot-com crash, and the 2008 financial crisis.
          Amazon has never paid one. Both models create value; they just do it differently.
        </p>
        <p>
          Amazon reinvests every dollar it earns back into the business — warehouses, AWS,
          logistics, new markets. Shareholders get no cash, but the company grows faster and
          the stock price rises. Coca-Cola distributes cash and grows more slowly. Your
          strategy as an investor shapes which type of stock you want to own.
        </p>
      </>
    ),
    term: {
      name: "Dividends",
      definition:
        "A dividend is a cash payment from a company to its shareholders, typically paid quarterly. Dividend yield = annual dividend ÷ stock price. A stock at $100 that pays $4/year has a 4% yield. Companies with stable earnings (utilities, consumer staples) tend to pay dividends. Growth companies (tech) tend not to, preferring to reinvest. Dividends are a real return you receive while waiting for price appreciation.",
      impact:
        "If you owned 100 shares of Coca-Cola today at $65/share ($6,500 invested) with a 3% dividend yield, you'd collect $195/year in cash just for holding it — before any price appreciation. Reinvested for 30 years at the same yield, your dividends alone would more than double your position.",
    },
    check: {
      q: "Coca-Cola has paid a dividend every year since 1893. What is a dividend?",
      choices: [
        "A loan the company gives to investors",
        "A cash payment companies make to shareholders from their profits",
        "A fee charged to buy the stock",
        "A tax the government charges on stock gains",
      ],
      correct: 1,
      explain: "A dividend is a direct cash payment from a company to its shareholders, typically paid quarterly from the company's profits. It's one of two ways stocks can return money to you (the other is price appreciation).",
    },
  },
  {
    narrative: (
      <>
        <p>
          In June 2022, Amazon completed a <B>20-for-1 stock split</B>. If you had 1 share at
          $2,447, you woke up with 20 shares worth $122 each — same total value, more pieces.
          Stock splits don&apos;t create value; they lower the per-share price to make the
          stock accessible to smaller investors.
        </p>
        <p>
          But here&apos;s the key insight: that original $1,800 invested at IPO has been split
          multiple times over the years. Accounting for all splits, you would now hold{" "}
          <B>2,400 shares</B> (the original 100 split across four events: 2:1, 3:1, 2:1, 20:1).
          At today&apos;s price, those 2,400 shares are worth roughly <B>$506,400</B>. From
          $1,800. That&apos;s what happens when you buy equity in a great business and hold.
        </p>
      </>
    ),
    term: {
      name: "Stock Splits",
      definition:
        "A stock split divides existing shares into more shares, reducing the price proportionally. A 2-for-1 split gives you 2 shares for every 1 you owned, but each is worth half as much. Total value is unchanged. Companies split when shares get expensive and they want to keep the stock accessible to retail investors. A reverse split does the opposite — consolidates shares to raise the per-share price.",
      impact:
        "Amazon's four splits (2:1 in 1998, 3:1 in 1999, 2:1 in 1999, 20:1 in 2022) mean 100 shares bought at IPO became 2,400 shares. At $211/share, that's $506,400 from a $1,800 investment. Understanding splits prevents you from thinking a high share price means you can't afford a stock — you can often buy fractional shares anyway.",
    },
    check: {
      q: "After a 2-for-1 stock split, you have 200 shares instead of 100. What happens to the total value of your investment?",
      choices: [
        "It doubles",
        "It halves",
        "It stays the same",
        "It increases by 50%",
      ],
      correct: 2,
      explain: "Stock splits don't create or destroy value. You have more shares but each is worth proportionally less. Total value is unchanged — splits are mainly cosmetic, making shares more affordable without creating new wealth.",
    },
  },
  {
    narrative: (
      <>
        <p>
          In August 2018, Apple became the first company in history to reach a{" "}
          <B>$1 trillion</B> market capitalization. Four years later, it hit{" "}
          <B>$3 trillion</B> — more than the entire GDP of France. Yet Apple&apos;s stock
          price alone tells you nothing about its size. At $230/share, Apple looks{" "}
          &ldquo;cheaper&rdquo; per share than many small regional companies trading at
          $500 or $600.
        </p>
        <p>
          Market capitalization — price × shares outstanding — is the real measure of a
          company&apos;s size. A stock priced at $5 with 5 billion shares has a $25 billion
          market cap, larger than a stock priced at $500 with 1 million shares ($500 million
          cap). Comparing stock prices is meaningless. Comparing market caps tells you what
          the world thinks each company is actually worth.
        </p>
      </>
    ),
    term: {
      name: "Market Capitalization",
      definition:
        "Market Cap = Stock Price × Shares Outstanding. It measures the total market value of a company's equity. Companies are classified by size: mega-cap (>$200B), large-cap ($10B–$200B), mid-cap ($2B–$10B), small-cap ($300M–$2B), micro-cap (<$300M). Market cap changes every second as the stock price moves. It reflects what buyers and sellers collectively agree the entire company is worth right now — not what the company earns, owns, or is theoretically worth.",
      impact:
        "Apple's market cap of $3.3 trillion means owning every Apple share would cost $3.3 trillion. Amazon ($2.2T), Microsoft ($3.1T), and Nvidia ($3.0T) are in the same tier. Meanwhile, Macy's — a recognizable American brand — has a market cap of about $3 billion, a thousand times smaller than Apple. A single stock's price is meaningless without context. Two companies both priced at $50/share can have vastly different market caps: one with 100 million shares ($5B company), another with 10 billion shares ($500B company).",
    },
    check: {
      q: "Company A: stock price $5, 2 billion shares. Company B: stock price $200, 1 million shares. Which company is bigger?",
      choices: [
        "Company B, because its stock price is higher",
        "They are the same size",
        "You can't tell without seeing the income statement",
        "Company A — $5 × 2 billion = $10B vs. $200 × 1 million = $200M",
      ],
      correct: 3,
      explain: "Market Cap = Price × Shares Outstanding. Company A: $10B. Company B: $200M. Company A is 50× larger despite having a much cheaper share price. Price alone tells you nothing about a company's size.",
    },
  },
  {
    narrative: (
      <>
        <p>
          In 2012, Apple had accumulated <B>$97 billion</B> in cash — more than most
          countries&apos; government budgets. Investors complained: a pile of idle cash is
          dead money. Apple&apos;s board responded by initiating one of the most aggressive
          share buyback programs in corporate history. By 2024, Apple had repurchased over{" "}
          <B>$770 billion</B> of its own stock — more than any company in history.
        </p>
        <p>
          The math is elegant: Apple had roughly <B>26 billion shares</B> outstanding in 2012.
          Through buybacks, that number shrank to under <B>15 billion</B> today. Each remaining
          share now represents a larger slice of the same company. Even if Apple&apos;s total
          profits stayed flat, earnings <I>per share</I> would rise — because the earnings are
          divided among fewer shares. Buybacks are one of the most powerful tools for silently
          increasing shareholder value.
        </p>
      </>
    ),
    term: {
      name: "Stock Buybacks",
      definition:
        "A buyback (or share repurchase) occurs when a company uses cash to buy its own shares on the open market, then retires them. This reduces shares outstanding, increasing each remaining share's ownership percentage and earnings per share (EPS). If net income stays flat but shares outstanding fall 5%, EPS rises 5%. Companies use buybacks as an alternative to dividends — they're more tax-efficient for investors and more flexible for the company (dividends create an expectation; buybacks don't). Companies can pause buybacks in bad years.",
      impact:
        "Apple's buyback program from 2012–2024 ($770 billion) is the largest in corporate history. In 2023 alone, Apple bought back $85 billion in shares — more than the market cap of most S&P 500 companies. Warren Buffett, Apple's largest external shareholder, has called Apple's buybacks 'enormously beneficial' to Berkshire — as Apple buys back shares, Berkshire's percentage ownership increases without spending a dollar. When Apple shrinks its share count from 26B to 15B, every remaining shareholder automatically owns a larger percentage of the same business.",
    },
    check: {
      q: "When Apple buys back and retires its own shares, what happens to each remaining shareholder's ownership percentage?",
      choices: [
        "It decreases, because the company spent cash it could have returned as dividends",
        "It increases — fewer shares means each share represents a bigger piece of the same company",
        "It stays the same because the company's total value didn't change",
        "It depends on the stock price at the time of the buyback",
      ],
      correct: 1,
      explain: "When total shares outstanding shrink, each remaining share represents a larger ownership percentage. If Apple earns $100B and there are 15B shares (not 26B), earnings per share rises — you own more of the same company without spending a cent.",
    },
  },
  {
    narrative: (
      <>
        <p>
          When Lehman Brothers collapsed in September 2008, Goldman Sachs was under siege.
          Institutional clients were pulling money. Goldman&apos;s stock had fallen <B>40%</B>.
          The firm needed a signal — something to tell the market it wasn&apos;t Lehman.
          They called Warren Buffett.
        </p>
        <p>
          Buffett agreed to invest <B>$5 billion</B> — but not in common stock. He demanded{" "}
          <I>preferred shares</I>: a guaranteed <B>10% annual dividend</B> ($500 million/year),
          the right to be repaid his $5B before any common shareholder in a liquidation, and
          warrants to buy $5B in common stock later at a fixed price. He took almost no risk
          while common shareholders took enormous risk. Same company. Completely different deal.
          This is the difference between common and preferred stock.
        </p>
      </>
    ),
    term: {
      name: "Common vs. Preferred Stock",
      definition:
        "Common stock is the standard ownership share: voting rights on corporate matters, dividends if declared by the board, and residual claim on assets after all debts and preferred shareholders are paid. It benefits most from company growth. Preferred stock is a hybrid between stock and bond: it pays a fixed dividend that must be paid before common dividends, it has priority over common stock in bankruptcy liquidation, but typically has no voting rights and limited upside if the company soars. Preferred stock is issued to institutional investors, venture capitalists, or in special negotiated deals.",
      impact:
        "Buffett's preferred shares earned Goldman Sachs the stamp of approval they needed — if Buffett was willing to put in $5B, Goldman must be okay. The stock stabilized and recovered. Buffett collected $500M/year in dividends while waiting, then converted his warrants into Goldman common stock at a profit of over $3 billion. Common shareholders nearly got wiped out in 2008; preferred shareholders like Buffett were protected throughout. Most publicly traded 'stock' is common stock. When you see Berkshire Class A ($650,000/share) and Class B ($430/share), those are different share classes with different voting rights — another way companies structure equity ownership.",
    },
    check: {
      q: "Buffett demanded preferred shares in Goldman Sachs instead of common stock. What did preferred shares give him that common stockholders didn't have?",
      choices: [
        "The right to vote on Goldman's board decisions",
        "A guaranteed 10% annual dividend and priority over common shareholders in bankruptcy",
        "More shares than any common investor",
        "A lower tax rate on his investment gains",
      ],
      correct: 1,
      explain: "Preferred stock typically offers a fixed dividend (paid before common dividends) and priority claim in bankruptcy. Less upside if the company soars — but much more protection if it struggles.",
    },
  },
];

const U1: StockUnit = {
  num: 1,
  slug: "unit-1",
  title: "What Is a Stock?",
  accent: "#2563eb",
  previewHook: "Amazon's stock dropped 94% after its peak. Investors who sold lost everything. Those who held turned $1,800 into $500,000.",
  concepts: ["Equity & ownership", "Dividends", "IPOs", "Stock splits"],
  hook: {
    title: "The $1,800 Bet",
    setup: (
      <>
        <p>
          In 1997, an online bookstore called Amazon went public at $18 a share. Wall Street
          called it a joke — the company had never made a profit and was burning cash. Most
          analysts said it would fail within two years.
        </p>
        <p>
          Then the stock rose. Then it crashed <strong>94%</strong> during the dot-com bust.
          Then it came back. And kept going.
        </p>
      </>
    ),
    question: "What would $1,800 invested at Amazon's 1997 IPO be worth today?",
    reveal: {
      stat: "$506,400",
      statSub: "from a $1,800 investment in 1997",
      explanation:
        "100 shares at $18 each. Through four stock splits and 27 years of compounding, that position grew to 2,400 shares worth $211 each. The investors who held through the 94% crash — who understood they owned a piece of an actual business — are the ones who collected.",
    },
  },
  lesson: {
    title: "The Garage in Bellevue",
    character: "A story about what you're actually buying when you buy a stock",
    beats: U1_BEATS,
    ctaLabel: "Go Buy Your First Stock →",
    ctaSubtitle: "You know what stocks are. Now put $1,000 of your virtual capital to work.",
  },
  mission: {
    title: "Mission 1: Buy Equity",
    description:
      "You just learned that a stock is fractional ownership in a real business. Your mission: buy at least 1 share of a company you actually understand. Not because it will go up — but because you believe in what it does.",
    steps: [
      "Search for a company whose products you use every day",
      "Read its description and check its current price",
      "Buy at least 1 share with your virtual cash",
      "Write down (mentally) why you chose it — this matters in Unit 4",
    ],
    tickerSuggestion: "AMZN",
  },
  unitQuiz: [
    {
      q: "Amazon's stock dropped 94% during the dot-com crash. Long-term holders turned $1,800 into $500,000. What concept explains why they were right to hold?",
      choices: [
        "Recency bias — recent crashes always recover quickly",
        "They owned equity in a real business whose fundamentals hadn't changed — the crash was the market's temporary opinion, not the company's actual value",
        "Market cap had reached a new all-time high during the crash",
        "IPO investors are always protected from permanent losses",
      ],
      correct: 1,
      explain: "Equity means ownership in a real business. Amazon's warehouses, technology, and growth didn't disappear during the crash — only investor sentiment did. Holders who understood this captured the eventual recovery.",
    },
    {
      q: "A stock splits 2-for-1. You had 100 shares worth $50 each ($5,000 total). After the split, what do you have?",
      choices: [
        "50 shares worth $100 each",
        "200 shares worth $25 each ($5,000 total — same value)",
        "200 shares worth $50 each ($10,000 total)",
        "100 shares worth $25 each",
      ],
      correct: 1,
      explain: "A 2-for-1 split doubles shares and halves the price. Total value stays exactly the same. Splits are cosmetic — they make shares more affordable but don't create new wealth.",
    },
    {
      q: "Coca-Cola pays $2 in annual dividends and its stock trades at $65. What is its dividend yield?",
      choices: [
        "2%",
        "3.1%",
        "5%",
        "6.5%",
      ],
      correct: 1,
      explain: "Dividend Yield = Annual Dividend ÷ Stock Price = $2 ÷ $65 ≈ 3.1%. This represents the annual cash return from dividends alone, before any price appreciation.",
    },
    {
      q: "Apple buys back $85 billion of its own stock in 2023. If Apple's total earnings stay the same but shares outstanding fall, what happens to EPS?",
      choices: [
        "EPS falls because the company spent cash on buybacks",
        "EPS rises — same total earnings divided among fewer shares",
        "EPS stays the same because total earnings didn't change",
        "The dividend must be cut to fund the buyback",
      ],
      correct: 1,
      explain: "Earnings Per Share = Total Earnings ÷ Shares Outstanding. If earnings stay flat but share count falls, EPS rises. Each remaining share represents a larger slice of the same pie.",
    },
    {
      q: "Buffett's preferred shares in Goldman paid a guaranteed 10% dividend. Common shareholders got no guarantee. What is the core trade-off between common and preferred stock?",
      choices: [
        "Preferred is always better — guaranteed return with full upside",
        "Preferred offers fixed income and priority in bankruptcy; common offers more upside but no guarantees",
        "Common stock always pays a higher dividend than preferred",
        "Preferred stockholders vote on all corporate decisions; common stockholders don't",
      ],
      correct: 1,
      explain: "Preferred stock trades upside for protection: fixed dividend, priority in bankruptcy. Common stock has no guaranteed dividend but participates fully in the company's growth — which is why most publicly traded shares are common.",
    },
  ],
};

// ── Unit 2: How Markets Work ───────────────────────────────────────────────────

const U2_BEATS: StoryBeat[] = [
  {
    narrative: (
      <>
        <p>
          Monday, October 19, 1987. The Dow Jones Industrial Average dropped <B>22.6%</B> in
          a single day. In dollar terms, the U.S. stock market lost more than the entire GDP
          of France. Traders on the floor of the New York Stock Exchange couldn&apos;t process
          orders fast enough. The phones stopped working. Some brokers literally ran out of
          the building.
        </p>
        <p>
          No war had started. No major company had failed. No economic statistic had changed.
          What caused it? A chain reaction of <I>sell orders</I> triggering more sell orders,
          amplified by new computerized trading systems and a market structure that most
          participants didn&apos;t fully understand. Understanding how markets actually work
          is how you avoid becoming the panicked seller.
        </p>
      </>
    ),
    term: {
      name: "Market Makers",
      definition:
        "A market maker is a firm (or individual) that stands ready to buy or sell a security at publicly quoted prices at all times. They profit from the spread between the price they buy at and the price they sell at. Market makers provide liquidity — they ensure there's always someone on the other side of your trade. Without them, you might place an order to sell and wait days for a buyer.",
      impact:
        "On Black Monday 1987, market makers pulled back. Liquidity evaporated. Some stocks had no buyers at any price for hours. The crash wasn't caused by bad news — it was caused by a collapse in market structure. Understanding liquidity explains why some small-cap stocks are dangerous: if everyone tries to sell at once, the price can drop 90% in minutes with no floor.",
    },
    check: {
      q: "What role do market makers play in stock trading?",
      choices: [
        "They decide which companies can list on stock exchanges",
        "They stand ready to buy or sell at quoted prices, ensuring there's always someone on the other side of your trade",
        "They set the opening prices for all stocks each morning",
        "They manage individual investor portfolios for a fee",
      ],
      correct: 1,
      explain: "Market makers provide liquidity by always being willing to buy or sell at their quoted prices. Without them, you might place a sell order and wait days for a buyer — as happened on Black Monday when they pulled back.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Every trade you make has two sides: a <I>bid</I> (the price a buyer is willing to pay)
          and an <I>ask</I> (the price a seller wants). The difference is the spread. When you buy
          Apple at $213, there&apos;s a seller at $213 on the other side. When you click "buy,"
          the exchange matches you with that seller instantly.
        </p>
        <p>
          For a stock like Apple — traded billions of times a day — the spread might be{" "}
          <B>$0.01</B>. For a tiny biotech company no one&apos;s heard of, the spread might be{" "}
          <B>$0.50 or more</B>. Every time you trade, you implicitly pay the spread. Trade a
          thin, illiquid stock frequently, and the spread alone can eat your returns.
        </p>
      </>
    ),
    term: {
      name: "Bid-Ask Spread",
      definition:
        "The bid is the highest price a buyer will pay. The ask is the lowest price a seller will accept. The spread is the difference. For AAPL, it might be $212.99 bid / $213.00 ask — a $0.01 spread. For a small company, it might be $4.50 bid / $5.00 ask — an 11% spread. When you 'buy at market,' you pay the ask; when you 'sell at market,' you receive the bid. The spread is an invisible cost of trading.",
      impact:
        "A 1% spread on a $10,000 trade costs you $100 immediately, before the stock moves a dollar. A day trader who makes 10 trades per day on a stock with a 0.5% spread loses 5% per day to spreads alone — before even counting commissions. The bid-ask spread is why long-term investing beats short-term trading for almost everyone who isn't a market maker.",
    },
    check: {
      q: "Apple is quoted at $212.99 bid / $213.00 ask. You place a market order to BUY. What price do you pay?",
      choices: [
        "$212.99 (the bid)",
        "$213.00 (the ask)",
        "Somewhere between the two",
        "$212.995 (the exact midpoint)",
      ],
      correct: 1,
      explain: "When you buy at market, you pay the ask — the lowest price a seller will accept. When you sell, you receive the bid. That $0.01 difference (the spread) is an invisible cost every time you trade.",
    },
  },
  {
    narrative: (
      <>
        <p>
          When you buy stock, you choose how: a <I>market order</I> executes immediately at
          whatever price is available. A <I>limit order</I> says &ldquo;only buy if the price
          drops to X.&rdquo; A <I>stop-loss order</I> says &ldquo;sell automatically if the
          price falls to Y.&rdquo;
        </p>
        <p>
          On Black Monday, those computerized stop-loss orders became the crash. As prices fell,
          stops triggered, pushing prices lower, which triggered more stops. It was a cascading
          machine — automated selling feeding automated selling until there was nothing left to
          catch it. The lesson: stop-losses protect individual investors but can, at scale,
          destroy the market they were designed to protect.
        </p>
      </>
    ),
    term: {
      name: "Order Types",
      definition:
        "Market order: buy or sell immediately at the best available price. Fast but you don't control the price — in a fast-moving market, you might pay far more than expected (called 'slippage'). Limit order: buy or sell only at your specified price or better. Slower and may not fill, but you control the price. Stop order: triggers a market order when a price threshold is hit — used to limit losses or lock in gains. Each has tradeoffs between certainty of execution and certainty of price.",
      impact:
        "On a calm day, market orders are fine for large stocks like AAPL or MSFT. In volatile conditions, always use limit orders. If AAPL is at $213 and you place a market buy order during a fast-moving morning, you might pay $215 or $216 before the order fills. A limit order at $213.50 ensures you pay no more than that — even if it doesn't fill.",
    },
    check: {
      q: "You want to buy a stock but don't want to pay more than $50 per share. Which order type should you use?",
      choices: [
        "Market order — it guarantees the fastest execution",
        "Stop-loss order — it triggers when the price hits your level",
        "Limit order — it only executes at your specified price or better",
        "All three options work equally well for price control",
      ],
      correct: 2,
      explain: "A limit order gives you price certainty. You set the maximum you'll pay, and the order only fills at that price or lower. A market order would execute immediately at whatever the current ask is — you lose price control.",
    },
  },
  {
    narrative: (
      <>
        <p>
          The S&P 500, the Dow Jones, the NASDAQ — you hear these every day. They are{" "}
          <I>indices</I>: baskets of stocks that represent a slice of the market. The Dow tracks
          30 large American companies. The S&P 500 tracks 500 companies weighted by their market
          value. The NASDAQ Composite tracks every stock on the NASDAQ exchange, which is
          heavily tech-weighted.
        </p>
        <p>
          When someone says &ldquo;the market&rdquo; is up or down, they usually mean the S&P 500.
          It&apos;s the most widely tracked benchmark — the number every professional investor,
          every mutual fund, every hedge fund is compared against. If your portfolio beats the
          S&P 500 over 10 years, you&apos;ve beaten 90% of professional money managers.
        </p>
      </>
    ),
    term: {
      name: "Market Indices",
      definition:
        "An index is a calculated number that tracks the combined performance of a group of stocks. The S&P 500 is market-cap weighted — Apple (the largest company) has more influence on the index than a smaller company. The Dow Jones is price-weighted — a $500 stock affects it more than a $50 stock, regardless of company size. Indices themselves can't be traded directly, but index funds and ETFs track them, letting investors own the whole basket.",
      impact:
        "From 1957 to 2024, the S&P 500 has returned an average of about 10.5% per year — including crashes, wars, recessions, and pandemics. $10,000 invested in 1957 would be worth roughly $5 million today. The index has never permanently failed to recover from any crash in its history. This is why so many investors simply buy the index and hold.",
    },
    check: {
      q: "When financial news says 'the market is up 1% today,' which index are they almost always referring to?",
      choices: [
        "The Dow Jones Industrial Average",
        "The NASDAQ Composite",
        "The S&P 500",
        "The Russell 2000",
      ],
      correct: 2,
      explain: "The S&P 500 — tracking 500 large American companies weighted by market cap — is the most widely used benchmark. It's what professional fund managers are compared against, and it best represents 'the overall market.'",
    },
  },
  {
    narrative: (
      <>
        <p>
          There are two main stock exchanges in the United States: the <B>NYSE</B> (New York
          Stock Exchange) and the <B>NASDAQ</B>. The NYSE, founded in 1792 under a buttonwood
          tree on Wall Street, is the oldest and most prestigious. For most of its history,
          stocks were traded by human specialists on a physical floor. NASDAQ, founded in 1971,
          was the world&apos;s first fully electronic stock market — no floor, no specialists,
          just computers matching buyers and sellers.
        </p>
        <p>
          The distinction matters. Most of America&apos;s oldest industrial companies —
          JPMorgan, Walmart, Disney — list on the NYSE. Most technology companies — Apple,
          Microsoft, Amazon, Nvidia, Meta — list on NASDAQ. When the media says &ldquo;the
          stock market&rdquo; is up or down, they usually mean both. But knowing which exchange
          a company lists on tells you something about what kind of company it is.
        </p>
      </>
    ),
    term: {
      name: "NYSE vs. NASDAQ",
      definition:
        "NYSE (New York Stock Exchange): the world's largest stock exchange by market cap (~$25 trillion), known for its physical trading floor and blue-chip listings. Uses Designated Market Makers (DMMs) to ensure orderly trading. NASDAQ: the world's second-largest exchange, created in 1971 as the first electronic market. Known for technology company listings. Both exchanges use automated systems today — the NYSE floor is largely ceremonial. Stocks are listed on one primary exchange but trade across many electronic venues simultaneously.",
      impact:
        "When Apple moved from OTC markets to the NASDAQ in 1980, it was a statement: NASDAQ was where technology companies grew up. Today, the five largest companies by market cap (Apple, Microsoft, Nvidia, Amazon, Meta) all trade on NASDAQ. The NYSE is home to JPMorgan, Goldman Sachs, Walmart, Berkshire Hathaway, and ExxonMobil. This is why the 'tech-heavy NASDAQ' and the 'blue-chip Dow Jones' can diverge dramatically: NASDAQ swings harder in tech cycles; the NYSE is more tied to the traditional economy.",
    },
    check: {
      q: "Which exchange became the home for most major technology companies like Apple, Amazon, and Nvidia?",
      choices: [
        "NYSE (New York Stock Exchange) — founded in 1792, home to the largest companies",
        "NASDAQ — founded in 1971 as the first fully electronic market",
        "Both exchanges share tech companies equally",
        "The Chicago Mercantile Exchange",
      ],
      correct: 1,
      explain: "NASDAQ, the world's first electronic stock market, attracted technology companies starting with Apple in 1980. Today all five of the largest U.S. companies by market cap trade on NASDAQ. NYSE is more associated with traditional finance and industrial giants.",
    },
  },
  {
    narrative: (
      <>
        <p>
          After Black Monday in 1987 — the cascade you read about at the start of this unit —
          regulators asked a simple question: how do we prevent a machine-driven waterfall from
          ever happening again? Their solution was the <I>circuit breaker</I>. If the S&P 500
          falls <B>7%</B> in a single day, trading halts for 15 minutes. If it falls{" "}
          <B>13%</B>, another 15-minute halt. If it falls <B>20%</B>, trading stops for the
          rest of the day entirely.
        </p>
        <p>
          The circuit breakers were tested for real in March 2020, when COVID-19 triggered the
          fastest bear market in history. The S&P 500 hit the 7% circuit breaker and halted{" "}
          <B>four times</B> in one week. The pauses gave algorithms and humans alike a moment
          to breathe, preventing the automated death spiral of 1987. Markets still fell 34%
          over several weeks — but gradually, not all at once.
        </p>
      </>
    ),
    term: {
      name: "Circuit Breakers",
      definition:
        "Circuit breakers are automatic trading halts triggered when markets fall too fast. Market-wide levels: Level 1 (−7%): 15-minute halt; Level 2 (−13%): 15-minute halt; Level 3 (−20%): market closes for the day. Individual stocks also have circuit breakers, typically halting trading if a single stock moves more than 5–10% in a 5-minute window (called Limit Up-Limit Down, or LULD). Circuit breakers were introduced in 1988 following the Black Monday crash, specifically designed to interrupt automated cascades and give humans time to assess the situation.",
      impact:
        "On March 16, 2020, the S&P 500 fell 12% — one of the largest single-day declines in modern history. Circuit breakers triggered twice. Trading continued after halts. Contrast with March 1987 when no circuit breakers existed and markets simply kept falling until the close. Researchers estimate circuit breakers prevent 3–5 additional percentage points of decline in extreme events by interrupting the self-reinforcing automated selling cascade. The price: brief liquidity freezes during the halts, which can be jarring but are far preferable to unchecked freefall.",
    },
    check: {
      q: "Circuit breakers halt trading when the S&P 500 falls 7% in a day. What problem are they designed to prevent?",
      choices: [
        "Insider trading by corporate executives",
        "Automated sell orders cascading into more sell orders, creating a machine-driven crash spiral",
        "Foreign governments from manipulating U.S. markets",
        "Individual investors from losing more than 7% in a single day",
      ],
      correct: 1,
      explain: "Circuit breakers interrupt the cascade of automated selling that caused Black Monday 1987. A 15-minute pause gives algorithms and humans time to reassess — breaking the self-reinforcing spiral before it destroys the market.",
    },
  },
  {
    narrative: (
      <>
        <p>
          On October 3, 2022, Apple&apos;s stock rose <B>2.1%</B> on average volume —
          barely worth noting. Then on November 3, 2023, Apple fell <B>2.1%</B> on volume{" "}
          <B>3× higher than normal</B> — over 180 million shares traded versus the typical
          60 million. That same 2.1% decline on 3× volume was significant: it signaled
          institutional conviction, not random noise.
        </p>
        <p>
          Volume is the market&apos;s truth detector. A price move on high volume is confirmed —
          many participants agreed on the new price. A price move on low volume is suspect —
          a handful of large trades briefly pushed the price, but the rest of the market
          isn&apos;t convinced yet. Watching price <I>and</I> volume together tells you whether
          a move is real or a temporary blip.
        </p>
      </>
    ),
    term: {
      name: "Trading Volume",
      definition:
        "Volume is the number of shares traded in a given period. Average daily volume (ADV) is the typical number traded per day, usually measured over 30 or 90 days. Relative volume = today's volume ÷ average volume. A relative volume of 1× is normal; 2×+ is elevated; 5×+ is extreme and signals a major event (earnings surprise, news, acquisition rumor). Rising prices on rising volume confirms a trend. Rising prices on falling volume may be a false move. Volume is the market's way of 'voting' on whether a price change is meaningful.",
      impact:
        "GameStop's short squeeze in January 2021 was visible in the volume data before it became news. On January 22, GME traded 197 million shares — 87× its average daily volume of 2.3 million shares. The extreme volume combined with the price rise was the signal that something extraordinary was happening. Institutional investors who monitor volume patterns spotted the move days before it became a mainstream media story. Volume is often the first warning that a stock is about to make a major move — in either direction.",
    },
    check: {
      q: "Apple's stock rises 2% on volume 10× its daily average. What does the high volume tell you about this price move?",
      choices: [
        "The move is likely a mistake and will reverse quickly",
        "Many market participants agreed on the new price — the move is more credible and meaningful",
        "The stock is about to split",
        "Insiders are selling their shares",
      ],
      correct: 1,
      explain: "Volume is the market's voting mechanism. A price move on high volume means many buyers and sellers participated and agreed on the new price. Low-volume moves are more likely to be temporary noise.",
    },
  },
];

const U2: StockUnit = {
  num: 2,
  slug: "unit-2",
  title: "How Markets Work",
  accent: "#7c3aed",
  previewHook: "In 1987, the market fell 22% in a single day. No war. No recession. No disaster. Here's the real reason.",
  concepts: ["Market makers", "Bid-ask spread", "Order types", "S&P 500, Dow, NASDAQ"],
  hook: {
    title: "Black Monday",
    setup: (
      <>
        <p>
          October 19, 1987. Monday. The Dow Jones opened, and by 4 PM had dropped{" "}
          <strong>22.6%</strong> — the largest single-day percentage decline in history,
          nearly twice the crash of 1929. $500 billion in value vanished. Brokers wept on the
          trading floor. Experts predicted a depression.
        </p>
        <p>
          No war had started. No company had failed. No economic data had changed. The cause
          was something most people still don&apos;t understand.
        </p>
      </>
    ),
    question: "What caused the worst single-day stock market crash in history?",
    reveal: {
      stat: "Automated sell orders",
      statSub: "cascading into more sell orders — a market eating itself",
      explanation:
        "Computerized 'portfolio insurance' programs were programmed to sell stocks automatically when prices fell. As prices dropped, these systems triggered, selling more, pushing prices lower, triggering more automated selling. In two years, the market recovered completely and hit new all-time highs. The crash that felt like the end was a machine malfunction.",
    },
  },
  lesson: {
    title: "The Day the Phones Stopped Working",
    character: "A story about the hidden machinery underneath every trade",
    beats: U2_BEATS,
    ctaLabel: "Place a Trade →",
    ctaSubtitle: "Try placing both a market order and a limit order. Notice what's different.",
  },
  mission: {
    title: "Mission 2: Use a Limit Order",
    description:
      "The market order is the lazy way. A limit order is how you take control of your execution price. Your mission: place a limit order for a stock you want — set the limit price slightly below the current price and see if it fills.",
    steps: [
      "Pick a stock from your holdings or search for a new one",
      "Note the current price",
      "On the trade page, set your quantity and check the estimated cost",
      "Buy it — observe how the execution works",
    ],
  },
  unitQuiz: [
    {
      q: "On Black Monday 1987, computerized 'portfolio insurance' programs caused a cascade of selling that crashed the market 22% with no bad news. What does this reveal?",
      choices: [
        "Computer-driven markets are always safer than human-driven ones",
        "Automated systems can amplify crashes by executing without judgment — feedback loops can be more dangerous than the original trigger",
        "Portfolio insurance worked exactly as designed by protecting portfolios",
        "The NYSE circuit breakers stopped the crash at -7%",
      ],
      correct: 1,
      explain: "Automated sell programs triggered more automated selling, creating a cascade with no human to say 'stop.' This is why circuit breakers now exist — to break automated spirals before they run out of control.",
    },
    {
      q: "You want to buy Apple but are worried about overpaying if prices spike this morning. Which order type gives you price certainty?",
      choices: [
        "Market order — guarantees fast execution at any price",
        "Limit order — only executes at your specified price or lower",
        "Stop-loss order — triggers when the price hits a threshold",
        "All three work equally well for price control",
      ],
      correct: 1,
      explain: "A limit order gives you complete price certainty. You set your maximum price, and the order won't fill above it — even if the market moves. The trade-off: it might not fill at all if the price never reaches your limit.",
    },
    {
      q: "Amazon's stock price is ~$180 and Apple's is ~$180. Amazon's market cap is $1.9 trillion; Apple's is $2.8 trillion. What explains the difference?",
      choices: [
        "Apple has a higher P/E ratio",
        "Amazon and Apple have different numbers of shares outstanding",
        "The two stocks trade on different exchanges with different valuations",
        "Apple pays a higher dividend",
      ],
      correct: 1,
      explain: "Market Cap = Price × Shares Outstanding. At similar prices, a larger market cap means more shares outstanding. Apple has more total shares, giving it a larger total market value at roughly the same per-share price.",
    },
    {
      q: "GameStop traded at 87× its average daily volume during the short squeeze. Why is high relative volume a meaningful signal?",
      choices: [
        "It always means the stock is about to crash",
        "High relative volume signals that an unusual number of participants are active — something significant is likely happening",
        "Only institutional investors cause high-volume days",
        "Volume spikes are always caused by stock splits",
      ],
      correct: 1,
      explain: "87× average volume means an extraordinary number of market participants were engaged. Volume is the market's conviction meter — extreme volume signals something major is happening and the move is less likely to be random noise.",
    },
    {
      q: "The S&P 500 has never permanently failed to recover from any crash in its history. For a long-term investor, what is the most important takeaway?",
      choices: [
        "You should always sell before crashes to buy back lower",
        "Staying invested through downturns — rather than panic selling — captures the recoveries that have always followed",
        "Only buy S&P 500 stocks after they've fully recovered from crashes",
        "Crashes are random and there's no strategy that helps",
      ],
      correct: 1,
      explain: "Historical S&P 500 returns average ~10.5% per year — but only if you stay invested. Investors who sold during crashes typically missed the sharp early recoveries, permanently reducing their long-term returns.",
    },
  ],
};

// ── Unit 3: Reading a Company ──────────────────────────────────────────────────

const U3_BEATS: StoryBeat[] = [
  {
    narrative: (
      <>
        <p>
          In August 2019, WeWork filed its S-1 — the legal document every company must publish
          before going public. The cover page called them &ldquo;a global physical social
          network.&rdquo; Venture capitalists had valued the company at <B>$47 billion</B>.
          The CEO was photographed meditating. The company was selling a spiritual vision of
          office space.
        </p>
        <p>
          Then people actually read the filing. Buried in 350 pages of dense legal prose were
          numbers that told a completely different story. For every <B>$1</B> WeWork earned in
          revenue, it spent <B>$2.19</B>. Its gross margin was <B>negative 28%</B>. One
          analyst read the document in a single night and sent a memo to his firm: &ldquo;This
          company should not go public.&rdquo; The IPO was canceled within weeks. The valuation
          collapsed from $47B to under $8B.
        </p>
      </>
    ),
    term: {
      name: "Income Statement",
      definition:
        "The income statement shows a company's revenues, expenses, and profit (or loss) over a period of time — usually a quarter or a year. Revenue is what the company earned from customers. Cost of goods sold is the direct cost to deliver that product or service. Gross profit = Revenue − COGS. Then subtract operating expenses (rent, salaries, marketing) to get operating income. Then subtract interest and taxes to get net income (the 'bottom line').",
      impact:
        "WeWork's income statement showed revenue of $1.54 billion and net losses of $1.61 billion in the first half of 2019 — a negative net profit margin of -104%. This means for every dollar they made, they spent two dollars. No amount of 'we are a technology company' branding changes that math.",
    },
    check: {
      q: "WeWork earned $1 and spent $2.19 for every dollar earned. Which financial statement revealed this?",
      choices: [
        "The balance sheet",
        "The cash flow statement",
        "The income statement",
        "The S-1 proxy statement",
      ],
      correct: 2,
      explain: "The income statement shows revenues, expenses, and profit (or loss) over a time period. Revenue − Expenses = Net income (or loss). It's where you find out whether a company actually makes money from its core operations.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Gross margin is the single most telling number in a business. It tells you: after the
          direct cost of making and delivering your product, how much is left? A software company
          might have a 70–80% gross margin — the cost of delivering software to one more user is
          nearly zero. A grocery store might have a 25% gross margin — thin, because food costs
          money to buy, store, and ship.
        </p>
        <p>
          WeWork had <B>negative</B> gross margins. That means they were losing money on each
          desk they rented before paying a single salary or buying a single laptop. The business
          model was fundamentally broken at the unit level. You can&apos;t grow your way out of
          negative gross margins — you just lose more money faster.
        </p>
      </>
    ),
    term: {
      name: "Gross Margin",
      definition:
        "Gross Margin = (Revenue − Cost of Goods Sold) / Revenue × 100%. It measures what percentage of revenue survives after paying for the direct costs of production. Apple's gross margin is ~47% — for every $100 of iPhones sold, $47 is left after manufacturing costs. Software companies like Microsoft often exceed 70%. Retail and commodity businesses may be 20–30%. A negative gross margin means the product costs more to make than it sells for.",
      impact:
        "A company needs gross margin to pay for everything else — salaries, rent, R&D, marketing, and profit. If WeWork's gross margin was -28%, every office desk they rented cost them 28 cents more than they charged. Signing more leases didn't fix this; it magnified the problem. Gross margin is the floor everything else is built on.",
    },
    check: {
      q: "A company's gross margin is negative 28%. What does that mean in plain terms?",
      choices: [
        "The company earned a 28% profit margin after all expenses",
        "The product costs more to make and deliver than the company charges for it",
        "The company paid 28% in taxes on its profits",
        "Revenue fell 28% compared to last year",
      ],
      correct: 1,
      explain: "Negative gross margin means the direct cost of delivering the product exceeds the price charged. You can't fix this by growing faster — every new sale just loses more money. The foundation of the business is broken.",
    },
  },
  {
    narrative: (
      <>
        <p>
          You find a company you love. The product is great. The CEO is charismatic. Revenue
          is growing 40% per year. But should you buy the stock? Not until you answer one
          question: <I>how much are you paying for those earnings?</I>
        </p>
        <p>
          The <I>P/E ratio</I> — Price-to-Earnings — divides the stock&apos;s current price
          by its annual earnings per share. If a stock costs $100 and earns $5 per share, its
          P/E is 20. You&apos;re paying $20 for every $1 of annual earnings. The average P/E
          for the S&P 500 over the last century is about 16–18. A P/E of 40 means investors
          expect explosive growth. A P/E of 8 might mean the company is cheap — or dying.
        </p>
      </>
    ),
    term: {
      name: "P/E Ratio",
      definition:
        "P/E (Price-to-Earnings) = Stock Price ÷ Earnings Per Share. It tells you how many years of current earnings you're paying for the stock. A P/E of 20 means you're paying 20 years' worth of current earnings. High P/E stocks are priced for growth — investors expect earnings to rise sharply. Low P/E stocks are either cheap (undervalued) or distressed (earnings expected to fall). P/E can't be calculated for companies with negative earnings (like WeWork).",
      impact:
        "Netflix's P/E at its 2021 peak was over 60 — investors were paying 60 years' worth of earnings for each share. The market was betting on massive future growth. When subscriber growth slowed in 2022, the stock fell 75%. The P/E wasn't wrong — the growth assumption was. Understanding P/E means understanding what growth story the market is already pricing in.",
    },
    check: {
      q: "A stock costs $100 and earns $5 per share. What is its P/E ratio, and what does it mean?",
      choices: [
        "5 — you earn 5% per year from this stock",
        "10 — it will double in 10 years",
        "20 — you're paying 20 years' worth of current earnings for each share",
        "50 — the stock is very undervalued",
      ],
      correct: 2,
      explain: "P/E = Price ÷ EPS = $100 ÷ $5 = 20. This means you're paying 20 years' worth of current earnings. High P/E = investors expect fast growth. Low P/E = slower growth or possible undervaluation.",
    },
  },
  {
    narrative: (
      <>
        <p>
          EPS — earnings per share — is simply the company&apos;s net profit divided by the
          number of shares outstanding. If a company earns $1 billion and has 500 million shares,
          EPS is <B>$2.00</B>. When you buy a share, you buy the right to $2.00 of annual
          corporate earnings.
        </p>
        <p>
          Companies report EPS quarterly. Wall Street analysts publish <I>consensus estimates</I>{" "}
          before each quarter. If a company was expected to earn $1.50/share and instead earns{" "}
          $1.75, it &ldquo;beat estimates&rdquo; — often triggering a price jump even if the
          absolute earnings are low. If it earns $1.25, the stock might fall even though the
          company is still profitable. Markets run on expectations, not absolutes.
        </p>
      </>
    ),
    term: {
      name: "EPS — Earnings Per Share",
      definition:
        "EPS = Net Income ÷ Shares Outstanding. It standardizes profitability so you can compare companies of different sizes. Apple earns far more total dollars than a smaller tech company, but EPS lets you compare per-share efficiency. Diluted EPS accounts for all possible shares (including stock options and convertible bonds). Most investors track diluted EPS as the conservative measure.",
      impact:
        "If Apple earns $6.40/share and trades at $213, its P/E is 33. If earnings grow 10% to $7.04/share and the P/E stays constant, the stock should trade at $232. This is the core mechanism: earnings growth → EPS growth → stock price growth (everything else equal). The entire investing game is predicting future EPS.",
    },
    check: {
      q: "A company was expected to earn $1.50/share but earned $1.75/share instead — a real increase. Why might the stock still jump?",
      choices: [
        "Any earnings increase automatically triggers a price jump",
        "The stock beat analyst expectations — markets price future expectations, not just current results",
        "Earnings of $1.75 are always considered excellent",
        "EPS growth of this size always exceeds inflation",
      ],
      correct: 1,
      explain: "Markets are forward-looking and priced on expectations. Beating estimates signals the business is performing better than analysts predicted — often triggering a jump even if the absolute earnings number seems modest.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Tesla in 2019 was burning through cash. Long delivery lines. Factory shutdowns.
          The income statement showed a net loss. But the balance sheet told a more complex
          story: Tesla had raised <B>$19 billion</B> in debt and equity since 2010, transforming
          that capital into Gigafactories, patents, and production capacity. The company was
          unprofitable on paper but building the physical infrastructure for eventual profitability.
        </p>
        <p>
          The balance sheet is the snapshot of what a company <I>owns</I> (assets) and what it{" "}
          <I>owes</I> (liabilities). The difference is <I>shareholder equity</I>. A company
          with $10 billion in assets and $4 billion in liabilities has $6 billion in equity —
          what belongs to shareholders after all debts are paid. Tesla&apos;s balance sheet in
          2019 showed negative equity. By 2023, it had $40 billion in shareholder equity and
          $23 billion in cash.
        </p>
      </>
    ),
    term: {
      name: "Balance Sheet",
      definition:
        "The balance sheet captures a company's financial position at a single point in time. The equation: Assets = Liabilities + Shareholder Equity. Assets include: cash, accounts receivable, inventory, property/equipment, and intangibles (patents, goodwill). Liabilities include: accounts payable, short-term debt, long-term debt. Shareholder equity (book value) = Assets − Liabilities. Key ratios: current ratio (current assets ÷ current liabilities, measures short-term solvency) and debt-to-equity (total debt ÷ shareholder equity, measures financial leverage).",
      impact:
        "The current ratio is a quick health check: above 1.5 means the company can comfortably pay short-term obligations; below 1.0 means it might struggle. In 2023, Bed Bath & Beyond had a current ratio of 0.3 — owing three times more short-term obligations than it had assets to cover. It filed for bankruptcy shortly after. The balance sheet telegraphed the failure months before the headlines arrived. WeWork's balance sheet showed $17 billion in lease liabilities against $1.3 billion in cash — a structural insolvency visible in the numbers long before the company officially collapsed.",
    },
    check: {
      q: "A company has $10 billion in assets and $4 billion in liabilities. What is the shareholder equity?",
      choices: [
        "$14 billion",
        "$4 billion",
        "$6 billion",
        "$10 billion",
      ],
      correct: 2,
      explain: "Shareholder Equity = Assets − Liabilities = $10B − $4B = $6B. This is what would be left for shareholders if the company sold everything and paid off all its debts — also called 'book value.'",
    },
  },
  {
    narrative: (
      <>
        <p>
          Amazon reported a net income of <B>$21 billion</B> in 2021. Then in 2022, it posted
          a net loss of <B>$2.7 billion</B>. Did the business collapse? No — Amazon generated{" "}
          <B>$46 billion</B> in operating cash flow that same year. The entire loss was a{" "}
          $12 billion write-down on its investment in Rivian. The actual cash the business
          generated never slowed down.
        </p>
        <p>
          Net income can be manipulated by accounting decisions — depreciation schedules, write-downs,
          one-time charges. <I>Free cash flow</I> is harder to fake. It is the actual cash that
          flowed into the company after capital expenditures. Warren Buffett calls it
          &ldquo;owner earnings&rdquo; — what a rational owner of the whole business would
          actually collect from it in a year. When net income and free cash flow diverge dramatically,
          trust the cash flow.
        </p>
      </>
    ),
    term: {
      name: "Free Cash Flow",
      definition:
        "Free Cash Flow (FCF) = Operating Cash Flow − Capital Expenditures. Operating cash flow is cash generated by the core business after working capital changes. Capital expenditures are investments in property, equipment, and infrastructure. FCF is what remains after maintaining and growing the business — the cash available for dividends, buybacks, debt repayment, or acquisitions. FCF is considered by many analysts to be a more reliable indicator of business health than net income, because it's harder to manipulate with accounting adjustments.",
      impact:
        "Apple generated $99 billion in free cash flow in fiscal 2023 — roughly $271 million per day. That cash funds the $85B annual buyback program, the $15B annual dividend, and Apple's entire R&D budget. Apple's FCF margin (FCF ÷ Revenue) is about 28% — for every $100 in iPhone, Mac, and Services revenue, $28 lands as actual cash the company can do anything with. Compare this to a retailer like Target with a 3% FCF margin. Understanding FCF tells you how much real cash a business generates versus how much it earns on paper — two very different numbers.",
    },
    check: {
      q: "Amazon reported a $2.7 billion net loss in 2022, yet generated $46 billion in operating cash flow. Which number better reflects the health of Amazon's actual business?",
      choices: [
        "Net loss of $2.7B — the company was legally unprofitable that year",
        "Operating cash flow of $46B — that's the actual cash the core business generated",
        "Neither — you need both to form a view",
        "You should average the two for a more accurate picture",
      ],
      correct: 1,
      explain: "The net loss was caused by a $12B write-down on the Rivian investment — a non-cash accounting charge that didn't reflect the business's performance. The $46B operating cash flow shows Amazon's actual operations never slowed.",
    },
  },
  {
    narrative: (
      <>
        <p>
          A company earning $10 per share with a P/E of 20 trades at $200. But should you
          care more about today&apos;s $10 earnings, or whether those earnings will be $15
          next year and $25 in three years? The P/E ratio is a snapshot. The growth rate
          is the movie.
        </p>
        <p>
          Nvidia earned <B>$1.74 per share</B> in fiscal 2023. One year later, it earned{" "}
          <B>$11.93 per share</B> — a <B>585% increase</B> in a single year, driven by
          AI chip demand. A P/E of 40 in early 2023 looked expensive; a P/E of 40 applied
          to $11.93/share made the stock look almost cheap. Revenue growth rate transforms
          how you interpret every other valuation metric. The faster a company grows, the
          more future earnings are worth today.
        </p>
      </>
    ),
    term: {
      name: "Revenue Growth Rate",
      definition:
        "Revenue growth rate = (Current Revenue − Prior Year Revenue) ÷ Prior Year Revenue × 100%. High-growth companies: >20%/year. Mature companies: 3–10%/year. Declining companies: negative. The PEG ratio (P/E ÷ Earnings Growth Rate) adjusts valuation for growth: a P/E of 40 with 40% earnings growth (PEG = 1.0) is considered fairly valued; a P/E of 40 with 10% growth (PEG = 4.0) is expensive. For early-stage companies losing money, revenue growth is often the primary valuation driver — investors pay for the trajectory.",
      impact:
        "Nvidia's revenue grew from $27 billion to $61 billion in a single fiscal year (125% growth). The market responded by pushing the stock up 230% in 2023 — pricing in the expectation that explosive growth would continue. Contrast with Coca-Cola, which grows revenue 3–5%/year with a P/E of 24 — priced for stability, not growth. Matching your valuation expectations to the company's actual growth trajectory is one of the most important analytical skills: you're not just evaluating where the company is today, you're evaluating where it's going and whether the price already reflects that journey.",
    },
    check: {
      q: "Nvidia's P/E was 40 in early 2023, seemingly expensive. By year-end, that same P/E multiple looked cheap. What changed?",
      choices: [
        "The stock price fell 40%, making the P/E lower",
        "Nvidia's earnings per share jumped 585% — the same P/E now applied to much higher earnings",
        "The S&P 500's average P/E rose to 40, making Nvidia look normal",
        "Nvidia paid a special dividend that reset the valuation",
      ],
      correct: 1,
      explain: "P/E is relative to earnings. When Nvidia's EPS jumped from $1.74 to $11.93 in one year, a P/E of 40 applied to $11.93 made the stock look inexpensive. Growth transforms how you interpret every valuation metric.",
    },
  },
];

const U3: StockUnit = {
  num: 3,
  slug: "unit-3",
  title: "Reading a Company",
  accent: "#0891b2",
  previewHook: "WeWork was valued at $47 billion. Someone read the filing. The valuation collapsed to $8 billion in 6 weeks.",
  concepts: ["Income statement", "Gross margin", "P/E ratio", "EPS"],
  hook: {
    title: "The $47 Billion Fiction",
    setup: (
      <>
        <p>
          In 2019, WeWork was the most valuable startup in America — valued at{" "}
          <strong>$47 billion</strong> by its investors. The CEO described it as a
          &ldquo;physical social network.&rdquo; The vision was beautiful. The story was
          compelling. The IPO was scheduled.
        </p>
        <p>
          Then people read the S-1 filing.
        </p>
      </>
    ),
    question: "What did the filing reveal that collapsed a $47 billion valuation in weeks?",
    reveal: {
      stat: "$2.19 spent for every $1 earned",
      statSub: "a gross margin of negative 28%",
      explanation:
        "WeWork's S-1 showed that for every dollar of revenue, they spent $2.19. Their gross margin was deeply negative — the business model was fundamentally broken at the unit level. The IPO was canceled, the valuation dropped to $8 billion, and the company eventually filed for bankruptcy in 2023. The numbers were always there. Most people just didn't know where to look.",
    },
    sandbox: <PEExplorerHook accent="#0891b2" />,
  },
  lesson: {
    title: "The Night Someone Read the Filing",
    character: "A story about the numbers hidden inside every company",
    beats: U3_BEATS,
    ctaLabel: "Analyze a Company →",
    ctaSubtitle: "Look up the P/E and gross margin for a stock you're considering buying.",
  },
  mission: {
    title: "Mission 3: Read Before You Buy",
    description:
      "Before your next trade, look at the fundamentals. The trading simulator shows you P/E ratio, EPS, and gross margin for every stock. Use them.",
    steps: [
      "Search for a stock in the trade simulator",
      "Find the P/E ratio — is it above or below 20?",
      "Find the gross margin — is it positive?",
      "Only buy if you can explain why the P/E makes sense given the growth",
    ],
    tickerSuggestion: "AAPL",
  },
  unitQuiz: [
    {
      q: "WeWork had a gross margin of negative 28%. Why couldn't it 'grow its way out' of this problem?",
      choices: [
        "Growing requires hiring, which adds overhead costs proportionally",
        "Negative gross margin means each unit of growth makes losses bigger — you lose more money on every new customer",
        "Growing requires debt that WeWork couldn't afford",
        "Investors wouldn't fund expansion for a company with negative margins",
      ],
      correct: 1,
      explain: "If every desk WeWork rented cost 28 cents more than they charged, renting more desks multiplied the losses. Gross margin is the foundation — you must make money at the product level before you can scale profitably.",
    },
    {
      q: "Apple has a P/E of 33. Netflix at its 2021 peak had a P/E of 60. What does the higher Netflix P/E represent?",
      choices: [
        "Netflix was twice as profitable as Apple per share",
        "Investors expected Netflix's earnings to grow much faster than Apple's — they paid a premium for that expected growth",
        "Netflix stock was twice as expensive in dollar terms",
        "Netflix paid a higher dividend, boosting its valuation",
      ],
      correct: 1,
      explain: "A higher P/E means investors pay more per dollar of current earnings because they expect faster earnings growth. Netflix at 60× was priced for explosive subscriber growth. When growth slowed in 2022, the P/E compressed and the stock fell 75%.",
    },
    {
      q: "Amazon had a net loss in 2022 but generated $46B in operating cash flow. Which metric better shows the health of the actual business?",
      choices: [
        "Net loss — that's the legally required bottom line",
        "Operating cash flow — the real cash the core business generated, unaffected by non-cash accounting items",
        "Neither — only revenue tells the true story",
        "You should average both to get a balanced view",
      ],
      correct: 1,
      explain: "The net loss stemmed from a $12B write-down on Rivian stock — a non-cash accounting item. Operating cash flow strips out such items, showing what the actual business generated. Cash flow is harder to fake than reported earnings.",
    },
    {
      q: "A company expected to earn $6/share this quarter earns $5.50/share — still a real profit, but less than expected. What typically happens to the stock price?",
      choices: [
        "It rises because the company is still profitable",
        "It falls because it 'missed' analyst expectations — markets price on expectations vs. reality",
        "Nothing — price only reacts to total revenue, not EPS",
        "An earnings miss automatically triggers a circuit breaker halt",
      ],
      correct: 1,
      explain: "Stocks are priced based on expected future performance. Earning $5.50 when $6 was expected is called 'missing estimates' — even though absolute earnings are real, the gap vs. expectation is what the market reacts to.",
    },
    {
      q: "Tesla's 2019 balance sheet showed negative shareholder equity, yet investors valued it at $75+ billion. What were investors actually buying?",
      choices: [
        "Tesla's current profits and cash reserves",
        "Tesla's brand recognition and Elon Musk's celebrity",
        "Expected future cash flows from Gigafactories, EV market dominance, and software revenues being built at the time",
        "The physical value of Tesla's factory equipment and inventory",
      ],
      correct: 2,
      explain: "Investors look forward. They were paying for the future business: factories under construction, an EV market expected to grow for decades, and software/energy revenues that would eventually make the balance sheet look very different.",
    },
  ],
};

// ── Unit 4: Valuing a Business ─────────────────────────────────────────────────

const U4_BEATS: StoryBeat[] = [
  {
    narrative: (
      <>
        <p>
          In 1962, Warren Buffett was furious. He&apos;d been slowly buying shares of Berkshire
          Hathaway, a struggling New England textile company, intending to tender them back to
          the company at a profit. When the CEO offered him $11.375 per share, then sent a
          written offer for $11.25 — an eighth of a dollar less — Buffett was insulted. He
          bought enough shares to take control and fire the CEO.
        </p>
        <p>
          He later called it his <B>&ldquo;$200 billion mistake.&rdquo;</B> Not because
          Berkshire failed — he turned it into the greatest investment vehicle in history.
          But because he spent 20 years managing a dying textile business when he could
          have allocated that capital to better companies. The lesson he extracted changed
          investing forever: price matters less than the quality of what you&apos;re buying.
        </p>
      </>
    ),
    term: {
      name: "Intrinsic Value",
      definition:
        "Intrinsic value is what a business is actually worth — not what the market is currently paying for it, but the present value of all the cash it will generate over its lifetime. The stock price is the market's opinion of that value at this moment. Those two numbers are often very different. Buffett's core skill is estimating intrinsic value and waiting for the market to offer a price below it.",
      impact:
        "When Buffett bought Berkshire at $7–$8/share in 1962, the company had net assets worth $16/share. He was buying $1 of assets for $0.50 — classic value investing. The problem: the business itself was worth much less than its assets because it was structurally in decline. Intrinsic value must account for future earnings, not just current assets.",
    },
    check: {
      q: "Buffett bought Berkshire below its book value of assets. Why did he call it his '$200 billion mistake'?",
      choices: [
        "He overpaid for the assets relative to what they were actually worth",
        "The business was declining — its future cash flows were worth far less than its asset value, and he wasted 20 years on a bad business",
        "He should have bought more shares to gain control sooner",
        "The stock price never recovered from his purchase price",
      ],
      correct: 1,
      explain: "Intrinsic value depends on future earnings, not just current assets. Berkshire was a declining textile business — those assets couldn't generate enough cash to justify their book value. He learned: buy great businesses, not just cheap ones.",
    },
  },
  {
    narrative: (
      <>
        <p>
          How do you calculate what a business is worth? The theoretically correct answer is:
          figure out all the cash the business will generate over its entire lifetime, then
          discount each year&apos;s cash back to today&apos;s value (because $100 ten years
          from now is worth less than $100 today).
        </p>
        <p>
          This is called <I>discounted cash flow</I> (DCF). It sounds technical, but the
          intuition is simple: a business that generates <B>$100 million per year</B> reliably
          forever is worth roughly <B>$1–$2 billion</B> today (depending on interest rates and
          growth). The higher the discount rate, the less future cash is worth now.
        </p>
      </>
    ),
    term: {
      name: "Discounted Cash Flow (DCF)",
      definition:
        "DCF is a method of valuing a business by estimating its future free cash flows and discounting them back to the present at a 'discount rate' (often 8–12%). The discount rate reflects risk and opportunity cost — what else could you do with this money? A DCF answers: 'if I owned this entire business and collected all its future cash, what would that be worth today?' The stock price should, in theory, equal this number divided by shares outstanding.",
      impact:
        "DCF explains why low-interest-rate environments inflate stock prices: when rates are low, future cash is discounted less, so stocks are worth more 'on paper.' When the Fed raises rates rapidly (as in 2022), high-P/E growth stocks fall hardest — their value depends more on distant future cash flows, which are discounted most severely.",
    },
    check: {
      q: "In a DCF analysis, why is $100 expected 10 years from now worth less than $100 today?",
      choices: [
        "Inflation makes everything more expensive over time, so future cash is worth more",
        "Money today can be invested and grow — so a dollar now is worth more than a dollar in the future",
        "Future cash flows are uncertain and might not materialize as expected",
        "Both B and C are true — opportunity cost AND uncertainty both explain discounting",
      ],
      correct: 3,
      explain: "Both reasons apply: money today can earn returns (opportunity cost), AND future cash is uncertain. The discount rate in a DCF accounts for both — which is why higher interest rates or higher uncertainty both shrink the present value of future cash.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Here&apos;s the problem with precise valuation: you&apos;re predicting the future.
          Your assumptions about growth rate, profit margin, and discount rate might all be
          slightly wrong. Compound those small errors over 10 years and your intrinsic value
          estimate could be 50% off.
        </p>
        <p>
          Buffett&apos;s solution: only buy when you have a <I>margin of safety</I>. If you
          believe a company is worth $100/share, only buy at $70 or less. That 30% discount
          gives you room to be wrong about the assumptions. The margin of safety is the bridge
          between smart analysis and unavoidable uncertainty.
        </p>
      </>
    ),
    term: {
      name: "Margin of Safety",
      definition:
        "Coined by Benjamin Graham (Buffett's mentor) in 'The Intelligent Investor,' the margin of safety is the discount between a stock's current price and its estimated intrinsic value. If you calculate a company is worth $100/share and buy at $65, your margin of safety is 35%. This buffer absorbs errors in your analysis and provides downside protection. The larger the margin of safety, the less precisely you need to be right.",
      impact:
        "During the 2009 financial crisis, Goldman Sachs sold at $60/share — below the liquidation value of its assets. Buffett's margin of safety framework said: even if I'm wrong about future earnings, I'm buying assets for less than they're worth. He invested $5 billion in Goldman preferred stock at the depth of the crisis. By 2011, the position was worth $7 billion.",
    },
    check: {
      q: "You estimate a stock is worth $100 per share. Applying a margin of safety, what price would Buffett typically try to buy at?",
      choices: [
        "$100 or lower — any price at or below intrinsic value",
        "$70 or lower — a 30% discount gives room to be wrong on assumptions",
        "$110 or lower — paying a slight premium for quality",
        "Exactly $85 — the standard margin of safety is always 15%",
      ],
      correct: 1,
      explain: "The margin of safety is a significant discount to your estimated intrinsic value — often 25-30% or more. Buying at $70 when you estimated $100 means you can be meaningfully wrong and still avoid a permanent loss.",
    },
  },
  {
    narrative: (
      <>
        <p>
          There are two fundamental approaches to stock investing: <I>value</I> and{" "}
          <I>growth</I>. Value investors look for companies trading below their intrinsic value
          — stocks the market is ignoring or misunderstanding. Growth investors look for
          companies expanding rapidly, willing to pay a premium for that growth.
        </p>
        <p>
          Neither is universally superior. In the 2010s, growth stocks crushed value stocks
          for nearly a decade. From 2021–2023, value stocks outperformed sharply as interest
          rates rose and compressed the value of future growth. The best investors understand
          both frameworks — and know which environment favors which approach.
        </p>
      </>
    ),
    term: {
      name: "Growth vs. Value Investing",
      definition:
        "Growth investing: buying companies with rapidly expanding revenues and earnings, often at high P/E ratios, betting the growth justifies the premium. Examples: Nvidia (P/E ~40), Amazon in 2005. Value investing: buying companies trading below their calculated intrinsic value, often at low P/E ratios, with a margin of safety. Examples: Berkshire Hathaway, most financial stocks in 2009. Neither works all the time — understanding which to apply when is a key skill.",
      impact:
        "Buffett blended both. He started as a pure value investor (buying cheap, ugly businesses), then evolved under Charlie Munger's influence to pay 'fair prices for wonderful businesses.' His best investments — Apple, Coca-Cola, American Express — were 'growth at a reasonable price': great businesses bought when the market temporarily mispriced them.",
    },
    check: {
      q: "Which investing style typically performs better when interest rates are rising quickly?",
      choices: [
        "Growth investing — companies grow faster when rates are high",
        "Value investing — current earnings matter more when future earnings are discounted heavily",
        "Both perform equally regardless of interest rates",
        "Momentum investing always outperforms in rate hike cycles",
      ],
      correct: 1,
      explain: "Rising rates reduce the present value of future earnings — hurting growth stocks most (their value depends heavily on distant future cash flows). Value stocks with solid current earnings are comparatively less affected.",
    },
  },
  {
    narrative: (
      <>
        <p>
          In March 2009, Bank of America stock was trading at <B>$3.17/share</B>. Its book
          value — the accounting value of all assets minus all liabilities divided by shares
          outstanding — was approximately <B>$21/share</B>. Investors were buying a $21 book
          for $3. Either the book value was a lie (the assets were worth less than stated), or
          the stock was dramatically undervalued. Both possibilities existed simultaneously.
        </p>
        <p>
          For financial companies — banks, insurance firms, investment managers — book value is
          one of the most meaningful valuation metrics because their assets (loans, securities,
          cash) are relatively liquid and precisely measured. Price-to-Book below 1 means the
          market thinks the company is worth less than its accounting asset value. Buffett bought
          bank stocks at P/B of 0.15 in the 2009 crisis. By 2021, Bank of America was at $48 —
          a <B>15× return</B>.
        </p>
      </>
    ),
    term: {
      name: "Price-to-Book (P/B) Ratio",
      definition:
        "P/B = Stock Price ÷ Book Value Per Share. Book value = total assets − total liabilities (shareholder equity). P/B < 1 means the market values the company below its accounting net worth — rare and potentially a buying opportunity (or a signal the assets are impaired). P/B > 1 means it's trading at a premium, meaning the market assigns value to earnings power or brand beyond just the balance sheet assets. Technology companies have very high P/B (Apple: ~50×) because their most valuable assets — brand, software, talent — don't appear on the balance sheet. Banks and financial companies are best valued using P/B.",
      impact:
        "Warren Buffett used P/B as his primary filter for decades, only buying when price was a significant discount to book — his 'margin of safety' made concrete. Bank of America at $3/share with $21 book value (P/B = 0.14) in 2009 was his definition of a gift. By 2021, BofA traded at $48 — a 15× return in 12 years. He still holds it today as one of Berkshire's largest positions. P/B fails for software companies where the most valuable things are algorithms and reputation — but it's the right lens for asset-heavy businesses whose balance sheets reflect real economic value.",
    },
    check: {
      q: "Bank of America had a P/B ratio of 0.14 in 2009. What does a P/B below 1 mean?",
      choices: [
        "The company is growing too fast to be valued accurately by its assets",
        "The market values the company below its accounting net worth — you're paying less than book value",
        "The company is highly profitable relative to its size",
        "The bank has no significant debt on its balance sheet",
      ],
      correct: 1,
      explain: "P/B < 1 means you're paying less than what the company's books say it's worth (assets minus liabilities). It can signal undervaluation — or that the market doubts those assets are worth what the books claim.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Spotify has never consistently made a profit, yet investors valued it at nearly{" "}
          <B>$80 billion</B> in 2021. How do you value a company that doesn&apos;t earn money?
          You look at what the business would be worth once it achieves normal profitability.
          The most common shortcut: Price-to-Sales (P/S) — what multiple of annual revenue
          are investors willing to pay?
        </p>
        <p>
          In 2021, Spotify traded at <B>9× revenue</B>. When interest rates rose in 2022
          and investors became less willing to pay for future profits, that multiple compressed
          to <B>2×</B>. Revenue barely changed. The business barely changed. But the willingness
          to pay a premium for future profits collapsed — and the stock fell <B>75%</B>. This
          is the hidden risk of high P/S stocks: the multiple, not the business, can destroy you.
        </p>
      </>
    ),
    term: {
      name: "Price-to-Sales (P/S) Ratio",
      definition:
        "P/S = Market Cap ÷ Annual Revenue (or Stock Price ÷ Revenue Per Share). Used to value companies without profits, or to compare companies within the same industry. P/S varies enormously by sector: software companies (high margins, recurring revenue) might trade at 10–30× sales. Grocery chains (thin margins, commodity product) trade at 0.3–0.5× sales. A high P/S is only justified if the company is expected to achieve high profit margins eventually. P/S can persist at high levels for years if growth justifies it — then collapse suddenly when growth slows or rates rise.",
      impact:
        "At the 2021 peak, Palantir traded at 40× revenue. Snowflake traded at 100× revenue. These multiples assumed near-perfect execution and accelerating growth indefinitely. When growth slowed slightly in 2022 and rates rose, both stocks fell 70–80% while their revenues actually kept growing. P/S compressed from 40× to 8×. The businesses were still alive and growing — the willingness to pay for future profits simply reset. High P/S stocks require you to hold through multiple compression risk: even if the business succeeds, the stock can fall if investors stop paying premium multiples.",
    },
    check: {
      q: "Spotify's P/S multiple compressed from 9× to 2× even though revenue barely changed. What caused the compression?",
      choices: [
        "Spotify launched too many new features that confused investors",
        "Investors became less willing to pay a premium for future profits when interest rates rose in 2022",
        "Spotify lost most of its users to Apple Music",
        "The streaming industry was declared a regulated monopoly",
      ],
      correct: 1,
      explain: "P/S multiples reflect investor willingness to pay for expected future profits. When rates rise, investors want faster payback — they stop paying 9× sales for profits that are years away. The business barely changed; the willingness to pay for it collapsed.",
    },
  },
  {
    narrative: (
      <>
        <p>
          When Microsoft paid <B>$26 billion</B> to acquire LinkedIn in 2016, LinkedIn&apos;s
          market cap before the deal was $11 billion. Why did Microsoft pay more than twice
          the market cap? Because market cap misses the full picture. LinkedIn had{" "}
          <B>$1.2 billion in debt</B> and <B>$3.7 billion in cash</B>. Adjusting for those:
          the enterprise value was $11B market cap + $1.2B debt − $3.7B cash = <B>$8.5B</B>.
          Microsoft paid a 206% premium over enterprise value, not just over market cap.
        </p>
        <p>
          <I>Enterprise value</I> (EV) is the complete version of &ldquo;what would it actually
          cost to buy this entire company?&rdquo; Market cap only counts the equity. EV adds debt
          and subtracts cash — because an acquirer inherits both. When analysts say a company is
          &ldquo;trading at 12× EBITDA,&rdquo; they mean EV divided by EBITDA — the professional
          standard for M&amp;A valuations.
        </p>
      </>
    ),
    term: {
      name: "Enterprise Value (EV)",
      definition:
        "EV = Market Cap + Total Debt − Cash & Equivalents. It represents the theoretical total cost to acquire a business — you pay market cap for the equity, assume the debt, and pocket the cash. EV/EBITDA (Enterprise Value ÷ Earnings Before Interest, Taxes, Depreciation, and Amortization) is the preferred valuation multiple for mergers and acquisitions because it allows comparison across companies with different capital structures and tax situations. Low EV/EBITDA (<10×) suggests potential value; high (>25×) suggests premium pricing. EV prevents the mistake of comparing market caps when debt loads differ dramatically.",
      impact:
        "When Elon Musk acquired Twitter for $44 billion in 2022, Twitter's market cap before the deal was about $36 billion. The extra $8 billion went to pay off Twitter's existing debt — which Musk assumed as part of the acquisition. Enterprise value gave the cleaner picture of the total cost. Understanding EV vs. market cap prevents the common investing error of thinking you're buying a company 'cheaply' based on share price or market cap when the debt load tells a completely different story about the total obligation you're taking on.",
    },
    check: {
      q: "Company X has a market cap of $10B, $2B in debt, and $1B in cash. What is its enterprise value?",
      choices: [
        "$10 billion",
        "$11 billion",
        "$9 billion",
        "$13 billion",
      ],
      correct: 1,
      explain: "EV = Market Cap + Debt − Cash = $10B + $2B − $1B = $11B. Enterprise value is the true acquisition cost — you pay market cap for the equity, inherit the debt, and keep the cash.",
    },
  },
];

const U4: StockUnit = {
  num: 4,
  slug: "unit-4",
  title: "Valuing a Business",
  accent: "#16a34a",
  previewHook: "Warren Buffett called buying Berkshire his '$200 billion mistake.' He still built the greatest investing track record in history.",
  concepts: ["Intrinsic value", "DCF basics", "Margin of safety", "Growth vs. value"],
  hook: {
    title: "The $200 Billion Grudge Trade",
    setup: (
      <>
        <p>
          In 1962, Warren Buffett bought a dying textile company out of spite because its CEO
          lowballed him by $0.125 per share. He gained control. He fired the CEO. He later called
          this his <strong>&ldquo;$200 billion mistake&rdquo;</strong> — not because the
          investment failed, but because he wasted 20 years managing a bad business when he
          should have been buying great ones.
        </p>
      </>
    ),
    question: "What's the single most important thing to know before buying any stock?",
    reveal: {
      stat: "What is it actually worth?",
      statSub: "price vs. intrinsic value — the foundation of all investing",
      explanation:
        "The stock price is what the market says a company is worth right now. Intrinsic value is what the business is actually worth based on its future cash flows. The entire game of investing is identifying when these two numbers diverge — and acting on that gap. Buffett turned Berkshire into a $700 billion conglomerate not by trading stocks, but by finding businesses where the price was below the value.",
    },
  },
  lesson: {
    title: "What's It Actually Worth?",
    character: "A story about the gap between price and value — and how Buffett learned the difference",
    beats: U4_BEATS,
    ctaLabel: "Find a Bargain →",
    ctaSubtitle: "Look for stocks trading near their 52-week low. Are they cheap for a reason, or overlooked?",
  },
  mission: {
    title: "Mission 4: Find a Stock You'd Pay Full Price For",
    description:
      "Look up 5 different stocks in the simulator. For each one, ask: would I pay the current price for this company's future earnings? Only buy the one you'd pay full price for.",
    steps: [
      "Check the 52-week high and low for several stocks",
      "Look at P/E — is the company expensive relative to its earnings?",
      "Find one stock where the fundamentals justify the price",
      "Buy it and note your reasoning — you'll revisit this in Unit 8",
    ],
  },
  unitQuiz: [
    {
      q: "Buffett estimates a stock is worth $100 but only buys at $65. The $35 gap is called the margin of safety. Why is this buffer important?",
      choices: [
        "It guarantees a 35% profit on every investment",
        "It gives you room to be wrong about your assumptions — your analysis might be off and you still won't lose money",
        "It's the standard discount the SEC requires for value investors",
        "It ensures you always buy at the stock's 52-week low",
      ],
      correct: 1,
      explain: "Valuation involves predicting the future, which is inherently uncertain. A margin of safety means your estimate can be significantly wrong and you still avoid a permanent loss — it's insurance against your own errors.",
    },
    {
      q: "In a DCF analysis, the Fed raises interest rates from 2% to 6%. What happens to the calculated intrinsic value of a growth stock?",
      choices: [
        "It increases, because higher rates signal a stronger economy",
        "It decreases, because future cash flows are discounted more heavily at higher rates",
        "It stays the same — DCF only uses the company's own cost of capital",
        "It doubles, because investors demand higher returns from all assets",
      ],
      correct: 1,
      explain: "Higher discount rates shrink the present value of future cash flows. Growth stocks derive most of their value from earnings far in the future — so they're hit hardest when rates rise. This explains why the 2022 rate hikes crushed high-P/E stocks.",
    },
    {
      q: "Bank of America traded at P/B of 0.14 in 2009 and rose 15× by 2021. What was the core investment thesis?",
      choices: [
        "Bank of America would go bankrupt and be acquired at a premium",
        "The market was pricing the bank far below its actual net asset value — that discount would close as conditions normalized",
        "Rising interest rates in the 2010s would make bank stocks more valuable",
        "Bank of America would start paying very high special dividends",
      ],
      correct: 1,
      explain: "A P/B of 0.14 means paying 14 cents per dollar of net assets. The thesis: BofA had real assets worth more than $3/share, and the crisis-era pessimism was temporary. Patient investors who recognized this 6× below book value saw 15× returns.",
    },
    {
      q: "Why is P/S ratio used to value companies like early Spotify that have no earnings?",
      choices: [
        "Sales are always more reliable than earnings as a business signal",
        "When earnings are negative, P/E can't be calculated — P/S at least measures what you pay relative to revenue",
        "The SEC requires P/S valuation for companies without profits",
        "P/S is always lower than P/E, making stocks appear cheaper",
      ],
      correct: 1,
      explain: "You can't calculate a P/E for a money-losing company — dividing by negative earnings gives a nonsensical number. P/S compares market cap to revenue, remaining meaningful even when a company is unprofitable.",
    },
    {
      q: "Elon Musk paid $44B for Twitter when its market cap was $36B. Enterprise value explains the gap. What is enterprise value?",
      choices: [
        "Market cap plus the CEO's personal net worth",
        "Market Cap + Debt − Cash — the total cost to actually acquire a business, including inherited obligations",
        "Market cap minus the company's annual revenue",
        "The fair value as determined by investment banks in an IPO",
      ],
      correct: 1,
      explain: "EV = Market Cap + Debt − Cash. Musk paid $36B for Twitter's equity, then inherited $8B in Twitter's existing debt — totaling $44B. Enterprise value gives the true acquisition cost that market cap alone conceals.",
    },
  ],
};

// ── Unit 5: Building a Portfolio ───────────────────────────────────────────────

const U5_BEATS: StoryBeat[] = [
  {
    narrative: (
      <>
        <p>
          In 1952, a 25-year-old PhD student named Harry Markowitz published a 14-page paper
          in the Journal of Finance that would win him a Nobel Prize 38 years later. His
          insight was mathematical but the implication was revolutionary: <I>you can combine
          individually risky assets to create a portfolio that is less risky than any single
          asset in it.</I>
        </p>
        <p>
          His advisor, economist Milton Friedman, told him the paper &ldquo;wasn&apos;t
          economics.&rdquo; It is now the foundation of how every pension fund, endowment, and
          institutional investor on Earth allocates capital. The math he proved is why you
          should never put everything in one stock — no matter how good the story.
        </p>
      </>
    ),
    term: {
      name: "Modern Portfolio Theory (MPT)",
      definition:
        "MPT, developed by Markowitz, shows that a portfolio's risk isn't simply the average of its components' risks — it depends on how those components move relative to each other. By combining assets that don't move in perfect sync (called imperfect correlation), you can reduce overall portfolio volatility without sacrificing expected return. The 'efficient frontier' is the set of portfolios that maximize return for a given level of risk.",
      impact:
        "MPT is why a portfolio of 20–30 stocks is dramatically less volatile than any single stock, even if each stock is individually risky. The benefits of diversification plateau around 20–25 stocks — adding a 50th stock doesn't reduce risk much further. This is why the S&P 500 (500 stocks) isn't that much less risky than the S&P 100.",
    },
    check: {
      q: "Harry Markowitz proved combining risky assets can reduce overall portfolio risk. What makes this possible?",
      choices: [
        "All stocks have low individual risk when examined closely",
        "When assets don't move in perfect lockstep, losses in one are partially offset by stability in another",
        "Diversification completely eliminates all investment risk",
        "Owning more stocks always means earning a higher return",
      ],
      correct: 1,
      explain: "Markowitz proved it's the correlation between assets — not just their individual risks — that determines portfolio risk. When assets don't move perfectly together, losses in one are partially offset by stability or gains in another. This is why a mix of imperfectly correlated assets can be less risky than any single one.",
    },
  },
  {
    narrative: (
      <>
        <p>
          The key to why diversification works is <I>correlation</I>. When two stocks move
          in perfect lockstep (correlation = +1), owning both gives you no diversification
          benefit. When two stocks move in perfectly opposite directions (correlation = -1),
          combining them eliminates risk entirely. Real-world stocks fall somewhere in between.
        </p>
        <p>
          Airlines and oil companies are a useful example. High oil prices hurt airlines (more
          fuel costs) but benefit oil companies. Their correlation is negative. Own both, and
          your portfolio is buffered from oil price swings either way. This is why sector
          diversification matters — tech stocks often move together, as do bank stocks.
        </p>
      </>
    ),
    term: {
      name: "Correlation",
      definition:
        "Correlation measures how two assets move relative to each other, on a scale from -1 to +1. A correlation of +1 means they move in perfect lockstep. A correlation of 0 means they move independently. A correlation of -1 means when one rises, the other falls. For portfolio construction, you want assets with low or negative correlation to each other. In 2008, gold and bonds were negatively correlated with stocks — portfolios with both fell far less than all-stock portfolios.",
      impact:
        "During COVID in March 2020, almost every stock fell simultaneously — correlations spiked toward +1 because the shock affected everything. Even 'diversified' portfolios lost 30–35%. This is called correlation breakdown: the moment you most need diversification, it often works least. This is why true diversification includes assets like bonds, commodities, and international stocks, not just different tech stocks.",
    },
    check: {
      q: "If two stocks have a correlation of +1, what does that mean for diversification?",
      choices: [
        "They cancel each other's risk perfectly — ideal for a portfolio",
        "They move in opposite directions, so one always offsets the other",
        "They move in perfect lockstep — owning both gives you no diversification benefit",
        "One stock is risky and the other is safe",
      ],
      correct: 2,
      explain: "Correlation of +1 means both assets move identically. In a crash, they'd fall by the same amount at the same time. For real diversification, you want low or negative correlation — assets that don't move in the same direction together. Bonds and stocks, for example, often move in opposite directions.",
    },
  },
  {
    narrative: (
      <>
        <p>
          <I>Beta</I> measures how much a stock tends to move relative to the broader market.
          A stock with beta = 1.5 typically rises 15% when the S&P 500 rises 10%, and falls
          15% when it falls 10%. A utility company with beta = 0.5 barely moves relative to
          the market.
        </p>
        <p>
          High-beta stocks (usually tech, biotech, small caps) amplify market moves in both
          directions. Low-beta stocks (utilities, consumer staples, healthcare) dampen them.
          A portfolio of all high-beta stocks will soar in bull markets and crater in crashes.
          A portfolio balanced between high and low beta gives you smoother returns.
        </p>
      </>
    ),
    term: {
      name: "Beta",
      definition:
        "Beta measures a stock's sensitivity to market movements. Beta = 1: moves with the market. Beta > 1: more volatile than the market (amplifies moves). Beta < 1: less volatile than the market. Beta < 0: tends to move opposite the market (rare). Beta is calculated by regressing a stock's historical returns against the market's returns. It's backward-looking — past beta doesn't guarantee future beta — but it's a useful baseline.",
      impact:
        "Nvidia (NVDA) has a beta of about 1.8. In 2022, when the S&P 500 fell 19%, Nvidia fell about 50%. In 2023, when the S&P 500 gained 26%, Nvidia gained over 200%. High beta amplifies everything. Johnson & Johnson (JNJ) has a beta of 0.5 — when markets crashed in 2020, JNJ fell only 13% vs. the market's 34%. Lower return potential, but a dramatically smoother ride.",
    },
    check: {
      q: "A stock has a beta of 1.8. If the S&P 500 drops 10%, what would you typically expect?",
      choices: [
        "The stock drops about 5% — high-beta stocks are somewhat cushioned",
        "The stock drops about 10% — beta stocks always match the market exactly",
        "The stock drops about 18% — beta amplifies market moves in both directions",
        "The stock doesn't change — beta only measures upside potential",
      ],
      correct: 2,
      explain: "Beta measures how much a stock amplifies market moves. A beta of 1.8 means the stock typically moves 1.8× what the market does. So a 10% market drop becomes roughly an 18% drop for a high-beta stock. This is exactly why Nvidia (beta ~1.8) fell 50% when the S&P 500 fell only 19% in 2022.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Your portfolio should own companies across different <I>sectors</I> of the economy —
          technology, healthcare, consumer goods, financials, energy, industrials, real estate,
          utilities. Sectors respond differently to economic conditions.
        </p>
        <p>
          When the economy is booming, cyclical sectors (tech, industrials, consumer discretionary)
          outperform. When the economy slows, defensive sectors (utilities, healthcare, consumer
          staples) hold up better. An all-tech portfolio doubles in bull markets and gets cut in
          half in recessions. Sector balance smooths the ride.
        </p>
      </>
    ),
    term: {
      name: "Sector Diversification",
      definition:
        "The S&P 500 is divided into 11 sectors: Information Technology, Healthcare, Financials, Consumer Discretionary, Communication Services, Industrials, Consumer Staples, Energy, Real Estate, Materials, and Utilities. Each sector tends to perform differently across economic cycles. Technology stocks often lead in growth phases. Utilities and staples hold up in recessions. Energy rises with commodity prices. A diversified portfolio includes exposure to multiple sectors.",
      impact:
        "In 2022, the energy sector gained 59% while the technology sector fell 28% — a 87 percentage point spread. Investors holding only tech lost nearly 30% while the overall S&P 500 fell about 19%. Energy exposure was the difference. In 2023, the reverse happened — tech soared while energy was flat. Sector rotation is unpredictable; owning several sectors smooths the volatility.",
    },
    check: {
      q: "In 2022, energy stocks gained 59% while tech fell 28%. What does this show about sector diversification?",
      choices: [
        "Investors should always put everything into energy, since it outperformed",
        "Different sectors move differently — owning multiple sectors reduces the damage from any single sector crashing",
        "Tech stocks are too volatile for most individual investors to own",
        "The best approach is to predict which sector wins each year and concentrate there",
      ],
      correct: 1,
      explain: "Sectors respond differently to economic conditions. Energy thrived in 2022's high-inflation environment while tech suffered from rising interest rates. When you own multiple sectors, a crash in one doesn't wipe out your whole portfolio. The S&P 500 fell only 19% partly because energy gains partially offset tech losses.",
    },
  },
  {
    narrative: (
      <>
        <p>
          In 1997, a technology analyst recommended investors put <B>5%</B> of their portfolio
          into a fast-growing new company called Amazon — not 30%, not everything, but 5%.
          Even if you&apos;re completely right about a company&apos;s future, the amount you
          allocate determines whether that conviction makes you rich or just modestly comfortable.
        </p>
        <p>
          Professional portfolio managers call this <I>position sizing</I>: the deliberate
          decision of how much capital to allocate to each holding. A common rule for individual
          investors: no single stock should exceed <B>5–10%</B> of your portfolio. Too small a
          position and even a 10-bagger barely moves the needle. Too large, and one bad call
          can erase years of progress. The right size connects your conviction level to the
          amount of risk you&apos;re willing to accept on that thesis.
        </p>
      </>
    ),
    term: {
      name: "Position Sizing",
      definition:
        "Position sizing is the process of deciding how much capital to allocate to each investment. Common approaches: equal-weight (same dollar amount in every holding), conviction-weighted (larger positions in highest-conviction ideas), or risk-weighted (smaller positions in more volatile or uncertain names). The Kelly Criterion is a mathematical formula for optimal position size: invest a fraction of your bankroll proportional to your edge over the odds. In practice, most professionals use half-Kelly or less — real-world uncertainty always exceeds model assumptions. A 25-position portfolio means no single disaster can destroy more than 4% of your total capital.",
      impact:
        "Stan Druckenmiller — one of the best hedge fund managers in history — made his career through concentrated positions (sometimes 30–40% in one trade), but backed those positions with extraordinary research and strict risk management. For most investors without that infrastructure, concentration is risk without the analytical edge to justify it. A 2015 study found retail investors with fewer than 5 stocks earned significantly lower risk-adjusted returns than those with 15–25 stocks — not because diversification produces better picks, but because it prevents any single mistake from being catastrophic.",
    },
    check: {
      q: "Why do most financial advisors recommend keeping each individual stock below 5–10% of your portfolio?",
      choices: [
        "Regulators require it — brokers must limit position sizes by law",
        "Smaller positions always produce higher returns over time",
        "If any single holding loses everything, the damage to your total portfolio stays survivable",
        "Tax rules require spreading investments across many different stocks",
      ],
      correct: 2,
      explain: "Position sizing is about managing the worst case. If your biggest position is 5% and goes to zero, you lose 5% — painful but survivable. If it's 50% and goes to zero, it's catastrophic. Keeping any one position small prevents a single bad decision from derailing your entire financial plan.",
    },
  },
  {
    narrative: (
      <>
        <p>
          In 1986, two researchers published a landmark study analyzing 91 large pension funds
          over a decade. Their finding was striking: <B>93.6%</B> of the variation in fund
          returns was explained by just one variable — not stock picking, not market timing,
          not manager skill, but <I>asset allocation</I>: the strategic split between stocks,
          bonds, and cash. The single most important investment decision most people ever make
          is also the one they rarely think consciously about.
        </p>
        <p>
          A classic rule of thumb: subtract your age from 110 — that&apos;s your percentage in
          stocks, the rest in bonds. A 25-year-old: 85% stocks, 15% bonds. A 65-year-old:
          45% stocks, 55% bonds. The logic: younger investors can afford to wait out crashes;
          retirees drawing income from their portfolio cannot absorb a 50% decline.
        </p>
      </>
    ),
    term: {
      name: "Asset Allocation",
      definition:
        "Asset allocation is the strategic decision of how to divide a portfolio among broad asset classes: stocks (high growth, high volatility), bonds (lower returns, lower volatility, income), cash (no growth, no volatility, full liquidity), and alternatives (real estate, commodities, private equity). Each class behaves differently across economic cycles. Stocks grow wealth over long periods but crash in recessions. Bonds provide stability and income. The right mix depends on time horizon (how long until you need the money), income needs (are you drawing from the portfolio or adding to it?), and risk tolerance.",
      impact:
        "During the 2008 financial crisis, a portfolio of 100% stocks fell 51% peak-to-trough. A 60/40 portfolio (60% stocks, 40% bonds) fell only 33%, then recovered faster. A 40/60 portfolio fell just 21%. The asset allocation difference meant the difference between panic-selling at the bottom (the 100% stock investor) and staying calm (the conservative investor). The Brinson, Hood, and Beebower paper's conclusion has held for 40 years: the single most important portfolio decision isn't which stocks you pick — it's what percentage is in stocks at all.",
    },
    check: {
      q: "Research found one factor explained 93.6% of the difference in pension fund returns. What was it?",
      choices: [
        "Which specific stocks the fund managers selected",
        "How well the managers predicted short-term market moves",
        "The strategic split between stocks, bonds, and cash — the asset allocation",
        "The educational background and experience of the fund manager",
      ],
      correct: 2,
      explain: "The Brinson, Hood, and Beebower study found that asset allocation — the decision of how much to put in stocks vs. bonds vs. cash — explained over 93% of the variation in returns between funds. Individual stock picks and market timing mattered far less than most people assume. Getting the mix right is the most important investment decision you'll make.",
    },
  },
  {
    narrative: (
      <>
        <p>
          In January 2021, imagine a 60/40 portfolio that hadn&apos;t been touched in two
          years. Tech stocks had soared. The equity side had silently grown from 60% to 72%
          of the portfolio. Every instinct says: &ldquo;why sell what&apos;s winning?&rdquo;
          But discipline says: sell enough tech to restore the 60/40 target.
        </p>
        <p>
          The investors who rebalanced in early 2021 — mechanically trimming tech and buying
          bonds — were significantly less exposed when tech fell <B>30–70%</B> in 2022.
          They had still participated in the 2021 rally (they still owned tech, just less).
          Rebalancing isn&apos;t about predicting which way the market will move. It&apos;s
          about systematically selling high and buying low — automatically, without needing to
          know the future.
        </p>
      </>
    ),
    term: {
      name: "Rebalancing",
      definition:
        "Rebalancing is restoring a portfolio to its target asset allocation by selling overweighted assets and buying underweighted ones. If your target is 60% stocks / 40% bonds, and a bull market pushes you to 75% stocks, rebalancing means selling stocks and buying bonds to return to 60/40. Rebalancing frequency options: calendar-based (quarterly or annually) or threshold-based (whenever any asset class drifts more than 5%). Tax implications: rebalancing in a taxable account triggers capital gains; rebalancing inside a 401(k) or IRA is tax-free — a major reason to maximize tax-advantaged accounts.",
      impact:
        "Vanguard's research shows disciplined annual rebalancing adds about 0.4% per year in returns versus letting the portfolio drift — not through timing, but through systematic buy-low/sell-high behavior. In the 2017–2021 tech run, investors who didn't rebalance watched tech grow to 40–50% of their portfolios. In 2022, those unbalanced portfolios fell 25–30%. Rebalancers who had trimmed tech entered 2022 at normal weights and fell only 15–20%. The 0.4% annual advantage from rebalancing compounds to a 13% total advantage over 30 years — from nothing but discipline.",
    },
    check: {
      q: "What does disciplined portfolio rebalancing automatically accomplish over time?",
      choices: [
        "It helps predict which stocks will rise next by analyzing recent performance trends",
        "It systematically sells what has grown expensive and buys what has cheapened, restoring your target allocation",
        "It moves all your money to cash before market crashes to protect your gains",
        "It eliminates capital gains taxes on your profitable investments",
      ],
      correct: 1,
      explain: "Rebalancing restores your target allocation by selling overweighted assets (which have grown) and buying underweighted ones (which have fallen). This enforces buy-low/sell-high behavior automatically, without requiring you to predict the market. Vanguard found this discipline adds about 0.4% per year — compounding to 13% extra over 30 years.",
    },
  },
];

const U5: StockUnit = {
  num: 5,
  slug: "unit-5",
  title: "Building a Portfolio",
  accent: "#ea580c",
  previewHook: "A Nobel Prize was awarded for proving that combining risky assets can make you safer. Wall Street laughed. Then they built everything on it.",
  concepts: ["Modern Portfolio Theory", "Correlation", "Diversification", "Beta"],
  hook: {
    title: "The Paper That Changed Everything",
    setup: (
      <>
        <p>
          In 1952, a PhD student published a 14-page paper that his own advisor called
          &ldquo;not economics.&rdquo; It proved mathematically that you could combine two
          individually risky assets into a portfolio <strong>less risky than either one alone</strong>.
        </p>
        <p>
          He won the Nobel Prize in 1990. Every pension fund on Earth now runs on his math.
        </p>
      </>
    ),
    question: "How can two risky stocks together be safer than one safe stock alone?",
    reveal: {
      stat: "Correlation",
      statSub: "when assets don't move together, combining them reduces risk",
      explanation:
        "If Stock A rises when Stock B falls and vice versa, owning both means your portfolio barely moves. Airlines suffer when oil prices rise; oil companies profit. Own both, and you're buffered from oil price swings. The math proves that portfolio risk isn't the average of each holding's risk — it's determined by how they move relative to each other.",
    },
    sandbox: <CorrelationDemoHook accent="#ea580c" />,
  },
  lesson: {
    title: "The Math That Won a Nobel Prize",
    character: "A story about why the smartest portfolio is almost never the most exciting one",
    beats: U5_BEATS,
    ctaLabel: "Diversify Your Portfolio →",
    ctaSubtitle: "Add a stock from a sector you don't already own. Balance your risk.",
  },
  mission: {
    title: "Mission 5: Build Across Sectors",
    description:
      "Your portfolio shouldn't all move together. Add holdings from at least 2 different sectors. The goal isn't the highest return — it's the best return for the risk you're taking.",
    steps: [
      "Check what sectors your current holdings are in",
      "Find a stock in a sector you don't own (healthcare, energy, utilities, financials)",
      "Buy it",
      "Notice how it moves differently from your tech holdings during market moves",
    ],
  },
  unitQuiz: [
    {
      q: "Modern Portfolio Theory's key insight is that portfolio risk depends on...",
      choices: [
        "The total number of stocks you own — more is always safer",
        "How the assets in your portfolio move relative to each other, not just their individual risks",
        "Only buying stocks with low individual volatility",
        "Holding cash equal to at least 50% of your portfolio",
      ],
      correct: 1,
      explain: "Markowitz proved that portfolio risk is determined by correlation — how assets move relative to each other. Two individually risky assets can form a safer portfolio if they don't move in lockstep. This is why mixing uncorrelated assets (stocks + bonds, for example) reduces total portfolio risk.",
    },
    {
      q: "A stock with a beta of 0.5 typically...",
      choices: [
        "Has a 50% chance of rising on any given day",
        "Moves about half as much as the overall market in either direction",
        "Has lost 50% of its value in the past year",
        "Returns 50% less than the S&P 500 annually",
      ],
      correct: 1,
      explain: "Beta measures sensitivity to market moves. Beta of 0.5 means when the market rises 10%, the stock typically rises about 5%; when the market falls 10%, it falls about 5%. Lower beta = a smoother ride, but also lower upside in bull markets.",
    },
    {
      q: "Why should long-term investors periodically rebalance their portfolio?",
      choices: [
        "To identify and replace underperforming stocks with better ones",
        "To reduce the number of holdings down to the most profitable few",
        "To restore the target allocation — trimming what has grown large and adding to what has shrunk",
        "To take advantage of short-term market moves before everyone else does",
      ],
      correct: 2,
      explain: "Without rebalancing, a bull market in stocks can silently push your allocation from 60% to 80% stocks, exposing you to more risk than you intended. Rebalancing restores your target split, which mechanically results in selling high and buying low over time.",
    },
    {
      q: "Two assets with correlation close to -1 in a portfolio will...",
      choices: [
        "Double the portfolio's total risk",
        "Have no meaningful effect on portfolio risk",
        "Significantly reduce portfolio risk — their moves tend to offset each other",
        "Guarantee positive returns in any market environment",
      ],
      correct: 2,
      explain: "Negative correlation means when one asset rises, the other tends to fall. In a portfolio, these offsetting moves reduce overall swings. Gold and stocks, for example, often have near-zero or negative correlation — gold tends to rise when stocks fall.",
    },
    {
      q: "The most important single decision affecting your long-term portfolio returns is...",
      choices: [
        "Which individual stocks you select based on research",
        "When you buy and sell (market timing)",
        "How you divide your money between stocks, bonds, and cash (asset allocation)",
        "Which brokerage account or trading platform you use",
      ],
      correct: 2,
      explain: "Research consistently shows that asset allocation — the split between stocks, bonds, and cash — explains over 90% of the variation in long-term portfolio returns. Individual stock picks and market timing play a much smaller role than most investors believe.",
    },
  ],
};

// ── Unit 6: Market Cycles & Macro ─────────────────────────────────────────────

const U6_BEATS: StoryBeat[] = [
  {
    narrative: (
      <>
        <p>
          All markets move in cycles. A <I>bull market</I> is a sustained rise of 20% or more
          from a recent low, typically driven by economic growth, rising corporate earnings, and
          optimism. A <I>bear market</I> is a sustained decline of 20% or more from a recent
          high, driven by recession fears, falling earnings, or systemic shocks.
        </p>
        <p>
          Since 1928, the U.S. stock market has experienced <B>26 bear markets</B>. The average
          bear market lasts <B>9.5 months</B> and sees a peak-to-trough decline of <B>36%</B>.
          The average bull market lasts <B>2.7 years</B> and gains <B>114%</B>. The asymmetry
          is stark: bear markets are shorter and steeper; bull markets are longer and larger.
        </p>
      </>
    ),
    term: {
      name: "Bull & Bear Markets",
      definition:
        "Bull market: a sustained period of rising stock prices, typically accompanied by economic expansion and investor optimism. Officially defined as a 20%+ rise from a recent trough. Bear market: a sustained period of declining prices, typically accompanied by economic contraction. Officially a 20%+ decline from a recent peak. The terms come from how each animal attacks: a bull thrusts upward, a bear swipes downward.",
      impact:
        "The 2009–2020 bull market was the longest in history — 132 months and +529%. It ended in 23 days when COVID hit in March 2020. The subsequent bull market began almost immediately and ran until the Fed started raising rates in 2022. Understanding cycles means knowing you can't time the top or bottom — but you can avoid panic-selling at the bottom.",
    },
    check: {
      q: "How do bull markets and bear markets historically compare in length?",
      choices: [
        "They last about the same amount of time on average",
        "Bear markets last longer because recoveries are painfully slow",
        "Bull markets last longer (average 2.7 years) while bear markets are shorter (average 9.5 months)",
        "It varies too much to identify any consistent pattern",
      ],
      correct: 2,
      explain: "Historically, bear markets are shorter and steeper — averaging 9.5 months and a 36% decline. Bull markets are longer and larger — averaging 2.7 years and a 114% gain. This asymmetry is why patient investors who don't panic-sell during bear markets tend to come out ahead.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Interest rates are to stock prices what gravity is to a thrown ball. When the Federal
          Reserve raises interest rates, money becomes more expensive to borrow, business
          investment slows, and corporate earnings growth slows. But more importantly: when
          bond yields rise, investors demand higher returns from stocks too — which means lower
          prices.
        </p>
        <p>
          In 2022, the Fed raised rates from <B>0.25% to 5.5%</B> in 16 months — the fastest
          rate-hiking cycle in 40 years. The NASDAQ fell <B>34%</B> in 2022. Growth stocks —
          whose value depends on distant future earnings — fell hardest. Goldman Sachs&apos;s
          quant model said the daily moves it was seeing in its bond book should only happen
          once in 100,000 years. It saw them ten days in a row.
        </p>
      </>
    ),
    term: {
      name: "Interest Rates & Stock Prices",
      definition:
        "When interest rates rise: (1) borrowing becomes more expensive, slowing growth; (2) bonds yield more, reducing the relative attractiveness of stocks; (3) future cash flows are discounted at a higher rate, reducing the 'present value' of growth stocks. When rates fall, the opposite occurs. The 10-year Treasury yield is the most important benchmark — if it rises to 5%, investors will demand similar or better returns from stocks, which generally means lower stock prices.",
      impact:
        "The 2022 rate hike cycle wiped out 35% of the S&P 500's value and over 50% of many growth stocks. A company like Peloton, which had a P/E of 200 at the 2021 peak, fell 95% as rates rose. Its distant future earnings, discounted at higher rates, were worth far less. This is why understanding the Fed's interest rate policy is essential for any investor.",
    },
    check: {
      q: "When the Federal Reserve raises interest rates, what typically happens to growth stock prices?",
      choices: [
        "They rise because higher rates signal a strong, growing economy",
        "They are unaffected since stock prices only depend on company earnings",
        "They tend to fall because future earnings are worth less when discounted at higher rates",
        "Only stocks with lots of debt are affected — debt-free companies are immune",
      ],
      correct: 2,
      explain: "Higher interest rates reduce the 'present value' of future earnings. Growth stocks depend on earnings far in the future, so rate hikes hit them hardest. Peloton fell 95% as rates rose — its distant future profits became worth far less when discounted at 5% instead of near-zero rates.",
    },
  },
  {
    narrative: (
      <>
        <p>
          The Federal Reserve has two jobs: keep prices stable (fight inflation) and keep
          employment high. When these goals conflict — as they do in every economic cycle —
          the Fed must choose. In 2021, inflation hit <B>9.1%</B>, the highest since 1981.
          The Fed had to raise rates aggressively, knowing it would slow the economy and hurt
          asset prices.
        </p>
        <p>
          Fed policy moves through the economy with a long delay — economists say it works with
          &ldquo;long and variable lags.&rdquo; Rate hikes in 2022 caused bank failures,
          housing market freezes, and startup collapses in 2023. Understanding the Fed is
          understanding the force that sits above every other investment factor.
        </p>
      </>
    ),
    term: {
      name: "Federal Reserve Policy",
      definition:
        "The Federal Reserve (the Fed) is America's central bank. Its primary tools are: (1) setting the federal funds rate (the overnight lending rate banks use, which anchors all other rates); (2) quantitative easing/tightening (buying or selling bonds to inject or remove money from the financial system). The Fed's dual mandate: price stability (target ~2% inflation) and maximum employment. Its decisions affect every asset class, every mortgage rate, and every business loan rate.",
      impact:
        "The Fed's announcement dates are among the most market-moving events of every year. When the Fed surprised markets by raising 0.75% in June 2022 (the largest hike since 1994), the S&P 500 fell 3.4% in a single day. When the Fed began cutting rates in September 2024, the market rallied 1.7% that day. Nothing moves markets more reliably than unexpected Fed decisions.",
    },
    check: {
      q: "What are the two goals of the Federal Reserve's 'dual mandate'?",
      choices: [
        "Set stock prices and control bank lending",
        "Balance the federal budget and manage the national debt",
        "Keep inflation stable (around 2%) and maximize employment",
        "Control oil prices and stabilize the housing market",
      ],
      correct: 2,
      explain: "The Fed's dual mandate — stable prices (targeting around 2% inflation) and maximum employment — sometimes pull in opposite directions. When inflation hit 9.1% in 2021, the Fed had to raise rates aggressively to fight it, even knowing that would slow the economy and hurt employment.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Inflation erodes purchasing power — the real return on your investment is the nominal
          return minus inflation. If your stock portfolio returns <B>6%</B> in a year where
          inflation is <B>4%</B>, your real return is only <B>2%</B>. Your money grew in
          number but shrank in purchasing power.
        </p>
        <p>
          This is why stocks, despite their volatility, have outperformed bonds and cash over
          every 20-year period in modern history: they provide real returns above inflation.
          Companies can raise prices as inflation rises (pricing power), protecting their margins
          and earnings. Cash loses purchasing power silently. Stocks — especially companies
          with strong brands and pricing power — grow through inflation.
        </p>
      </>
    ),
    term: {
      name: "Inflation & Real Returns",
      definition:
        "Nominal return: the stated percentage gain on an investment. Real return: nominal return minus the inflation rate. If inflation is 3% and your portfolio returns 8%, your real return is 5% — you actually got 5% more purchasing power. The Consumer Price Index (CPI) measures the cost of a basket of consumer goods and is the primary measure of inflation. The Fed targets 2% annual inflation as 'stable' — enough to encourage spending rather than hoarding, but not so much that it distorts the economy.",
      impact:
        "At 2% inflation, prices double every 36 years. At 7% inflation (as seen in 2022), prices double every 10 years. A retiree holding only cash savings in 2022 saw their purchasing power fall 7% in a single year. This is the 'silent tax' of inflation — and the primary reason every long-term financial plan includes stocks. The S&P 500 has averaged about 7% annual real returns over the last century.",
    },
    check: {
      q: "If your investment portfolio returns 6% but inflation runs at 4%, what is your real return?",
      choices: [
        "10% — you add the two numbers together",
        "6% — inflation doesn't actually affect investment returns",
        "2% — your real return is the nominal return minus inflation",
        "−4% — inflation always erases the gains",
      ],
      correct: 2,
      explain: "Real return = nominal return − inflation rate. Your portfolio grew 6% in dollar terms, but prices rose 4%, so you only gained 2% in actual purchasing power. This is why stocks matter for long-term investors — they've historically provided positive real returns that beat inflation.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Since 1955, the U.S. has experienced 9 recessions. Every single one was preceded by
          an <I>inverted yield curve</I>. The yield curve inverted in March 2022. Economists
          debated through all of 2023 whether the predicted recession had been postponed or
          was still coming. The bond market, through the yield curve, had predicted a slowdown
          with 100% historical accuracy — but timing was uncertain.
        </p>
        <p>
          Normally, long-term interest rates are <I>higher</I> than short-term rates — investors
          demand more compensation for tying up money for 10 years versus 3 months. When this
          relationship flips — when the 2-year Treasury yields <I>more</I> than the 10-year —
          the yield curve is &ldquo;inverted.&rdquo; It signals that bond investors expect the
          Fed to cut rates in the future, because they anticipate economic weakness ahead.
        </p>
      </>
    ),
    term: {
      name: "The Yield Curve",
      definition:
        "The yield curve plots interest rates (yields) on U.S. Treasury bonds across different maturities — from 3 months to 30 years. Normally, the curve slopes upward: longer maturities yield more. An inverted yield curve occurs when shorter maturities yield more than longer ones — typically when the 2-year Treasury yield exceeds the 10-year Treasury yield. The 2-year/10-year inversion is the most closely watched recession signal in economics. It has preceded every U.S. recession since 1955 with zero false positives — though the lag between inversion and recession ranges from 6 to 24 months.",
      impact:
        "The yield curve inverted in March 2022 for the first time since 2019. The 2019 inversion preceded the 2020 COVID recession. From March 2022, the 2/10 inversion deepened to its most extreme level since 1981. GDP growth slowed, the housing market froze, startup funding collapsed, and regional banks failed in 2023 — not a textbook recession, but the economic weakness the yield curve predicted. Investors who reduced equity exposure after the March 2022 inversion and moved to shorter-duration bonds protected themselves during the worst of 2022's equity decline.",
    },
    check: {
      q: "An inverted yield curve — when short-term rates are higher than long-term rates — historically signals what?",
      choices: [
        "The stock market is about to rise sharply",
        "Bond investors expect the Fed to keep raising rates aggressively",
        "Bond investors expect economic weakness ahead and anticipate future Fed rate cuts",
        "Government spending is too high and taxes need to increase",
      ],
      correct: 2,
      explain: "An inverted yield curve forms when bond investors expect the economy to weaken and the Fed to eventually cut rates. Since 1955, every U.S. recession has been preceded by a yield curve inversion — making it the most reliable recession warning signal in economics, even if the timing (6–24 months later) varies.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Every month, the U.S. government releases economic data. The most watched: on the
          first Friday of every month at <B>8:30 AM Eastern</B>, the Bureau of Labor Statistics
          releases the jobs report. In the 60 seconds after release, stock markets can move{" "}
          <B>1–2%</B> in either direction. A &ldquo;strong&rdquo; jobs number might mean the
          Fed will raise rates (bad for stocks). A &ldquo;weak&rdquo; jobs number might mean
          the Fed will cut rates (good for stocks). Context determines everything.
        </p>
        <p>
          The subtlety: most major economic reports are <I>lagging</I> indicators — they measure
          what already happened. The stock market itself is a <I>leading</I> indicator — it
          tends to price in recessions 6–9 months before they officially begin. By the time GDP
          prints negative in the news, sophisticated investors have already repositioned.
        </p>
      </>
    ),
    term: {
      name: "Economic Indicators",
      definition:
        "Leading indicators predict future economic activity: building permits, manufacturing orders, consumer confidence, yield curve, stock prices. Lagging indicators confirm trends after they've started: GDP, unemployment rate, corporate profits — they reflect what happened, not what's coming. Key reports: Non-Farm Payrolls (jobs added monthly, first Friday of month), CPI (Consumer Price Index, measures inflation, monthly), GDP (quarterly measure of total economic output). The official NBER recession definition is two quarters of negative GDP, which is often declared 6–18 months after the recession actually began.",
      impact:
        "The stock market typically falls 6–12 months before a recession begins and bottoms 3–6 months before it ends. In 2022, the S&P 500 peaked in January, fell 25% by October, then began recovering in November 2022 — months before any economic data confirmed the bottom. Investors who waited for 'confirmation' of recovery before buying back in missed much of the 2023 rally. The market is the leading indicator. Waiting for lagging economic data before acting is, by definition, acting too late.",
    },
    check: {
      q: "Economic reports like GDP and unemployment are called 'lagging' indicators. What does that mean?",
      choices: [
        "They predict what will happen in the economy next quarter",
        "They measure economic activity as it happens, in real time",
        "They measure what already happened — the data reflects the past, not the future",
        "They only matter for bond investors, not stock investors",
      ],
      correct: 2,
      explain: "GDP is measured and reported quarterly with a delay, and official recession declarations come 6–18 months after a recession actually begins. By the time 'recession' appears in headlines, the stock market has usually already priced it in and begun recovering — which is why waiting for lagging data before acting is usually too late.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Not all sectors move together. In 2022, energy stocks gained <B>59%</B> while tech
          stocks fell <B>28%</B>. The following year, the reverse: tech soared <B>57%</B>
          while energy gained just <B>2%</B>. This rotation follows a predictable pattern,
          driven by where the economy is in the business cycle.
        </p>
        <p>
          In early expansions (low rates, rising growth), cyclicals lead: consumer discretionary,
          industrials, financials. At economic peaks, energy and materials often lead as
          inflation rises and commodity demand peaks. In slowdowns, defensives hold up best:
          healthcare, utilities, consumer staples — companies whose products people buy
          regardless of the economy. Learning to recognize where you are in the cycle is the
          core skill of macro investing.
        </p>
      </>
    ),
    term: {
      name: "Sector Rotation",
      definition:
        "Sector rotation is the practice of shifting portfolio exposure between economic sectors based on the phase of the business cycle. Early expansion: financials, consumer discretionary, technology tend to lead. Mid-expansion: industrials, materials, energy. Late expansion: energy, materials, consumer staples. Recession: utilities, healthcare, consumer staples hold best. It's not a precise clock — phases overlap, and timing is uncertain. But the historical data shows consistent patterns: defensive sectors meaningfully outperform during recessions; cyclicals dramatically outperform early in recoveries.",
      impact:
        "A pure sector-rotation strategy (using SPDR sector ETFs) rotating quarterly based on economic cycle signals would have returned about 11.8% annually from 1999–2023 vs. the S&P 500's 10.3% — modest outperformance. The real value is risk management: rotating toward defensives before a recession significantly reduces drawdown. In 2022, an investor shifted to energy (+59%) and utilities (+1%) handily beat the S&P 500's −18%. Sector rotation isn't market timing — it's adjusting your risk positioning based on macroeconomic evidence rather than guessing tomorrow's market move.",
    },
    check: {
      q: "During the early expansion phase of the economic cycle, which sectors tend to lead?",
      choices: [
        "Utilities, healthcare, and consumer staples — the 'safe' defensive sectors",
        "Gold and commodities — rising inflation boosts these first",
        "Consumer discretionary, financials, and technology — cyclicals benefit from growing confidence",
        "Energy and materials — commodity demand spikes right away",
      ],
      correct: 2,
      explain: "Early in an expansion, rising consumer and business confidence drives spending. Cyclical sectors like consumer discretionary (people buying things), financials (more lending), and tech (business investment) tend to outperform. Defensive sectors (utilities, healthcare) lag because investors don't need safety in a growing economy.",
    },
  },
];

const U6: StockUnit = {
  num: 6,
  slug: "unit-6",
  title: "Market Cycles & Macro",
  accent: "#dc2626",
  previewHook: "Goldman's model said the 2008 losses should happen once in 100,000 years. They saw it 10 days in a row.",
  concepts: ["Bull & bear markets", "Interest rates", "Fed policy", "Inflation & real returns"],
  hook: {
    title: "The 100,000-Year Event",
    setup: (
      <>
        <p>
          In August 2007, Goldman Sachs&apos;s CFO told a conference that their quantitative
          funds were experiencing moves that the models said should only happen once every{" "}
          <strong>100,000 years</strong>. These were considered impossible events.
        </p>
        <p>
          They saw them <strong>10 days in a row</strong>.
        </p>
      </>
    ),
    question: "If a statistical model says something is impossible, what does that tell you about the model?",
    reveal: {
      stat: "The model was wrong",
      statSub: "financial risk models systematically underestimate tail risk",
      explanation:
        "Goldman's models assumed market moves followed a normal distribution — a bell curve. Real markets have 'fat tails' — extreme events happen far more often than models predict. The 2008 financial crisis followed. The lesson: macroeconomic forces — interest rates, inflation, Fed policy — can make 'impossible' things happen. Investors who understand these forces get less blindsided.",
    },
    sandbox: <InflationEroderHook accent="#dc2626" />,
  },
  lesson: {
    title: "The Forces Bigger Than Any Stock",
    character: "A story about why the economy beneath your portfolio matters as much as the stocks in it",
    beats: U6_BEATS,
    ctaLabel: "Trade With Macro in Mind →",
    ctaSubtitle: "Before your next trade, check where interest rates are and what the Fed has been doing.",
  },
  mission: {
    title: "Mission 6: Think Cyclically",
    description:
      "Interest rates are high or low right now — do you know which? That determines which sectors tend to do well. Your mission: research a sector that historically benefits from the current rate environment.",
    steps: [
      "Look up the current Federal Funds Rate (search Google: 'current fed funds rate')",
      "If rates are high: consider value stocks, financials, energy",
      "If rates are low: consider growth stocks, tech, real estate",
      "Add a position in a sector that aligns with the macro environment",
    ],
  },
  unitQuiz: [
    {
      q: "What officially defines a 'bear market'?",
      choices: [
        "The economy has two consecutive quarters of negative GDP growth",
        "A stock market decline of 20% or more from a recent peak",
        "Any period when more stocks are falling than rising",
        "The stock market closes lower for 10 or more days in a row",
      ],
      correct: 1,
      explain: "A bear market is technically defined as a 20% or more decline from a recent peak. Since 1928, the average bear market lasts about 9.5 months. They always end, and long-term investors who don't panic-sell recover fully — and those who buy during bear markets often end up ahead.",
    },
    {
      q: "Why do growth stocks fall hardest when interest rates rise?",
      choices: [
        "Growth companies typically carry too much debt",
        "Higher rates mean investors can earn more from bonds, so stocks look less attractive",
        "Future earnings are worth less when discounted at higher rates — hurting companies whose value depends on distant profits",
        "Growth stocks are more likely to go bankrupt when borrowing costs rise",
      ],
      correct: 2,
      explain: "Discounting converts future cash flows into today's value. When the discount rate rises from 2% to 5%, the same future earnings are worth much less today. Growth stocks, whose value depends on earnings 5–10 years out, get hurt most. This is why Peloton fell 95% as rates rose — its future profits shrank dramatically in present value.",
    },
    {
      q: "If inflation runs at 7%, roughly how long does it take for prices to double?",
      choices: [
        "About 36 years",
        "About 20 years",
        "About 10 years",
        "About 3 years",
      ],
      correct: 2,
      explain: "Using the Rule of 72: divide 72 by the annual rate to get years to double. 72 ÷ 7 ≈ 10 years. At 7% inflation, prices double every decade. This is why holding only cash is dangerous long-term — your savings lose half their purchasing power every 10 years.",
    },
    {
      q: "The yield curve inverted in March 2022. What did this signal to informed investors?",
      choices: [
        "That the Fed was about to cut interest rates immediately",
        "That stocks were guaranteed to rise in the next few months",
        "That economic weakness was likely ahead — a warning to reduce risk in their portfolios",
        "That gold and commodities would outperform stocks for the next decade",
      ],
      correct: 2,
      explain: "Every U.S. recession since 1955 has been preceded by a yield curve inversion. When the curve inverted in March 2022, informed investors reduced equity exposure, rotated to shorter-duration bonds, or added defensive positions. The expected economic slowdown materialized through regional bank failures and frozen housing markets in 2023.",
    },
    {
      q: "Why is the stock market itself considered a 'leading' economic indicator?",
      choices: [
        "Because it measures corporate profits before the government reports them",
        "Because stock prices tend to fall months before a recession begins and bottom before the recession ends",
        "Because Wall Street analysts receive economic data before the general public",
        "Because the Fed uses the stock market directly to guide its interest rate decisions",
      ],
      correct: 1,
      explain: "The stock market aggregates the expectations of millions of investors about future economic conditions. It tends to price in recessions 6–12 months before they officially start, and bottoms 3–6 months before they end. Investors who wait for lagging data like GDP to confirm a bottom will have already missed much of the recovery.",
    },
  ],
};

// ── Unit 7: Investment Strategies ─────────────────────────────────────────────

const U7_BEATS: StoryBeat[] = [
  {
    narrative: (
      <>
        <p>
          Jack Bogle launched the Vanguard 500 Index Fund in August 1976. Fidelity&apos;s
          chairman called it &ldquo;Bogle&apos;s Folly.&rdquo; The idea was simple and radical:
          instead of trying to beat the market by picking stocks, just own every stock in the
          S&P 500 at minimal cost. Let the market do the work.
        </p>
        <p>
          Wall Street hated it. Why would anyone pay fees to a fund manager if a computer could
          do it cheaper? The first fund raised <B>$11 million</B> — far short of its $150M goal.
          Today, Vanguard manages <B>$9.3 trillion</B>. Index funds account for over half of all
          U.S. mutual fund assets. Bogle&apos;s &ldquo;folly&rdquo; changed personal finance
          forever.
        </p>
      </>
    ),
    term: {
      name: "Index Investing",
      definition:
        "Index investing means buying a fund that tracks a market index (like the S&P 500), owning every stock in the index at proportional weights. You get instant diversification, extremely low fees (often <0.1%/year), and market-rate returns. You will never beat the market — but you won't underperform it either. The math is compelling: after fees, most active fund managers underperform the index over 10+ years.",
      impact:
        "Over 20 years through 2023, 94% of large-cap active fund managers underperformed the S&P 500 index. After fees, the odds are stacked against active management. A $10,000 investment in the S&P 500 index from 2003–2023 would have grown to roughly $62,000. The same amount in the average active fund would have been about $47,000 — a $15,000 difference from nothing but fees and poor stock picks.",
    },
    check: {
      q: "Over 20 years, approximately what percentage of active fund managers beat the S&P 500 index after fees?",
      choices: [
        "About 50% — it's roughly a coin flip between active and passive",
        "About 30% — skilled managers consistently outperform",
        "About 6% — the vast majority underperform the simple index",
        "About 80% — professionals consistently beat the market over long periods",
      ],
      correct: 2,
      explain: "S&P's SPIVA scorecard consistently shows that over 20 years, around 94% of active large-cap fund managers underperform the index after fees. The main culprit is costs — a 1% annual fee sounds small, but it compounds over 20+ years into a massive performance gap, as the $15,000 difference in the example shows.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Value investing starts with Benjamin Graham — Buffett&apos;s Columbia professor and
          mentor. Graham survived the 1929 crash, lost almost everything, and rebuilt a theory:
          stocks are not lottery tickets. They are ownership stakes in real businesses. Price
          them like a business, not like a story.
        </p>
        <p>
          His method: find stocks trading significantly below their calculated intrinsic value
          — what he called &ldquo;cigar butt&rdquo; investing, picking up cheap discarded
          businesses for one last puff. Buffett refined it: buy great businesses at fair prices
          rather than average businesses at cheap prices. The distinction made him the greatest
          investor of the 20th century.
        </p>
      </>
    ),
    term: {
      name: "Value Investing",
      definition:
        "Value investing means buying stocks trading below their calculated intrinsic value — with a margin of safety. Practitioners look for low P/E, low price-to-book, high dividend yield, or strong balance sheets relative to market price. The thesis: the market overreacts to short-term bad news, creating temporary mispricings that revert over time. Value stocks tend to outperform over long periods but can underperform for years during growth-driven bull markets.",
      impact:
        "From 1963–2023, value stocks (lowest P/E quintile) have outperformed growth stocks by about 4.7% per year on average. But from 2007–2020, growth massively outperformed value — the longest value underperformance in history. Many value investors abandoned the strategy right before it rebounded sharply in 2022. The discipline to stick with a sound strategy through underperformance is as important as the strategy itself.",
    },
    check: {
      q: "What is the core idea behind value investing, as developed by Benjamin Graham?",
      choices: [
        "Buy stocks whose prices are rising quickly and ride the momentum",
        "Buy stocks trading below what you calculate the business is actually worth, with a margin of safety",
        "Only invest in large, well-known companies with a long track record",
        "Buy and hold stocks for exactly one year, then evaluate each one",
      ],
      correct: 1,
      explain: "Graham's core insight was that stocks represent ownership in real businesses. If a business is worth $100 per share and the market is selling it for $60, you're buying a dollar for 60 cents. The gap between price and value is the 'margin of safety' — protection if your valuation estimate is off. Buffett refined this into buying great businesses at fair prices.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Growth investing means paying a premium price for companies expanding faster than the
          overall economy. You&apos;re not buying a cheap cigar butt — you&apos;re paying full
          price for a premium business because you believe the premium is justified by future
          growth that the market is underestimating.
        </p>
        <p>
          The risks are asymmetric. If a growth stock grows as expected, you make a good return.
          If it grows slightly less than expected, you can lose 40–50% even on a business that
          is still fundamentally strong. Netflix fell <B>75%</B> in 2022 when subscriber growth
          slowed — the company remained profitable and strong, but the growth story changed.
        </p>
      </>
    ),
    term: {
      name: "Growth Investing",
      definition:
        "Growth investing focuses on companies with above-average revenue and earnings growth rates, often in rapidly expanding markets. Growth investors accept higher P/E ratios because they expect future earnings to justify the premium. Key metrics: revenue growth rate (>20%/year is considered high-growth), earnings growth rate, and total addressable market (TAM). The risk: if growth slows or misses expectations, the high multiple compresses, causing sharp price declines even for a healthy business.",
      impact:
        "Nvidia's revenue grew from $16B in 2022 to $61B in 2024 — a 280% increase in two years driven by AI demand. Investors who identified this growth early saw the stock rise 900%. Those who bought at peak valuation in early 2024 saw a 30% decline in a few months even as revenue kept growing. Growth investing rewards correct macro bets and punishes wrong timing.",
    },
    check: {
      q: "Netflix fell 75% in 2022 even though it remained a profitable company. Why?",
      choices: [
        "Netflix went bankrupt and had to restructure its debt",
        "Netflix's earnings went negative for the full year",
        "Growth investors had priced in fast subscriber growth — when growth slowed, the high valuation collapsed",
        "The government forced Netflix to lower subscription prices, cutting revenue",
      ],
      correct: 2,
      explain: "Growth stocks carry high P/E ratios because investors are paying for future growth, not just current earnings. When Netflix's subscriber growth slowed — even slightly below expectations — the justification for the high multiple disappeared. A profitable company can still fall 75% when the growth story changes.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Dollar-cost averaging (DCA) is the practice of investing a fixed dollar amount at
          regular intervals — regardless of what the market is doing. Buy $500 of index funds
          every month, no matter whether the market is up 10% or down 20%.
        </p>
        <p>
          DCA has a counterintuitive benefit: when prices fall, your fixed dollar amount buys
          more shares. When prices rise, it buys fewer. Over time, you automatically accumulate
          more shares at lower prices. It removes emotion from the equation — you buy during
          crashes when panic says &ldquo;sell,&rdquo; because the calendar says it&apos;s time
          to buy.
        </p>
      </>
    ),
    term: {
      name: "Dollar-Cost Averaging",
      definition:
        "DCA means investing a fixed dollar amount at fixed intervals, regardless of market price. If you invest $100/month and the stock is at $50, you buy 2 shares. If the price drops to $25, you buy 4 shares. Your average cost per share is lower than the time-weighted average price — you naturally buy more when shares are cheaper. DCA eliminates timing risk and removes emotional decision-making. It is the most widely recommended approach for long-term investors.",
      impact:
        "An investor who dollar-cost averaged $1,000/month into the S&P 500 from 2007 to 2024 — including through the 2008–09 crash and the 2022 bear market — would have accumulated roughly $620,000 from $204,000 invested. DCA through the 2009 crash meant buying at the lowest prices, which supercharged returns in the recovery. Lump-sum investing slightly outperforms DCA in bull markets; DCA dramatically outperforms in volatile, choppy markets.",
    },
    check: {
      q: "When stock prices fall during a bear market, how does dollar-cost averaging actually help?",
      choices: [
        "It automatically pauses your investments until prices recover",
        "It switches your money into bonds to protect against further losses",
        "Your fixed monthly investment buys more shares at lower prices, reducing your average cost per share",
        "It guarantees you will never lose money during a market crash",
      ],
      correct: 2,
      explain: "DCA is counterintuitive: when prices fall, your fixed dollar amount buys more shares. When prices rise, it buys fewer. Over time, you end up with more shares purchased at lower prices, lowering your average cost. This is especially powerful in bear markets — keeping investing through 2008–09 meant buying at prices that never came back.",
    },
  },
  {
    narrative: (
      <>
        <p>
          In 1956, a graduate student began tracking something his professors largely ignored:
          the long-term returns of dividend-paying stocks. What he found became the core thesis
          of his 1994 book <I>Stocks for the Long Run</I>: between 1871 and the late 1980s,
          dividend reinvestment accounted for the vast majority of the stock market&apos;s
          total return. A dollar invested in 1871 grew to about $1,300 by the 1990s — but
          only to <B>$5</B> without dividends reinvested.
        </p>
        <p>
          The secret is compounding. Each dividend payment buys more shares. Those shares pay
          more dividends. Those dividends buy even more shares. Coca-Cola has increased its
          dividend every single year for over <B>61 consecutive years</B> — through recessions,
          inflation, and market crashes. Companies that consistently grow dividends tend to be
          exactly the kinds of stable, profitable businesses that make excellent long-term holds.
        </p>
      </>
    ),
    term: {
      name: "Dividend Investing",
      definition:
        "Dividend investing focuses on stocks with consistent, growing dividend payments to generate income and reinvest for compound growth. Key metrics: dividend yield (annual dividend ÷ stock price), payout ratio (dividends paid ÷ net income — sustainable below 70%), and dividend growth rate (how fast the dividend increases annually). 'Dividend aristocrats' are S&P 500 companies that have grown their dividend for 25+ consecutive years. Companies with decades of uninterrupted dividend growth (Coca-Cola, Procter & Gamble, Johnson & Johnson) tend to be financially strong and shareholder-aligned.",
      impact:
        "$10,000 invested in Coca-Cola in 1994 with dividends reinvested would be worth approximately $125,000 today — a 12.5× return. Without dividend reinvestment, that same $10,000 is worth about $50,000 (5× return). The 2.5× difference is pure compounding — dividends buying more shares, those shares paying more dividends, repeating for 30 years. Dividend reinvestment plans (DRIPs) automate this process, purchasing fractional shares with every payment. The longer the time horizon, the more dramatic the reinvestment advantage becomes.",
    },
    check: {
      q: "Coca-Cola returned about 12.5× over 30 years with dividends reinvested vs. 5× without. What explains the difference?",
      choices: [
        "Coca-Cola raises its stock price faster for investors who reinvest",
        "Each dividend payment bought more shares, which paid more dividends, which bought more shares — compounding over decades",
        "Dividend reinvestors receive special tax treatment that boosts their returns",
        "The stock price itself behaves differently for reinvestors vs. non-reinvestors",
      ],
      correct: 1,
      explain: "Dividend reinvestment creates a compounding snowball: dividends buy more shares, those shares pay more dividends, which buy even more shares. Over 30 years, this compounding effect is enormous. The math shows $10,000 growing to $125,000 with reinvestment vs. $50,000 without — a 2.5× difference from dividends alone.",
    },
  },
  {
    narrative: (
      <>
        <p>
          In 1993, two researchers published a study that confounded efficient market theorists:
          stocks that had <I>risen</I> the most in the prior year tended to keep rising for
          the next 3–12 months, and stocks that had fallen the most tended to keep falling.
          Price trends persisted. The momentum anomaly was real, documented, and statistically
          significant across 67 years of data.
        </p>
        <p>
          This is <I>momentum investing</I> — buying recent top-performers and avoiding recent
          losers, based purely on price behavior, with no fundamental analysis. It requires
          discipline and regular rebalancing. A Nobel Prize was awarded partly for identifying
          this anomaly: markets are not perfectly efficient. Prices trend. The trend is your
          friend — until it reverses, suddenly and severely, often losing in weeks what took
          months to accumulate.
        </p>
      </>
    ),
    term: {
      name: "Momentum Investing",
      definition:
        "Momentum investing buys recent top-performers and sells or avoids recent underperformers, based on the empirical finding that price trends persist for 3–12 months. Unlike value or growth investing, momentum requires no fundamental analysis — it's purely price-based. The momentum premium was documented by Jegadeesh & Titman (1993): stocks that rose most in the past 12 months tend to outperform over the next 3–12 months, while recent losers tend to underperform. The risk: 'momentum crashes' — sudden, severe reversals that typically occur at major market turning points.",
      impact:
        "From 2017–2021, momentum strategies massively outperformed — high-growth tech stocks kept rising, attracting more buyers, rising further. Cathie Wood's ARK Innovation ETF (proxy for momentum in growth tech) rose 358% from 2019 to its 2021 peak. The 2022 reversal was brutal: ARK fell 75%, and the prior years' biggest winners became the biggest losers. Momentum works until it doesn't — and when it fails, it fails catastrophically. Successful momentum investors use strict stop-losses and systematic rebalancing to limit how long they hold a reversing trend.",
    },
    check: {
      q: "Momentum investing is based on which empirical observation?",
      choices: [
        "Stocks with low P/E ratios consistently outperform the market over time",
        "Stocks that have risen the most in the past year tend to keep rising for the next 3–12 months",
        "Companies with the fastest earnings growth produce the best stock returns",
        "Stocks paying the highest dividends attract the most new buyers",
      ],
      correct: 1,
      explain: "Jegadeesh and Titman's 1993 study documented across 67 years of data that recent top-performing stocks tend to keep outperforming for 3–12 months. This 'momentum effect' has been confirmed in markets worldwide. The risk is momentum crashes — sudden, severe reversals that typically happen at major market turning points.",
    },
  },
  {
    narrative: (
      <>
        <p>
          In 1992, Eugene Fama and Kenneth French published a paper that challenged the core
          premise of finance: that market risk (beta) alone explained stock returns. They found
          two additional factors drove returns systematically — company <I>size</I> (small-cap
          stocks outperform large-cap historically) and <I>value</I> (cheap stocks outperform
          expensive ones). Subsequent researchers identified more: quality, momentum,
          low-volatility.
        </p>
        <p>
          Today, <B>$3.5 trillion</B> in assets are managed using factor investing —
          systematic strategies that tilt portfolios toward stocks with mathematically
          documented return premiums. It sits between active stock-picking and passive indexing:
          instead of picking individual stocks, you pick characteristics that have historically
          predicted outperformance, and own every stock that exhibits them.
        </p>
      </>
    ),
    term: {
      name: "Factor Investing",
      definition:
        "Factor investing (also called 'smart beta') systematically tilts portfolios toward stocks exhibiting characteristics ('factors') that have historically delivered excess returns. The five major factors: Value (low P/E or P/B, historically outperforms), Size (small-cap outperforms large-cap over long periods), Momentum (recent winners tend to keep winning short-term), Quality (high-profitability, low-debt companies), Low Volatility (less volatile stocks generate better risk-adjusted returns). Factor ETFs like QUAL (quality), MTUM (momentum), and VLUE (value) make factor exposure accessible to retail investors.",
      impact:
        "The 'quality factor' — buying companies with high profitability, strong balance sheets, and stable earnings — has outperformed the S&P 500 by 1.5–2% annually over long periods with lower volatility. The iShares MSCI USA Quality Factor ETF (QUAL) has outperformed the broader market since its 2013 inception. Meanwhile, the value factor underperformed massively from 2007–2020 before roaring back in 2022 when rate hikes favored cheap, profitable businesses over speculative growth. No single factor works in every environment — the key is understanding the economic logic behind each factor and holding through its inevitable periods of underperformance.",
    },
    check: {
      q: "Which of the following best describes factor investing?",
      choices: [
        "Picking individual stocks based on news and personal judgment",
        "Owning every stock in the S&P 500 in equal amounts",
        "Systematically tilting a portfolio toward characteristics — like low P/E or high profitability — that have historically produced better returns",
        "Timing the market to buy before major economic events",
      ],
      correct: 2,
      explain: "Factor investing sits between passive indexing and active stock picking. Instead of choosing individual stocks, you choose characteristics ('factors') like value, quality, or momentum that have historically produced above-average returns. Factor ETFs like QUAL or VLUE make this approach accessible to retail investors at low cost.",
    },
  },
];

const U7: StockUnit = {
  num: 7,
  slug: "unit-7",
  title: "Investment Strategies",
  accent: "#854d0e",
  previewHook: "Jack Bogle invented the index fund. Wall Street called it 'Bogle's Folly.' His fund beat 90% of professionals over 20 years.",
  concepts: ["Value investing", "Growth investing", "Index funds", "Dollar-cost averaging"],
  hook: {
    title: "Bogle's Folly",
    setup: (
      <>
        <p>
          In 1976, Jack Bogle launched an idea: instead of hiring expensive managers to pick
          stocks, just own every stock in the S&P 500 at minimal cost. Wall Street laughed.
          Fidelity called it <strong>&ldquo;Bogle&apos;s Folly.&rdquo;</strong> The fund
          raised $11 million — far short of its $150 million target.
        </p>
        <p>
          Today, Vanguard manages <strong>$9.3 trillion</strong>.
        </p>
      </>
    ),
    question: "What percentage of professional fund managers beat the S&P 500 index over 20 years?",
    reveal: {
      stat: "6%",
      statSub: "only 6 in 100 professional managers beat the index after fees, over 20 years",
      explanation:
        "The data from S&P's SPIVA scorecard is consistent: over 20 years, 94% of active fund managers underperform the simple S&P 500 index. The reason isn't that they're bad at picking stocks — it's fees. A 1% annual fee sounds small, but over 30 years of compounding, it consumes 26% of your total returns. Bogle's insight: the less you pay in fees, the more you keep.",
    },
  },
  lesson: {
    title: "The Cheapest Strategy Wins",
    character: "A story about the four strategies that govern how serious money gets invested",
    beats: U7_BEATS,
    ctaLabel: "Build Your Strategy →",
    ctaSubtitle: "Decide whether you're a value investor, growth investor, or index-fund investor. Then trade accordingly.",
  },
  mission: {
    title: "Mission 7: Commit to a Strategy",
    description:
      "You've learned four strategies. For the next 5 trades, commit to one and only one: value (find low P/E stocks), growth (find fast-growing companies), or index (buy broad market exposure). Consistency beats cleverness.",
    steps: [
      "Pick one strategy: value, growth, or diversified index",
      "Make 1 trade that fits your chosen strategy",
      "Note your reasoning — what makes this a value buy, growth buy, or index buy?",
      "Stick with it. Don't switch after one loss.",
    ],
  },
  unitQuiz: [
    {
      q: "Jack Bogle's core insight with the index fund was...",
      choices: [
        "Hire the world's best stock pickers and pay them huge bonuses to outperform",
        "Bet everything on technology stocks in the 1970s",
        "Own every stock in the index at minimal cost — after fees, most active managers underperform anyway",
        "Focus only on dividend-paying stocks for reliable passive income",
      ],
      correct: 2,
      explain: "Bogle's insight was simple but powerful: after fees, most active managers underperform the index. So instead of paying high fees to underperform, just own the whole index at near-zero cost. Today, Vanguard manages $9.3 trillion — the 'folly' became the most successful investment idea of the 20th century.",
    },
    {
      q: "In value investing, the gap between a stock's market price and its calculated intrinsic value is called...",
      choices: [
        "The profit margin",
        "The margin of safety",
        "The momentum premium",
        "The dividend yield",
      ],
      correct: 1,
      explain: "Benjamin Graham called the gap between a stock's intrinsic value and its market price the 'margin of safety.' If you think a stock is worth $80 and you buy it at $50, the $30 buffer protects you if your estimate is wrong. If it's really worth $65 and you paid $50, you still profit. The margin of safety is the foundation of value investing.",
    },
    {
      q: "Dollar-cost averaging means...",
      choices: [
        "Averaging the prices of your portfolio weekly to track performance",
        "Investing a fixed dollar amount at regular intervals regardless of what the market is doing",
        "Moving money between stocks and bonds to maintain a target allocation ratio",
        "Only buying stocks priced under a specific dollar amount",
      ],
      correct: 1,
      explain: "DCA means investing a fixed amount (say $500/month) on a set schedule, no matter whether the market is up or down. The benefit: you naturally buy more shares when prices are low and fewer when prices are high. It also removes emotion from investing — no decision to make each month, just execute the plan.",
    },
    {
      q: "A growth stock's price falls 60% even though the company's revenue keeps growing. The most likely cause is...",
      choices: [
        "The company is about to declare bankruptcy",
        "Revenue growth slowed or missed expectations, causing the high valuation multiple to compress sharply",
        "The stock was delisted from its exchange",
        "The company's CEO resigned, causing panic",
      ],
      correct: 1,
      explain: "Growth stocks trade at high P/E ratios because investors are paying for future growth. When growth slows — even slightly below expectations — the justification for the high multiple disappears. The multiple compresses from 60× to 20×, and even strong revenue growth can't prevent a 60% price decline if the multiple drops enough.",
    },
    {
      q: "ARK Innovation ETF rose 358% from 2019–2021 then fell 75% in 2022. What strategy does this illustrate?",
      choices: [
        "Value investing — buying cheap, beaten-down stocks",
        "Momentum/growth investing — concentration in high-growth names that reversed violently when rates rose",
        "Dividend investing — companies cut dividends during the downturn",
        "Index investing — the S&P 500 fell 75% in 2022",
      ],
      correct: 1,
      explain: "ARK concentrated in high-valuation, high-momentum growth stocks. This strategy thrived when rates were near zero and growth was rewarded. When rate hikes in 2022 compressed valuations across growth stocks, the momentum reversed violently. Prior winners became biggest losers — the classic momentum crash risk.",
    },
  ],
};

// ── Unit 8: Behavioral Finance ─────────────────────────────────────────────────

const U8_BEATS: StoryBeat[] = [
  {
    narrative: (
      <>
        <p>
          The research is remarkably consistent: <I>losses feel roughly twice as painful
          as equivalent gains feel good</I>. Daniel Kahneman and Amos Tversky won the Nobel
          Prize proving this in 1979 (Kahneman won; Tversky died before the prize was awarded).
          It&apos;s called <I>loss aversion</I>, and it is the most destructive force in
          personal investing.
        </p>
        <p>
          Loss aversion explains why investors hold losing stocks too long (refusing to
          &ldquo;realize&rdquo; a loss and make it real) and sell winning stocks too early
          (locking in the feel-good gain before it disappears). These two behaviors together
          produce portfolios that systematically keep the worst stocks and sell the best ones.
        </p>
      </>
    ),
    term: {
      name: "Loss Aversion",
      definition:
        "Loss aversion is the psychological phenomenon where the pain of a loss is approximately twice as intense as the pleasure of an equivalent gain. Losing $100 feels worse than gaining $100 feels good. This asymmetry causes investors to make irrational decisions: holding losing positions hoping to 'break even' before selling (letting losses compound), while selling profitable positions early to 'lock in' gains (cutting winners short). Both behaviors are the opposite of good investing.",
      impact:
        "A study by Odean (1998) analyzed 10,000 brokerage accounts and found that investors' winning stocks outperformed their losing stocks by 3.4% per year after sale — meaning investors systematically sold their best ideas and held their worst. The stocks they sold went on to beat the stocks they held. Loss aversion is why: the psychological cost of selling a loser is higher than the financial benefit of acting rationally.",
    },
    check: {
      q: "Loss aversion causes investors to make two specific mistakes at the same time. Which pair?",
      choices: [
        "Invest too early and withdraw too late",
        "Hold losing stocks too long and sell winning stocks too early",
        "Diversify too little and trade too frequently",
        "Borrow too much on margin and save too little cash",
      ],
      correct: 1,
      explain: "Loss aversion makes selling a losing stock feel more painful than the financial benefit justifies — so investors hold losers indefinitely, hoping to 'break even.' Meanwhile, the gain from a winning stock feels fragile, so they sell early to 'lock it in.' Result: portfolios full of losers with the winners already sold.",
    },
  },
  {
    narrative: (
      <>
        <p>
          <I>Recency bias</I> is the tendency to assume the recent past will continue into
          the near future. After a bull market run, investors expect the bull market to
          continue — and buy aggressively at the top. After a bear market crash, investors
          expect the crash to continue — and sell at the bottom.
        </p>
        <p>
          Retail investors, on average, buy the most shares at market peaks (when optimism
          is highest and prices are highest) and sell the most at market troughs (when
          pessimism is highest and prices are lowest). This pattern is so reliable that
          financial researchers call it the &ldquo;behavior gap&rdquo; — the gap between
          what the market returns and what the average investor actually earns.
        </p>
      </>
    ),
    term: {
      name: "Recency Bias",
      definition:
        "Recency bias is the cognitive tendency to overweight recent events and expect them to continue, while underweighting historical patterns and long-term probabilities. In markets: after a bull run, investors buy expecting more gains. After a crash, they sell expecting more losses. Both are wrong more often than right. Recency bias causes investors to buy high and sell low — the opposite of what they intend. Dollar-cost averaging is the mechanical antidote: it forces buying at all price levels regardless of recent direction.",
      impact:
        "Dalbar's annual QAIB (Quantitative Analysis of Investor Behavior) study consistently finds that the average equity fund investor earns 2–3% less per year than the funds they invest in — because they buy after funds perform well and sell after they perform poorly. Over 20 years, this 2% annual gap compounds to a 50% total performance deficit. Recency bias alone costs the average American hundreds of thousands in retirement savings.",
    },
    check: {
      q: "Dalbar's research shows average fund investors earn 2–3% less per year than the funds they're in. What drives this gap?",
      choices: [
        "Fund managers charge hidden fees that investors don't realize they're paying",
        "Investors buy after funds perform well (prices are high) and sell after funds perform poorly (prices are low)",
        "Most investors pick the wrong funds based on poor research",
        "Recency bias causes investors to hold too much cash rather than investing",
      ],
      correct: 1,
      explain: "The 'behavior gap' comes from timing errors: investors chase performance by buying high (after a good run attracts attention) and panic-sell low (after a crash feels unbearable). The fund's returns are fine; the investor's personal returns lag because they trade in and out at the wrong times.",
    },
  },
  {
    narrative: (
      <>
        <p>
          In early 2021, millions of retail investors piled into GameStop, AMC, and other
          meme stocks. A community on Reddit had identified a short squeeze opportunity.
          What followed was herding at internet scale: millions of people bought the same
          stocks at the same time for the same reason — because everyone else was.
        </p>
        <p>
          GameStop went from <B>$17 to $483</B> in 17 days. Then from $483 to $45 in the
          next 17 days. The hedge funds lost $12 billion. The retail investors who bought
          at the peak lost $13 billion. <I>Herding amplifies volatility and destroys
          wealth for the participants who arrive late.</I> The earlier adopters of the idea
          were right; the followers were making an entirely different bet — that the crowd
          would grow even larger.
        </p>
      </>
    ),
    term: {
      name: "Herding Behavior",
      definition:
        "Herding is the tendency to follow the actions of a larger group, especially in uncertain situations. In markets, herding means buying what everyone else is buying (momentum investing at the extreme) or selling when panic spreads. Herding is rational from an individual perspective (the group might know something you don't) but irrational at the aggregate level — when everyone does the same thing simultaneously, it amplifies price moves beyond fundamental value, creating bubbles and crashes.",
      impact:
        "The dot-com bubble of 1999–2000 was pure herding: stocks rose because other stocks were rising, which attracted more buyers, which pushed prices higher, which attracted more buyers. Cisco peaked at a P/E of 150. Amazon at a P/E of 600. The herd created prices that had nothing to do with business value — and the crash that followed destroyed $5 trillion in market value when the herd reversed.",
    },
    check: {
      q: "The GameStop squeeze of 2021 illustrates herding because...",
      choices: [
        "All hedge funds copied each other's long positions in GameStop",
        "Millions of retail investors bought the same stock simultaneously because everyone else was — amplifying the price far beyond its business value",
        "GameStop hired celebrities to promote its stock to retail investors",
        "Reddit users had inside information about GameStop's business turnaround",
      ],
      correct: 1,
      explain: "Herding is following the crowd rather than doing independent analysis. In the GameStop squeeze, retail investors weren't each doing separate research — they were all buying because everyone else was. When the crowd reversed, those who bought at the peak lost most of their investment. The original short-squeeze idea was valid; herding followers in at $400/share was not.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Research consistently finds that most investors do the opposite of what makes
          money: they sell winners (the disposition effect — a mix of loss aversion and
          locking-in-gains bias) and hold losers hoping they&apos;ll recover.
        </p>
        <p>
          The rational strategy is the reverse. Your winners are winners because the underlying
          thesis is playing out. Your losers might be losers because the thesis was wrong —
          or because the market temporarily mispriced them. The only question that matters is:
          <I> given everything I know now, would I buy this stock today at its current price?</I>
          If not, sell it. If yes, hold it — regardless of whether it&apos;s up or down from
          where you bought it.
        </p>
      </>
    ),
    term: {
      name: "The Disposition Effect",
      definition:
        "The disposition effect is the tendency to sell winning investments too early (to lock in a gain and avoid it reversing) and hold losing investments too long (to avoid realizing a loss). It was documented by Shefrin and Statman in 1985. It causes investors to build portfolios dominated by their worst investments — the ones they couldn't bring themselves to sell — while they systematically eliminate their best ones. The effect is stronger for retail investors than institutions but affects even professional managers.",
      impact:
        "In one study, the stocks investors sold for gains went on to earn 3.4% more over the next year than the stocks they sold for losses — meaning investors reliably sold the wrong things. If you find yourself holding a loss-making stock for months hoping it 'comes back,' ask yourself: would I buy this stock today, right now, at this price? If the honest answer is no — that's the disposition effect keeping you in a bad position.",
    },
    check: {
      q: "You bought a stock at $80. It's now at $40. What is the most rational question to ask?",
      choices: [
        "How long will it take for this stock to get back to $80?",
        "Should I buy more shares to lower my average cost?",
        "Would I buy this stock today at $40, given what I know now about the business?",
        "What did the analyst price target say when I bought it?",
      ],
      correct: 2,
      explain: "The disposition effect anchors you to your purchase price. The rational question completely ignores what you paid: given current information, is $40 a good price to own this business? If yes, hold or buy more. If no, sell — regardless of what you paid. Your $80 is gone either way; the only question is what to do with your $40.",
    },
  },
  {
    narrative: (
      <>
        <p>
          In early 2021, imagine a technology investor convinced that Peloton was the future
          of fitness. Every article they read confirmed this. Every analyst they followed was
          bullish. Every podcast featured Peloton executives discussing explosive growth. The
          stock was at <B>$145</B>. They bought more. Within 12 months, Peloton was at{" "}
          <B>$23</B> — a 84% loss.
        </p>
        <p>
          The investor hadn&apos;t been lazy. They had been consuming enormous amounts of
          information. But all of it confirmed what they already believed. They never seriously
          engaged with a single bear case. This is <I>confirmation bias</I> — perhaps the
          most dangerous cognitive trap in investing, because it feels like thorough research
          while systematically filtering out the information most likely to prevent a mistake.
        </p>
      </>
    ),
    term: {
      name: "Confirmation Bias",
      definition:
        "Confirmation bias is the tendency to search for, interpret, favor, and recall information that confirms what you already believe — while filtering out contradicting evidence. In investing: reading only bullish articles about stocks you own, dismissing negative news as 'overblown,' seeking out analysts who agree with your thesis, and interpreting ambiguous data in the most favorable light. The antidote: actively seek out the strongest possible bear case for any investment you hold. Write down the three most compelling arguments that your thesis is wrong. If you can't articulate them, you haven't done the research — you've done the confirmation.",
      impact:
        "A University of California study found that investors who consumed more financial news about their holdings experienced 1.9% lower returns annually than investors who consumed less news — because they selectively absorbed information that confirmed their existing positions. The extra information consumption wasn't neutral; it reinforced existing biases rather than updating beliefs. Peloton bulls in 2021 dismissed mounting evidence of post-COVID demand normalization, supply chain problems, and competitive pressure. The bear thesis was there in plain sight in every quarterly report — but confirmation bias filtered it out.",
    },
    check: {
      q: "What is the best antidote to confirmation bias when researching a stock?",
      choices: [
        "Read only bullish analyst reports to stay confident and optimistic",
        "Avoid reading any news about stocks you own to stay objective",
        "Actively seek out the strongest bear case — the best arguments that your thesis is wrong",
        "Only invest in companies you've personally used as a customer",
      ],
      correct: 2,
      explain: "Confirmation bias is insidious because it feels like thorough research. The antidote: force yourself to find and read the strongest bear case. Write down the three best arguments that your investment thesis is wrong. If you can't articulate them, you haven't done real research — you've done confirmation.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Between 2012 and 2021, millions of retail investors experienced a decade of almost
          uninterrupted bull market gains. Many had never seen a significant bear market. Many
          had made real money on their first trades. Research shows consistently that after a
          series of early wins, investors dramatically overestimate their ability to select
          stocks — leading to concentrated positions, reduced diversification, and excessive
          trading.
        </p>
        <p>
          Then 2022 arrived. The strategies that had worked in a bull market — concentrated
          bets in high-growth stocks — imploded. The confident, experienced-feeling investors
          of 2021 turned out to have been riding a rising tide. When the tide went out, as
          Buffett put it, they discovered they had been swimming naked. Their &ldquo;skill&rdquo;
          was largely market beta.
        </p>
      </>
    ),
    term: {
      name: "Overconfidence Bias",
      definition:
        "Overconfidence bias is the tendency to overestimate the accuracy of one's own predictions and the extent of one's own knowledge. Research shows investors rate themselves as above-average stock pickers at rates statistically impossible to satisfy. Key manifestations: overtrading (buying and selling too frequently, generating costs that erode returns), under-diversification (concentrating in a few names you're 'sure about'), and excessive risk-taking. A landmark Barber and Odean study (2000) found that active traders earned 2.65% less annually than the market — almost entirely explained by overconfidence driving excessive trading.",
      impact:
        "After the 2012–2021 bull market, retail investors who had been right about 'stocks always go up' began applying that confidence to individual stock picks. Average retail investor losses in 2022 concentrated positions were 30–50%, versus the market's −18%. The S&P SPIVA data shows investor confidence tracks bull market duration — the longer the bull market, the more overconfident investors become, and the more severely they underperform when conditions change. The antidote: track your actual investment decisions and outcomes over 3–5 years before concluding you have genuine stock-picking ability.",
    },
    check: {
      q: "Research shows active traders earn 2.65% less per year than the market. What is the main cause?",
      choices: [
        "They invest in low-quality companies with weak fundamentals",
        "They pay too much in capital gains taxes by selling too quickly",
        "Overconfidence drives excessive trading that generates costs and locks in bad decisions",
        "They concentrate entirely in bonds rather than stocks",
      ],
      correct: 2,
      explain: "Barber and Odean's landmark study found overconfident investors trade more frequently — and the more they trade, the worse they do. Each unnecessary trade costs money in commissions and spreads, and overtrading locks in losses and misses recoveries. A long bull market run often reflects market beta, not personal skill.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Imagine you bought a stock at <B>$100</B>. It falls to $65. Every week, you check
          it and think: &ldquo;it just needs to get back to $100.&rdquo; You hold. It falls
          to $40. You hold harder. It falls to $20. You hold longest. The $100 purchase price
          has become an invisible anchor — a psychological reference point that has nothing to
          do with the stock&apos;s future value but determines every decision you make.
        </p>
        <p>
          The rational investor asks: &ldquo;given what I know today, would I buy this stock
          at $40?&rdquo; The anchored investor asks: &ldquo;how do I get back to breakeven?&rdquo;
          One question is relevant to the future. The other is an emotional trap about the past.
          The $100 you paid is <I>sunk cost</I> — gone regardless of your future decisions.
          Anchoring converts sunk cost into a decision-making input that systematically holds
          investors in their worst positions longest.
        </p>
      </>
    ),
    term: {
      name: "Anchoring Bias",
      definition:
        "Anchoring is the cognitive tendency to rely too heavily on the first piece of information encountered when making decisions. In investing, common anchors include: your purchase price (causing you to hold losers waiting for breakeven), a stock's all-time high (causing you to avoid a recovery because 'it used to be higher'), or an analyst's price target (causing you to believe a round number like '$200' is especially meaningful). These reference points have no bearing on a stock's future value but powerfully shape how investors evaluate every subsequent piece of information.",
      impact:
        "A CFA Institute study found the 52-week high is the single most powerful external anchor in retail investing — investors consistently set price targets relative to it, even when it's completely arbitrary from a fundamental perspective. Intel's stock peaked at $68 in 2000, anchoring many investors to a recovery thesis for over two decades as the business deteriorated against AMD and ARM competition. Intel fell from $68 in 2000 to $18 in 2024 — 24 years of investors anchored to a peak that reflected semiconductor market conditions that no longer existed. Your purchase price tells you your cost basis for taxes. It tells you nothing about what the stock is worth today.",
    },
    check: {
      q: "Intel peaked at $68 in 2000 and fell to $18 by 2024. Anchoring bias caused many investors to...",
      choices: [
        "Sell their Intel shares quickly right after the initial price drop",
        "Hold Intel for decades waiting to 'get back to $68,' even as the business deteriorated against AMD and ARM",
        "Identify Intel as a value stock at $18 and buy aggressively",
        "Avoid Intel entirely because the price had been too high at $68",
      ],
      correct: 1,
      explain: "Anchoring to a past price high keeps investors in deteriorating businesses far too long. The $68 peak reflected 2000-era conditions that no longer existed. The rational test: is Intel, at $18, worth owning given today's competitive landscape? The anchor price is completely irrelevant to that forward-looking question.",
    },
  },
];

const U8: StockUnit = {
  num: 8,
  slug: "unit-8",
  title: "Behavioral Finance",
  accent: "#6d28d9",
  previewHook: "Researchers threw darts at the Wall Street Journal for 15 years. Their portfolio beat 90% of professionals. Not because darts are magic.",
  concepts: ["Loss aversion", "Recency bias", "Herding", "The disposition effect"],
  hook: {
    title: "The Dartboard Portfolio",
    setup: (
      <>
        <p>
          For 15 years, researchers at various institutions set up an experiment: throw darts at the
          Wall Street Journal stock listings and track the resulting &ldquo;portfolio.&rdquo;
          They tracked the darts annually and compared results against professional fund managers.
        </p>
        <p>
          The darts beat <strong>over 90%</strong> of professional managers — not just once, but
          consistently across years.
        </p>
      </>
    ),
    question: "If darts beat professionals, what does that tell you about professional stock picking?",
    reveal: {
      stat: "It's not about picking — it's about not losing to yourself",
      statSub: "the biggest threat to your returns is your own psychology",
      explanation:
        "Professional fund managers aren't beaten by darts because darts are smart — they're beaten because professionals are human. They herd, they chase momentum, they chase performance metrics that their clients demand. Their biases are amplified by career risk. The average investor's worst enemy isn't the market or even the economy — it's their own behavioral tendencies to buy high and sell low.",
    },
    sandbox: <BiasSandboxHook accent="#6d28d9" />,
  },
  lesson: {
    title: "The Enemy in the Mirror",
    character: "A story about the four cognitive traps that destroy investor returns",
    beats: U8_BEATS,
    ctaLabel: "Review Your Portfolio →",
    ctaSubtitle: "Look at your holdings. Are you holding losers too long? Did you sell a winner too early?",
  },
  mission: {
    title: "Mission 8: Portfolio Audit",
    description:
      "Open your portfolio and answer honestly: are you holding any stock only because you don't want to realize the loss? If so, ask yourself the core question: would you buy it today at today's price? If not, sell it and redeploy the capital.",
    steps: [
      "Review each position in your portfolio",
      "For each position at a loss, ask: would I buy this today at this price?",
      "If no, sell it (even in the simulator — practice the discipline)",
      "Buy something you'd actually buy today",
    ],
  },
  unitQuiz: [
    {
      q: "Loss aversion means the pain of losing $100 feels...",
      choices: [
        "About the same as the pleasure of gaining $100",
        "About twice as intense as the pleasure of gaining $100",
        "About ten times more intense than gaining $100",
        "Less intense than the pleasure of gaining — losses are easier to absorb",
      ],
      correct: 1,
      explain: "Kahneman and Tversky's research showed that losses feel approximately twice as painful as equivalent gains feel good. This asymmetry drives irrational decisions — holding losing stocks to avoid 'realizing' the pain, and selling winners early before the gains can disappear.",
    },
    {
      q: "Dalbar's study shows average fund investors earn 2–3% less per year than the funds they invest in. What drives this gap?",
      choices: [
        "Hidden fees that aren't disclosed in fund marketing materials",
        "Poor fund performance — most funds underperform the market anyway",
        "Behavioral timing errors: buying after good performance (high prices) and selling after bad performance (low prices)",
        "Overconcentration in a few large-cap tech stocks",
      ],
      correct: 2,
      explain: "The 'behavior gap' comes from timing: investors buy high (after a good run attracts their attention) and sell low (after a crash feels unbearable). The fund's actual returns are fine; the investor's personal returns lag because they trade in and out at the worst possible times.",
    },
    {
      q: "The disposition effect causes investors to build portfolios that systematically...",
      choices: [
        "Outperform the market because they keep only the best stocks",
        "Hold the worst stocks and sell the best ones — the opposite of what makes money",
        "Diversify across too many stocks, reducing overall returns",
        "Concentrate too heavily in defensive stocks during bull markets",
      ],
      correct: 1,
      explain: "Research found that the stocks investors sold for gains went on to outperform the stocks they held by 3.4% per year. The disposition effect — selling winners and holding losers — reliably puts investors in the wrong positions. The question to break this bias: 'Would I buy this today at this price?' applies to every holding.",
    },
    {
      q: "Confirmation bias is most dangerous for investors because it...",
      choices: [
        "Causes you to trade too frequently, generating excessive fees",
        "Feels like thorough research while systematically filtering out the information most likely to prevent a mistake",
        "Leads you to diversify across too many sectors",
        "Makes you sell too early when your thesis is actually playing out correctly",
      ],
      correct: 1,
      explain: "Confirmation bias is insidious: it doesn't feel like a mistake — it feels like diligent research. The more articles you read confirming your thesis, the more confident you feel, even though you're avoiding the evidence that would correct your error. The antidote: actively seek out the strongest bear case before buying.",
    },
    {
      q: "The best practical test to overcome anchoring bias when evaluating a losing position is...",
      choices: [
        "Compare the stock to its 52-week high to gauge recovery potential",
        "Hold the stock until it returns to your purchase price, then decide",
        "Ask: 'Would I buy this stock today at this current price?' — independent of what you paid",
        "Automatically sell any time a stock drops 20% from your purchase price",
      ],
      correct: 2,
      explain: "Your purchase price is sunk cost — it's gone regardless of what you decide. The only forward-looking question is: given what I know about this business today, is the current price a good entry point? If you'd answer no, the anchoring to your purchase price is keeping you in a position you shouldn't be in.",
    },
  ],
};

// ── Unit 9: Advanced Mechanics ─────────────────────────────────────────────────

const U9_BEATS: StoryBeat[] = [
  {
    narrative: (
      <>
        <p>
          Short selling inverts the normal investing logic. Instead of buying low and hoping to
          sell high, a short seller <I>borrows</I> shares from their broker, sells them at
          the current high price, then hopes to buy them back at a lower price later and return
          them — pocketing the difference.
        </p>
        <p>
          The risk is asymmetric in a terrifying way: if you buy a stock, the most you can
          lose is 100% (the stock goes to zero). If you short a stock, your potential loss is
          theoretically <I>unlimited</I> — the stock can keep rising forever, and every dollar
          it rises costs you a dollar you don&apos;t have. This is what happened in the
          Volkswagen short squeeze.
        </p>
      </>
    ),
    term: {
      name: "Short Selling",
      definition:
        "Short selling means borrowing shares of a stock (from your broker, who borrows them from institutional holders) and selling them immediately at the current price. You now owe the broker those shares back. If the price falls, you buy the shares back at the lower price, return them, and keep the difference. If the price rises, you still have to return the shares — buying them back at a higher price, taking a loss. Short selling requires a margin account and pays the borrow fee (the cost to 'rent' the shares).",
      impact:
        "In October 2008, Porsche secretly accumulated 74% of Volkswagen's shares. Hedge funds had shorted 12% of shares. When Porsche disclosed its position, there weren't enough shares to buy back — short sellers rushed to cover, driving VW from €200 to €1,005/share in 48 hours. Volkswagen briefly became the world's most valuable company. Hedge funds lost €30 billion in one of history's most famous short squeezes.",
    },
    check: {
      q: "If you buy a stock, your maximum possible loss is 100%. What is the maximum possible loss when you short a stock?",
      choices: [
        "Also 100% — same risk as a regular stock purchase",
        "50% — regulated by broker margin requirements",
        "200% — twice the original amount borrowed",
        "Theoretically unlimited — the stock can keep rising forever, increasing your loss",
      ],
      correct: 3,
      explain: "When you buy a stock, the worst case is it falls to zero — a 100% loss. When you short, you profit if it falls. But if it rises, you owe the difference — and since a stock price has no theoretical ceiling, your potential loss is unlimited. The VW short squeeze showed exactly this: shorts at €200 watched it hit €1,005.",
    },
  },
  {
    narrative: (
      <>
        <p>
          An <I>option</I> is a contract that gives you the right — but not the obligation —
          to buy or sell a stock at a specific price (the <I>strike price</I>) before a specific
          date (the <I>expiration date</I>). A <I>call option</I> gives you the right to buy;
          a <I>put option</I> gives you the right to sell.
        </p>
        <p>
          Options are among the most powerful financial instruments ever created — and among
          the most dangerous for inexperienced traders. A call option on Apple with a strike of
          $220 expiring in 30 days might cost <B>$3.00</B> (covering 100 shares = $300 total).
          If Apple rises to $240, that option is worth <B>$20.00</B> ($2,000 total) — a 567%
          return on the premium paid. If Apple stays below $220, the option expires worthless
          and you lose the entire $300.
        </p>
      </>
    ),
    term: {
      name: "Options: Calls and Puts",
      definition:
        "Call option: gives the buyer the right to purchase 100 shares of a stock at the strike price before expiration. Profitable when the stock rises above the strike price + premium paid. Put option: gives the buyer the right to sell 100 shares at the strike price before expiration. Profitable when the stock falls below the strike price minus premium paid. Options enable leverage (controlling large positions with small capital) and hedging (protecting existing positions from downside). They can expire worthless — losing 100% of the premium — if the stock doesn't move as expected.",
      impact:
        "Masayoshi Son, CEO of SoftBank, became one of Japan's richest men buying internet stocks in 1999–2000. He then lost more money than anyone in history to that point — $70 billion — when they crashed. In 2020, SoftBank secretly bought billions in call options on tech stocks, driving a gamma squeeze in Nasdaq stocks. Options at scale don't just reflect the market — they can move it.",
    },
    check: {
      q: "You buy a call option on Apple with a strike price of $220 for $3.00 per share (covering 100 shares). What right does this give you?",
      choices: [
        "The right to sell 100 Apple shares at $220 before expiration",
        "The right to buy 100 Apple shares at $220 before expiration",
        "The right to receive $3.00 per share in Apple dividends quarterly",
        "The right to borrow 100 Apple shares from your broker to short",
      ],
      correct: 1,
      explain: "A call option gives you the right — not the obligation — to buy shares at the strike price before expiration. If Apple rises to $240, your right to buy at $220 is worth $20/share ($2,000 total) — a big gain on your $300 investment. If it stays below $220, the option expires worthless and you lose the $300 premium.",
    },
  },
  {
    narrative: (
      <>
        <p>
          An ETF — Exchange-Traded Fund — is a basket of securities that trades like a single
          stock. The SPDR S&P 500 ETF (SPY) holds all 500 S&P 500 companies and can be bought
          or sold any time markets are open, just like buying Apple stock. The expense ratio is{" "}
          <B>0.09%/year</B> — 9 cents per year on a $100 investment.
        </p>
        <p>
          ETFs exist for every imaginable segment: technology (QQQ), gold (GLD), emerging
          markets (VWO), clean energy (ICLN), dividend stocks (VYM), bonds (BND). They
          let you express any investment thesis without picking individual stocks.
          Most professional advisors recommend ETFs as the core of most retail portfolios.
        </p>
      </>
    ),
    term: {
      name: "ETFs — Exchange-Traded Funds",
      definition:
        "An ETF is a fund that holds a basket of securities (stocks, bonds, commodities) and trades on a stock exchange like a single share. ETFs offer instant diversification, low costs, tax efficiency, and intraday liquidity. Unlike mutual funds (which price once per day at market close), ETFs can be bought and sold any time during market hours. Index ETFs passively track an index; actively managed ETFs employ portfolio managers to pick securities.",
      impact:
        "The three largest ETFs by assets — SPY (S&P 500), VOO (Vanguard S&P 500), and IVV (iShares Core S&P 500) — hold a combined $1.3 trillion. By owning any one of them, a retail investor instantly owns a proportional stake in Apple, Microsoft, Nvidia, Amazon, Alphabet, Meta, and 494 other companies — with one click and a 0.03–0.09% annual fee. ETFs democratized institutional-grade diversification for every investor.",
    },
    check: {
      q: "What makes ETFs especially useful for a new investor compared to picking individual stocks?",
      choices: [
        "ETFs always outperform individual stocks over any time period",
        "ETFs are completely risk-free — they're guaranteed by the government",
        "One purchase gives instant diversification across hundreds of companies at very low annual cost",
        "ETFs pay higher dividends than individual stocks in the same sectors",
      ],
      correct: 2,
      explain: "Buying SPY gives you proportional ownership in 500 companies — Apple, Microsoft, Amazon, and 497 others — with one click and about $0.09 per $100 invested annually. No other tool gives a retail investor such efficient, broad diversification at such low cost. That's why professional advisors recommend ETFs as the core of most retail portfolios.",
    },
  },
  {
    narrative: (
      <>
        <p>
          <I>Leverage</I> means borrowing money to amplify investment returns — and losses.
          If you buy $10,000 of stock on 2× margin, you&apos;re borrowing $5,000 from your
          broker to control $10,000 in assets. If the stock rises 10%, you gain $1,000 on
          your $5,000 of your own capital — a 20% return. If it falls 10%, you lose $1,000
          from your $5,000 — a 20% loss. And if it falls 50%, you&apos;ve lost everything
          and owe the broker money.
        </p>
        <p>
          Long-Term Capital Management — a hedge fund run by two Nobel Prize winners and the
          former head of the Fed&apos;s bond desk — used leverage of up to <B>25:1</B>.
          When Russian bonds defaulted in 1998, their models failed to predict the
          correlation of cascading losses. They nearly collapsed global financial markets.
          The Fed organized a $3.6 billion bailout.
        </p>
      </>
    ),
    term: {
      name: "Leverage & Risk",
      definition:
        "Leverage means using borrowed capital to increase investment exposure. If you have $10,000 and borrow another $10,000 to buy $20,000 of stocks, you're at 2× leverage. Gains and losses are both doubled relative to your actual capital. Leverage amplifies every outcome — in bull markets, leveraged investors look like geniuses; in bear markets, they can be wiped out entirely. Margin calls force the sale of positions at the worst possible times when prices fall and equity drops below required minimums.",
      impact:
        "LTCM's collapse in 1998 with 25× leverage showed that even the most sophisticated mathematical models fail under extreme conditions. When correlation assumptions broke down — assets that were supposed to be uncorrelated started moving together — the fund lost $4.4 billion in months. The Fed had to intervene to prevent a cascade of bank failures. Leverage transforms a 20% market decline into a 500% loss of capital at 25× leverage.",
    },
    check: {
      q: "You use 2× leverage with $5,000 of your own money (controlling $10,000 total). The investment falls 50%. What happens?",
      choices: [
        "You lose $2,500 — half of your personal $5,000",
        "You lose your entire $5,000 investment and may owe money to your broker",
        "Your broker covers the losses above your initial $5,000",
        "You lose $5,000 but owe nothing additional since that's all you contributed",
      ],
      correct: 1,
      explain: "With 2× leverage, a 50% decline in the $10,000 position equals a $5,000 loss — which wipes out your entire $5,000 equity. You've lost 100% of your capital on a 50% market move. At LTCM's 25× leverage, even a tiny 4% adverse move would wipe out all equity — which is why small correlation breakdowns were catastrophic.",
    },
  },
  {
    narrative: (
      <>
        <p>
          In the summer of 2020, Robinhood had a problem. Its margin accounts allowed users
          to borrow money to amplify trades. A 19-year-old in Nebraska opened one and, through
          a series of options trades, saw a displayed balance of negative <B>$730,000</B>.
          Believing he owed $730,000, he died by suicide before understanding the balance
          would resolve to zero. The displayed number was a glitch — but the danger of margin
          accounts is very real.
        </p>
        <p>
          A margin account lets you borrow from your broker — typically up to 50% of your
          portfolio value — to buy more stocks than cash allows. If your portfolio is $10,000,
          you can control $20,000 in assets. When stocks rise, returns are amplified. When
          stocks fall past a threshold, your broker issues a <I>margin call</I>: add cash
          immediately, or they sell your positions — at the worst possible time, with zero
          input from you.
        </p>
      </>
    ),
    term: {
      name: "Margin Accounts",
      definition:
        "A margin account allows an investor to borrow from their broker to increase investment exposure. Regulation T (the SEC rule) sets initial margin at 50% for stocks — you can borrow up to 50% of a stock purchase. Maintenance margin (typically 25%) is the minimum equity required to keep positions open. If your equity falls below maintenance margin, a margin call requires immediate cash deposit or forced position liquidation. Margin borrowing costs interest (5–12%+ annually depending on broker and account size). Margin amplifies both gains and losses proportionally to the leverage ratio used.",
      impact:
        "During the 2020 COVID crash, thousands of retail margin account holders received margin calls as stocks fell 34% in 3 weeks. Their brokers automatically sold positions at the bottom — locking in maximum losses and permanently converting temporary paper losses into real capital destruction. The same investors using cash accounts could have simply waited for the recovery (the market fully recovered within 5 months). Margin calls force selling at exactly the wrong time. It's a tool that experienced traders use carefully and sparingly — and that most retail investors should understand before ever enabling.",
    },
    check: {
      q: "What is a margin call?",
      choices: [
        "A phone call from your broker recommending a new stock to buy",
        "A request to pay back margin loans when the market rises",
        "A demand to deposit more cash or sell holdings because your account fell below the minimum equity requirement",
        "A penalty charged when you hold a position overnight",
      ],
      correct: 2,
      explain: "A margin call happens when your account's equity drops below the broker's maintenance margin (typically 25%). Your broker demands you deposit more cash immediately — or they will sell your positions for you. This often happens during crashes, forcing you to sell at the worst possible time.",
    },
  },
  {
    narrative: (
      <>
        <p>
          In December 2021, an investor had a problem: massive gains in Apple (+35%) and
          Microsoft (+52%), but also held Zoom Video, which had fallen <B>62%</B> from its
          pandemic peak. The tax bill on the Apple and Microsoft gains would be substantial.
          An accountant pointed out a legal strategy: sell Zoom before year-end, use that
          realized loss to offset the Apple/Microsoft gains, and reduce the tax bill by
          thousands of dollars. Then, 31 days later, buy Zoom back.
        </p>
        <p>
          This is <I>tax-loss harvesting</I> — deliberately realizing investment losses to
          offset taxable gains. It doesn&apos;t change your total investment position. It
          doesn&apos;t eliminate losses. It converts unrealized losses into tax savings. Done
          systematically, it can add <B>0.5–1.5%</B> per year in after-tax returns — a
          meaningful, legal, and reliable edge.
        </p>
      </>
    ),
    term: {
      name: "Tax-Loss Harvesting",
      definition:
        "Tax-loss harvesting is selling investments at a loss to offset capital gains taxes on profitable investments. Short-term capital gains (assets held < 1 year) are taxed at ordinary income rates (up to 37%). Long-term capital gains (> 1 year) are taxed at 0%, 15%, or 20%. Harvested losses offset same-type gains first, then cross-offset. Excess losses offset up to $3,000 of ordinary income annually, with remaining losses carried forward indefinitely. The IRS wash-sale rule prohibits buying a 'substantially identical' security within 30 days before or after the sale — but a similar ETF or competitor stock can substitute, maintaining market exposure.",
      impact:
        "Betterment (robo-advisor) reported its automated tax-loss harvesting added an average of 0.77% annually in after-tax return for clients in higher tax brackets. For an investor in the 37% bracket, avoiding a $10,000 short-term gain by harvesting an equivalent loss saves $3,700 in taxes — money that remains invested and compounds. Done manually each December, tax-loss harvesting is one of the few genuine 'free lunches' in investing: a legal, reliable way to improve after-tax returns without changing your risk profile or investment thesis.",
    },
    check: {
      q: "The IRS wash-sale rule says you cannot buy back a 'substantially identical' security within how many days of selling it at a loss?",
      choices: [
        "7 days",
        "30 days",
        "60 days",
        "90 days",
      ],
      correct: 1,
      explain: "The wash-sale rule blocks you from buying back the same (or substantially identical) security within 30 days before or after selling it for a loss. If you do, the IRS disallows the tax loss. The workaround: buy a similar-but-different security (e.g., a competitor stock or a different ETF tracking the same sector) to keep your market exposure while still claiming the loss.",
    },
  },
  {
    narrative: (
      <>
        <p>
          On a typical day, the NYSE processes over <B>1 billion</B> shares traded.
          Approximately <B>60–70%</B> are executed by algorithms — automated systems that
          detect patterns and execute trades in microseconds. The most advanced, known as
          high-frequency traders (HFT firms), co-locate servers inside exchange data centers
          to shave nanoseconds off response times. The competitive advantage is measured in
          millionths of a second.
        </p>
        <p>
          Michael Lewis&apos;s book <I>Flash Boys</I> exposed how HFT firms could detect a
          buy order arriving at one exchange and trade on other exchanges in the microseconds
          before the order arrived — effectively front-running retail orders at speeds humans
          cannot compete with. For a long-term investor, this is irrelevant noise. For day
          traders, it&apos;s an invisible opponent they can never beat on speed alone.
        </p>
      </>
    ),
    term: {
      name: "Algorithmic & High-Frequency Trading",
      definition:
        "Algorithmic trading uses computer programs to execute trades based on predefined rules — no human intervention required. High-frequency trading (HFT) is algorithmic trading at extreme speeds, executing thousands of transactions per second, profiting from tiny price discrepancies. HFT firms profit from: market making (providing liquidity for the bid-ask spread), statistical arbitrage (exploiting price discrepancies between correlated securities), and latency arbitrage (trading faster than competitors). HFT accounts for 50–70% of U.S. equity volume by trade count, though a smaller fraction by dollar value.",
      impact:
        "For a buy-and-hold investor, HFT is largely irrelevant — you trade rarely, and HFT firms make fractions of a cent per share. In aggregate, HFT market makers have tightened bid-ask spreads significantly, reducing transaction costs for all investors. But for active day traders, HFT is an arms race already lost. Renaissance Technologies — the most successful hedge fund in history — runs the most sophisticated quantitative trading operation ever built and has returned 66% annually before fees since 1988. The lesson: competing on speed is impossible for retail investors. Competing on patience and information quality is where retail investors have genuine structural advantages.",
    },
    check: {
      q: "Why do high-frequency trading (HFT) firms co-locate their servers inside exchange data centers?",
      choices: [
        "To get cheaper rent than regular office buildings",
        "To shave microseconds off their trade execution time",
        "To access better research reports before other investors",
        "To avoid paying the standard commission rates",
      ],
      correct: 1,
      explain: "HFT firms pay for co-location — placing their servers physically inside the exchange building — to cut the time it takes for their orders to reach the matching engine. Being microseconds closer literally makes them faster than competitors. For long-term investors, none of this matters — but it's a key reason day traders face a nearly impossible speed disadvantage against HFT firms.",
    },
  },
];

const U9: StockUnit = {
  num: 9,
  slug: "unit-9",
  title: "Advanced Mechanics",
  accent: "#0f172a",
  previewHook: "Long-Term Capital Management had two Nobel winners on staff. They nearly collapsed global financial markets. The Fed had to step in.",
  concepts: ["Short selling", "Options basics", "ETFs", "Leverage & risk"],
  hook: {
    title: "The World's Most Valuable Company for 48 Hours",
    setup: (
      <>
        <p>
          In October 2008, Volkswagen briefly became the most valuable company in the world —
          worth more than ExxonMobil, GE, and Google combined. It lasted{" "}
          <strong>48 hours</strong>. The stock went from €200 to €1,005/share.
        </p>
        <p>
          It wasn&apos;t because Volkswagen suddenly became a better business.
        </p>
      </>
    ),
    question: "How does a car company become the world's most valuable company overnight?",
    reveal: {
      stat: "A short squeeze",
      statSub: "hedge funds had shorted 12% of shares — and Porsche secretly owned 74%",
      explanation:
        "Short sellers borrow shares and sell them, betting the price will fall. When Porsche revealed it secretly owned 74% of VW (leaving less than 6% of shares freely available), hedge funds who had shorted 12% of shares had nowhere to buy. They rushed to cover, each purchase driving the price higher, which forced more covering. VW briefly hit €1,005/share. Hedge funds lost €30 billion in 48 hours. Understanding short selling explains why short squeezes happen — and why they eventually end.",
    },
  },
  lesson: {
    title: "The Tools of the Professionals",
    character: "A story about the mechanics that Wall Street uses — and why most retail investors should know them but not use them",
    beats: U9_BEATS,
    ctaLabel: "Advanced Trade →",
    ctaSubtitle: "Consider adding an ETF to your portfolio — it's the most professional tool available to retail investors.",
  },
  mission: {
    title: "Mission 9: Add an ETF",
    description:
      "The most sophisticated thing most retail investors can do is buy a broad market ETF and hold. Add one ETF to your portfolio — SPY (S&P 500), QQQ (NASDAQ-100), or one sector ETF that matches your thesis.",
    steps: [
      "Search for SPY, QQQ, or a sector ETF in the trade simulator",
      "Buy at least 1 share",
      "Compare its daily movement to your individual stock holdings",
      "Notice how it moves more smoothly — that's diversification at work",
    ],
    tickerSuggestion: "SPY",
  },
  unitQuiz: [
    {
      q: "A short seller borrows 100 shares of a stock at $50 and sells them. The stock rises to $80. What is the short seller's loss?",
      choices: [
        "$3,000 — the difference between $80 and $50, times 100 shares",
        "$5,000 — the original value of the shares borrowed",
        "$8,000 — the current value of all 100 shares",
        "Nothing — the loss is capped at the original $50 price",
      ],
      correct: 0,
      explain: "The short seller must buy back the 100 shares to return them. At $80, that costs $8,000. They sold for $5,000 originally, so the loss is $8,000 − $5,000 = $3,000. Short selling has theoretically unlimited loss potential since there's no ceiling on how high a stock can rise.",
    },
    {
      q: "You buy a call option on a stock at a strike price of $100, expiring in 3 months, for a $5 premium. What is the most you can lose?",
      choices: [
        "$100 — the strike price of the option",
        "$5 — the premium you paid",
        "Unlimited — options can lose more than their purchase price",
        "$95 — the difference between the premium and the strike price",
      ],
      correct: 1,
      explain: "With a call option, your maximum loss is always the premium you paid — in this case, $5 per share. If the stock stays below $100 and the option expires worthless, you lose only that $5 premium. Unlike shorting a stock, buying options limits your downside to the purchase price.",
    },
    {
      q: "Which of the following best describes why ETFs are popular with both beginners and professional investors?",
      choices: [
        "They guarantee higher returns than individual stocks",
        "They are actively managed by professionals who beat the market",
        "They offer instant diversification and low costs in a single, easy-to-trade security",
        "They are only available to investors with brokerage accounts over $50,000",
      ],
      correct: 2,
      explain: "ETFs (Exchange-Traded Funds) hold a basket of stocks (or bonds), giving you instant diversification — owning SPY means you hold all 500 S&P 500 companies at once. They trade like stocks, have very low expense ratios (often 0.03%–0.20%), and require no minimum investment beyond one share. That combination of simplicity and effectiveness makes them useful for everyone.",
    },
    {
      q: "Why did the IRS create the wash-sale rule?",
      choices: [
        "To prevent investors from trading too frequently and destabilizing markets",
        "To stop investors from selling a loss just for the tax benefit and immediately buying the same thing back",
        "To limit how much money can be moved between stocks and bonds each year",
        "To require investors to hold winning stocks for at least one year before selling",
      ],
      correct: 1,
      explain: "The wash-sale rule targets a tax loophole: without it, you could sell a losing stock on December 31st (to claim the tax loss), buy it back on January 1st, and have the exact same investment — but a tax deduction. The rule says if you buy the same or substantially identical security within 30 days, you can't claim the loss. It prevents you from harvesting a tax benefit without any real change in your investment.",
    },
    {
      q: "A retail investor using a cash account watches their stock fall 35% during a market crash. What advantage do they have over a margin account investor during this downturn?",
      choices: [
        "They can buy more shares using the broker's money at no cost",
        "They are insured by the FDIC against investment losses",
        "They don't face margin calls, so they can hold through the crash without being forced to sell",
        "Their losses are capped at 20% by federal securities law",
      ],
      correct: 2,
      explain: "Cash account investors can simply wait — they own their shares outright and no broker can force them to sell. Margin account investors can receive a margin call when their equity falls below the maintenance threshold, forcing them to sell at the worst possible time. During the 2020 COVID crash, the market fell 34% and then fully recovered within 5 months — margin investors forced to sell at the bottom missed the entire recovery.",
    },
  ],
};

// ── Unit 10 — Time Value of Money & Compounding ────────────────────────────────

const U10_BEATS: StoryBeat[] = [
  {
    narrative: (
      <>
        <p>
          Here&apos;s a rule that works on any napkin: divide <B>72</B> by your annual
          investment return, and you get the number of years it takes your money to double.
          Earning 7% per year? Your money doubles in roughly 10 years (72 ÷ 7 = 10.3). Earning
          12%? It doubles in 6 years. This is called the <I>Rule of 72</I>, and it&apos;s the
          fastest way to gut-check any investment.
        </p>
        <p>
          Ronald Read — the Vermont janitor who died with $8 million — likely never calculated
          a formal compound interest formula in his life. But he understood the essence: buy
          solid businesses, reinvest dividends, and wait long enough for the doubling to stack.
          With a 7% return, his money doubled in 10 years, then doubled again, then again.
          Three doublings from age 30 to 60 turns $10,000 into $80,000. Four doublings turns it
          into $160,000. The math is not complex — it&apos;s just patient.
        </p>
      </>
    ),
    term: {
      name: "Rule of 72",
      definition:
        "The Rule of 72 is a mental shortcut: divide 72 by your annual return rate (%) to estimate how many years your money takes to double. At 6% annual return: 72 ÷ 6 = 12 years to double. At 9%: 8 years. At 12%: 6 years. It works because of logarithmic math — ln(2) ÷ ln(1+r) ≈ 0.693/r, and 72/r is a close approximation that's easy to calculate in your head. The rule also works in reverse: if inflation is 4%, your purchasing power halves in about 18 years.",
      impact:
        "Warren Buffett started investing seriously around age 25 with roughly $10,000. At an average 20% annual return, the Rule of 72 says his money doubled every 3.6 years. Over 60 years of investing, that's roughly 16–17 doublings. $10,000 × 2^16 = $655 million — and Buffett is worth approximately $120 billion because the compounding continued on much larger sums. The rule reveals why starting early is the single most powerful variable in wealth building. Ten extra years at 7% is roughly one full doubling — a 2× difference in final wealth.",
    },
    visual: (
      <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0369a1", marginBottom: 12 }}>Rule of 72 — Years to Double Your Money</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#0369a1", color: "#fff" }}>
              <th style={{ padding: "6px 10px", textAlign: "left" }}>Annual Return</th>
              <th style={{ padding: "6px 10px", textAlign: "center" }}>Years to Double</th>
              <th style={{ padding: "6px 10px", textAlign: "right" }}>$10k becomes…</th>
            </tr>
          </thead>
          <tbody>
            {[["4%", "18 yrs", "$20,000"], ["7%", "10.3 yrs", "$20,000"], ["10%", "7.2 yrs", "$20,000"], ["12%", "6 yrs", "$20,000"]].map(([r, y, v], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f0f9ff" }}>
                <td style={{ padding: "6px 10px", fontWeight: 600, color: "#0369a1" }}>{r}</td>
                <td style={{ padding: "6px 10px", textAlign: "center" }}>{y}</td>
                <td style={{ padding: "6px 10px", textAlign: "right", color: "#16a34a" }}>{v} (after 1 doubling)</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    check: {
      q: "Using the Rule of 72, how long does it take $10,000 to double at a 9% annual return?",
      choices: [
        "9 years",
        "8 years",
        "12 years",
        "18 years",
      ],
      correct: 1,
      explain: "72 ÷ 9 = 8 years. That's the Rule of 72 in action — a quick mental shortcut. At 9% per year, $10,000 becomes $20,000 in 8 years, then $40,000 in 16 years, then $80,000 in 24 years. Each doubling stacks on top of the last.",
    },
  },
  {
    narrative: (
      <>
        <p>
          You have $10,000 today. You invest it at 8% per year. How much is it worth in 30
          years? The answer is <B>$100,600</B> — more than ten times what you started with,
          without adding a single extra dollar. This is the <I>Future Value</I> formula at
          work: FV = PV × (1 + r)^n, where PV is your starting amount, r is the annual
          return, and n is the number of years.
        </p>
        <p>
          The surprise is always in the final stretch. At year 10, your $10,000 has grown to
          $21,600. At year 20, it&apos;s $46,600. But from year 20 to year 30, it grows by
          another $54,000 — more than the first 20 years combined. That&apos;s why investors
          who stay invested for the long haul see the most dramatic growth: the compounding
          curve steepens with time, not flattens.
        </p>
      </>
    ),
    term: {
      name: "Future Value (FV)",
      definition:
        "Future Value (FV) = PV × (1 + r)^n. PV is present value (starting amount), r is the annual interest/return rate as a decimal (8% = 0.08), n is the number of years. The formula shows exactly how much a lump sum today grows over time at a given return. It assumes returns are compounded annually (or more frequently for even higher growth). For monthly compounding: FV = PV × (1 + r/12)^(12n).",
      impact:
        "$10,000 invested at 8% annually: Year 10 → $21,589. Year 20 → $46,610. Year 30 → $100,627. Year 40 → $217,245. The doubling accelerates because each year's return is applied to an ever-larger base. Ronald Read's genius was not finding 20% annual returns — it was investing in good businesses at roughly 10–12% and giving the formula 50+ years to work. Time is the variable that most investors underestimate.",
    },
    visual: (
      <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0369a1", marginBottom: 12 }}>$10,000 at 8% Annual Return — How It Grows</div>
        {[["Year 10", 21600, "#bae6fd"], ["Year 20", 46600, "#7dd3fc"], ["Year 30", 100600, "#0369a1"]].map(([label, val, color]) => (
          <div key={label as string} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
              <span style={{ fontWeight: 600 }}>{label as string}</span>
              <span style={{ fontWeight: 700, color: "#0369a1" }}>${(val as number).toLocaleString()}</span>
            </div>
            <div style={{ background: "#e0f2fe", borderRadius: 4, height: 18, overflow: "hidden" }}>
              <div style={{ background: color as string, height: "100%", width: `${((val as number) / 105000) * 100}%`, borderRadius: 4 }} />
            </div>
          </div>
        ))}
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>No additional deposits — just one $10,000 investment growing at 8%/yr</div>
      </div>
    ),
    check: {
      q: "$10,000 is invested at 8% per year. Which statement best describes how the growth pattern looks over 30 years?",
      choices: [
        "It grows the same dollar amount every year — $800 each year",
        "It grows faster in the early years, then slows down as the base gets larger",
        "It grows slowly at first, then accelerates dramatically in the later years",
        "It grows in unpredictable bursts with no consistent pattern",
      ],
      correct: 2,
      explain: "Compounding starts slow and accelerates over time. In year 1, 8% of $10,000 is just $800. But in year 30, 8% is applied to a much larger balance, generating thousands of dollars in a single year. The growth curve steepens over time — which is why the last 10 years of a 30-year investment often generate more wealth than the first 20.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Flip the question around: if someone offers you <B>$100 in 10 years</B>, how much is
          that worth to you today? Not $100 — because if you had $100 today, you could invest
          it and have more than $100 in 10 years. The current value of a future payment is
          called its <I>present value</I>, and it&apos;s always less than the future amount.
        </p>
        <p>
          At a 7% discount rate, $100 in 10 years is worth only <B>$50.83</B> today. At 10%
          discount rate, it&apos;s worth just <B>$38.55</B>. This is why companies doing DCF
          analysis (Discounted Cash Flow — you learned this in Unit 4) use a discount rate:
          future earnings are worth less than present earnings, and the formula converts them
          back to today&apos;s dollars.
        </p>
      </>
    ),
    term: {
      name: "Present Value (PV)",
      definition:
        "Present Value (PV) = FV ÷ (1 + r)^n. It answers: 'What is a future cash flow worth in today's dollars?' The discount rate r represents either the opportunity cost of capital (what you could earn elsewhere) or the required return. Higher discount rates shrink present values more aggressively. PV is the core of DCF valuation — every future cash flow a company generates is discounted back to today to get the company's 'intrinsic value.'",
      impact:
        "When the Federal Reserve raises interest rates, it raises the discount rate used to value stocks. A company expected to earn $10/share in 10 years was worth $5.08 at 7% discount rate — but only $3.86 at a 10% discount rate. That's a 24% drop in value even though the company's actual business hasn't changed. This explains why high-growth tech stocks (whose earnings are far in the future) fell much more than value stocks during the 2022 rate-hike cycle: their distant future cash flows were being discounted more heavily.",
    },
    visual: (
      <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0369a1", marginBottom: 8 }}>$100 Future Payment — What It&apos;s Worth Today</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
          <div style={{ textAlign: "center", background: "#0369a1", color: "#fff", borderRadius: 8, padding: "10px 16px", fontWeight: 700 }}>$100<br /><span style={{ fontSize: 10, fontWeight: 400 }}>in 10 years</span></div>
          <div style={{ fontSize: 18, color: "#94a3b8" }}>←</div>
          <div style={{ flex: 1 }}>
            {[["7% discount rate", "$50.83"], ["10% discount rate", "$38.55"], ["3% discount rate", "$74.41"]].map(([label, val]) => (
              <div key={label as string} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #e0f2fe" }}>
                <span style={{ color: "#64748b" }}>{label as string}</span>
                <span style={{ fontWeight: 700, color: "#0369a1" }}>{val as string} today</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>Higher rates → smaller present value. Same future cash, different worth today.</div>
      </div>
    ),
    check: {
      q: "If interest rates rise sharply, what happens to the present value of a company's future earnings?",
      choices: [
        "Present value rises because future earnings are now worth more",
        "Present value stays the same — interest rates don't affect future earnings",
        "Present value falls because future cash flows are discounted more heavily",
        "Present value doubles to compensate investors for higher rates",
      ],
      correct: 2,
      explain: "A higher discount rate shrinks present value. If you use a higher rate to calculate how much a future payment is worth today, the result is a smaller number. That's exactly what happened to high-growth tech stocks in 2022 — the Fed raised rates, raising the discount rate, and the present value of distant future earnings fell sharply, pulling stock prices down with it.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Two people both invest $300 per month and earn 8% per year. The only difference:
          Sarah starts at age 22, Marcus starts at age 32. Both stop investing at age 65. Sarah
          invests for 43 years. Marcus invests for 33 years.
        </p>
        <p>
          At age 65, Sarah has <B>$1,233,000</B>. Marcus has <B>$573,000</B>. Sarah ends up
          with more than twice as much, even though she only contributed $36,000 more in total
          deposits ($155,000 vs. $119,000 — not even 30% more in deposits). The extra decade
          at the beginning, when the balance is small, turned into <B>more than double</B> the
          final wealth. Time is more powerful than money.
        </p>
      </>
    ),
    term: {
      name: "Cost of Waiting",
      definition:
        "The Cost of Waiting refers to the irreversible compounding advantage lost by delaying investment. Because compound growth is exponential, each year of delay costs more than the previous one — the earlier the delay, the more expensive it is. A 10-year head start at 8% is worth approximately one full doubling of final wealth. The cost is not just the lost returns on the initial deposit; it's the lost returns on all future returns that would have compounded on that early money.",
      impact:
        "If you invest $5,000/year from age 22 to 32 (just 10 years, $50,000 total), then stop, you end up with more at 65 than someone who invests $5,000/year from age 32 to 65 ($165,000 total) — thanks to that 10-year head start. The first investor contributed $115,000 less but ends up wealthier. This math is the reason every financial advisor gives the same advice: start early, even small amounts, even before you can afford 'serious' investing.",
    },
    visual: (
      <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0369a1", marginBottom: 10 }}>$300/month at 8%/yr — Starting Age Matters</div>
        {[["Sarah (starts 22)", 1233000, "#0369a1", "43 yrs invested"], ["Marcus (starts 32)", 573000, "#7dd3fc", "33 yrs invested"]].map(([name, val, color, sub]) => (
          <div key={name as string} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>{name as string}</span>
              <span style={{ fontWeight: 700, color: "#0369a1" }}>${((val as number) / 1000).toFixed(0)}k at 65</span>
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{sub as string}</div>
            <div style={{ background: "#e0f2fe", borderRadius: 4, height: 20, overflow: "hidden" }}>
              <div style={{ background: color as string, height: "100%", width: `${((val as number) / 1300000) * 100}%`, borderRadius: 4 }} />
            </div>
          </div>
        ))}
        <div style={{ fontSize: 12, color: "#64748b" }}>Same monthly deposit, same return — only start date differs.</div>
      </div>
    ),
    check: {
      q: "Sarah invests $300/month starting at 22 and stops at 32 (10 years). Marcus invests $300/month starting at 32 and never stops until 65 (33 years). At 65, who likely has more money, assuming both earn 8%?",
      choices: [
        "Marcus — he invested for far more years and deposited far more money",
        "Sarah — the 10-year head start gives her money more time to compound, often outweighing more deposits later",
        "They end up with the same amount — time and deposit amount balance each other out",
        "Neither — 8% returns aren't realistic over long periods",
      ],
      correct: 1,
      explain: "Studies show Sarah often ends up with more, or approximately the same, despite depositing far less total money. Her early deposits have 40+ years to compound, while Marcus's early deposits only have 30 years. The mathematical power of an early head start frequently outweighs decades of extra contributions made later.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Two banks offer you $10,000 at 6% per year for 20 years. Bank A uses{" "}
          <I>simple interest</I>: every year, you earn 6% of the original $10,000 — that&apos;s
          $600 per year, every year. After 20 years: $22,000.
        </p>
        <p>
          Bank B uses <I>compound interest</I>: every year, you earn 6% on whatever the
          account currently holds — including last year&apos;s interest. Year 1: $10,600. Year
          2: $11,236. By year 20: <B>$32,071</B>. Same rate, same starting amount, same time
          — but compound interest generates <B>$10,071 more</B> than simple interest. The
          longer the time period, the wider this gap grows. At 40 years, compound generates
          more than three times as much.
        </p>
      </>
    ),
    term: {
      name: "Compound vs. Simple Interest",
      definition:
        "Simple interest: Interest = Principal × Rate × Time. You earn the same dollar amount each period because it's always calculated on the original principal. Compound interest: You earn interest on both the principal AND all previously earned interest. Formula: FV = P × (1 + r)^n. The compounding frequency matters: annual (1×/yr), quarterly (4×/yr), monthly (12×/yr), or daily (365×/yr). More frequent compounding = higher effective annual yield. A 6% annual rate compounded monthly has an effective annual yield of 6.17%.",
      impact:
        "The U.S. national debt is a compound interest problem. When the government runs deficits, it borrows. Interest accrues on that debt. If the debt isn't paid, interest accrues on the interest. As of 2024, the U.S. pays approximately $1 trillion/year in interest alone. Credit cards work the same way: 24% APR compounded daily means your balance grows exponentially if unpaid. Understanding this math explains why debt destroys wealth and compound investing builds it — the same mathematical engine runs both.",
    },
    check: {
      q: "$10,000 at 6% for 20 years — which statement correctly compares simple vs. compound interest?",
      choices: [
        "Simple interest gives $32,071 because you earn more when the rate is applied to a growing balance",
        "Compound interest gives $32,071 because interest is earned on both principal and accumulated interest",
        "They give the same result — the only difference is how the bank calculates the paperwork",
        "Simple interest gives more money because the base stays at $10,000, maximizing the rate's impact",
      ],
      correct: 1,
      explain: "Compound interest earns $32,071 vs. simple interest's $22,000. The difference is what the 6% is applied to: simple interest always applies to the original $10,000 ($600/yr forever), while compound interest applies to the growing total balance — meaning each year's return is larger than the last. That's the engine of wealth building.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Your stock portfolio returned: +18% in Year 1, −12% in Year 2, +24% in Year 3, +6%
          in Year 4. What was your average return? The simple average (18 − 12 + 24 + 6) ÷ 4
          = 9% per year. But that&apos;s misleading. If you actually started with $10,000 and
          experienced those returns, you&apos;d end up with <B>$13,700</B> after 4 years —
          not the $14,116 you&apos;d expect from 9% compounding.
        </p>
        <p>
          The true compounded return is closer to 8.2% per year. The correct measure is{" "}
          <I>CAGR</I> — Compound Annual Growth Rate. It answers the question: what single
          constant annual return would have taken me from $10,000 to $13,700 in 4 years?
          That&apos;s the honest comparison number.
        </p>
      </>
    ),
    term: {
      name: "CAGR (Compound Annual Growth Rate)",
      definition:
        "CAGR = (Ending Value / Beginning Value)^(1/n) − 1, where n is the number of years. It gives the smooth, equivalent annual growth rate that gets you from start to end, ignoring the zigzag path in between. CAGR is the standard way to compare investment performance across different time periods and strategies. It eliminates the distortion of arithmetic averaging, which overstates actual returns whenever there is volatility. Berkshire Hathaway's book value CAGR from 1965–2023 is approximately 19.8% per year.",
      impact:
        "Warren Buffett's shareholder letters always report Berkshire's CAGR — not yearly averages — because CAGR is the only honest long-term measure. Mutual funds and advisors often advertise 'average annual returns' (the misleading arithmetic version) rather than CAGR. The difference matters: a fund that goes +50% one year and −33% the next has an arithmetic average return of +8.5%, but a CAGR of 0% — you end up exactly where you started. Always ask for CAGR when evaluating any investment's track record.",
    },
    check: {
      q: "A fund advertises an 'average annual return' of 10% per year over 2 years. What do you need to know to evaluate whether that number is honest?",
      choices: [
        "Whether the fund's managers have MBAs or finance degrees",
        "Whether that 10% is the arithmetic average or the CAGR (compound annual growth rate)",
        "Whether the fund invests in domestic or international stocks",
        "Whether the fund has more than $1 billion in assets under management",
      ],
      correct: 1,
      explain: "Arithmetic average and CAGR can tell very different stories. A fund that goes +100% one year then −50% the next has an arithmetic average of 25% per year — but a CAGR of 0%. You end up with exactly what you started. CAGR is the only number that tells you what actually happened to your money. Always ask 'is this CAGR or simple average?' when evaluating any investment track record.",
    },
  },
  {
    narrative: (
      <>
        <p>
          You invest $100,000 for 30 years at 7% gross return. Two scenarios: Fund A charges
          0% in fees. Fund B charges 1% annually. How much difference does 1% make?
        </p>
        <p>
          Fund A (0% fee): <B>$761,226</B>. Fund B (1% fee): <B>$574,349</B>. The 1% annual
          fee cost you <B>$186,877</B> — almost 25% of your total wealth. That 1% didn&apos;t
          feel like much each year, but because it was deducted from the base before
          compounding, it compounded away 25% of your ending balance. Over 40 years, a 1% fee
          consumes roughly <B>33%</B> of your wealth.
        </p>
      </>
    ),
    term: {
      name: "The 1% Fee Effect",
      definition:
        "An expense ratio is the annual fee charged by a fund, expressed as a percentage of assets. It compounds against you: at 1% annual fee, you earn 6% instead of 7%, and the compounding difference stacks over decades. Index funds (like Vanguard's VTSAX) charge 0.03–0.04%. Actively managed mutual funds average 0.5–1.5%. The fee isn't paid once — it's deducted continuously from your growing base, meaning you lose returns on the returns you would have earned. Over 30 years at 7% gross: 0% fee → $761k; 1% fee → $574k; difference: $187k on a $100k investment.",
      impact:
        "The fund industry collects approximately $100 billion per year in management fees. John Bogle founded Vanguard specifically to eliminate this wealth transfer by creating the first index fund available to retail investors. Bogle estimated he saved investors approximately $1 trillion over his career by lowering fees. Warren Buffett, in his 2013 shareholder letter, recommended that his wife's estate be invested in low-cost S&P 500 index funds after he dies. Both Buffett and Bogle agreed: for most investors, the single highest-return action available is to minimize fees.",
    },
    visual: (
      <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0369a1", marginBottom: 10 }}>$100,000 Invested for 30 Years at 7% Gross Return</div>
        {[["0% fees (index fund)", 761226, "#16a34a"], ["1% fees (managed fund)", 574349, "#dc2626"]].map(([label, val, color]) => (
          <div key={label as string} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>{label as string}</span>
              <span style={{ fontWeight: 700, color: color as string }}>${((val as number) / 1000).toFixed(0)}k</span>
            </div>
            <div style={{ background: "#e0f2fe", borderRadius: 4, height: 20, overflow: "hidden" }}>
              <div style={{ background: color as string, height: "100%", width: `${((val as number) / 800000) * 100}%`, borderRadius: 4 }} />
            </div>
          </div>
        ))}
        <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, marginTop: 4 }}>1% fee difference = $187k less at retirement</div>
      </div>
    ),
    check: {
      q: "Why does a 1% annual management fee cost you much more than 1% of your total wealth over 30 years?",
      choices: [
        "Because the fund manager charges 1% on top of any taxes owed",
        "Because the fee is deducted from earnings but the government adds it back during tax time",
        "Because the fee reduces your compounding base each year, so you lose the returns that money would have earned in all future years",
        "Because 1% fees are actually charged twice — once on the way in and once on the way out",
      ],
      correct: 2,
      explain: "Fees compound against you. When 1% is deducted annually, you don't just lose 1% — you lose all the future returns that 1% would have generated through compounding. Over 30 years, this snowballs to roughly 25% of your total ending wealth. That's why low-cost index funds (charging 0.03%–0.20%) have such a massive advantage over actively managed funds charging 1–1.5%.",
    },
  },
];

const U10: StockUnit = {
  num: 10,
  slug: "unit-10",
  title: "Time Value of Money & Compounding",
  accent: "#0369a1",
  previewHook: "A Vermont janitor who never earned more than $11.75/hour died with $8 million. He left it to the local library and hospital. How?",
  concepts: ["Rule of 72", "Future value", "Present value", "Cost of waiting", "Compound interest", "CAGR", "Fee drag"],
  hook: {
    title: "The $8 Million Janitor",
    setup: (
      <>
        <p>
          Ronald Read spent 25 years as a gas station attendant and 17 years as a janitor at
          JCPenney in Brattleboro, Vermont. He drove a used Toyota Yaris, wore clothes held
          together with safety pins, and cut his own firewood to save on heating. When he died
          in 2014 at age 92, his estate was worth <strong>$8 million</strong>.
        </p>
        <p>
          He left $4.8 million to Brattleboro Memorial Hospital and $1.2 million to the
          Brooks Memorial Library. His colleagues had no idea. His stepchildren had no idea.
          Nobody had any idea.
        </p>
      </>
    ),
    question: "How does someone earning $11/hour end up with $8 million?",
    reveal: {
      stat: "72 years of compounding",
      statSub: "Read started buying stocks in his 20s and never stopped — or sold",
      explanation:
        "Ronald Read bought shares in companies he understood — utilities, consumer staples, railroads — and held them for decades. He reinvested every dividend. He never panicked and sold. His secret was not a high salary, insider information, or a complex strategy. It was time. Starting in his 20s and holding for 70+ years gave his money enough doubling cycles to reach $8 million. At 10% annual returns, money doubles every 7 years. Seven doublings from age 25 to 74: $10,000 → $1.28 million. Add 15 more years of compounding on a growing base and the math becomes extraordinary.",
    },
  },
  lesson: {
    title: "The Mathematics of Patient Money",
    character: "The story of why time is worth more than money — and the simple formulas every investor needs to understand",
    beats: U10_BEATS,
    ctaLabel: "See the Power of Compounding →",
    ctaSubtitle: "Even small amounts invested early can grow into life-changing wealth — the math is simple, but the patience is everything.",
  },
  mission: {
    title: "Mission 10: Calculate Your Compound Future",
    description:
      "Apply the Future Value formula to your own life. Pick a realistic monthly investment amount you could start today, and see where it leads in 10, 20, and 30 years.",
    steps: [
      "Choose a monthly investment amount ($50, $100, $200, or $300)",
      "Use the Rule of 72 to estimate how many times your money doubles by age 65",
      "Calculate: FV = PV × (1.07)^30 for a lump sum, or use a savings calculator",
      "Compare two scenarios: starting today vs. starting 10 years from now",
      "Write down the difference — that's the cost of waiting",
    ],
  },
  unitQuiz: [
    {
      q: "At what annual return rate does your money double in 9 years, according to the Rule of 72?",
      choices: [
        "6%",
        "7%",
        "8%",
        "9%",
      ],
      correct: 2,
      explain: "72 ÷ 8 = 9. So at an 8% annual return, money doubles every 9 years. The Rule of 72 is a quick mental shortcut: divide 72 by your return rate to get the doubling time. At 6%, money doubles every 12 years; at 12%, every 6 years.",
    },
    {
      q: "The present value formula says that $1,000 due in 10 years is worth less than $1,000 today. What is the main reason for this?",
      choices: [
        "Inflation always reduces the value of future money, and the government taxes future payments more",
        "Money today can be invested and grow — so today's $1,000 would be worth more than $1,000 in 10 years",
        "Future money is less reliable because economic conditions might change",
        "Banks charge fees for holding money longer than 5 years",
      ],
      correct: 1,
      explain: "The core reason for present value is opportunity cost: $1,000 today can be invested at, say, 7% per year and grow to roughly $1,967 in 10 years. So receiving $1,000 in 10 years is not equivalent to $1,000 now — it's worth much less. The present value formula tells you exactly how much less, based on the discount rate used.",
    },
    {
      q: "Two investors each earn 8% per year. Investor A invests $200/month starting at age 25. Investor B starts at age 35. Both stop at age 65. Who ends up with more, and roughly why?",
      choices: [
        "Investor B ends up with more because he invests during his peak earning years when he can afford larger amounts",
        "They end up with the same amount because they both earn 8% per year",
        "Investor A ends up with far more because her first 10 years of deposits have 30+ more years to compound",
        "Investor A ends up with only slightly more — the difference is under 20%",
      ],
      correct: 2,
      explain: "Investor A's early deposits compound for 40 years; Investor B's early deposits only compound for 30. At 8%, money doubles every ~9 years — so Investor A gets one extra doubling cycle that Investor B misses entirely. This alone can mean a 2× difference in ending wealth, even if Investor B deposits more money total in her shorter window.",
    },
    {
      q: "A CAGR (Compound Annual Growth Rate) of 10% over 3 years means:",
      choices: [
        "Your return was exactly 10% every single year",
        "The arithmetic average of your annual returns was 10%",
        "The steady annual rate that, applied each year, takes your starting value to your ending value in 3 years",
        "Your return was at least 10% in every individual year of the 3-year period",
      ],
      correct: 2,
      explain: "CAGR is the equivalent smooth rate that gets you from start to finish over the time period — it ignores the year-by-year volatility. A portfolio that went +30%, −10%, +15% doesn't have a CAGR of 11.67% (the arithmetic average); it has a CAGR based on the actual start-to-finish growth. CAGR is the honest, comparable measure for any multi-year investment.",
    },
    {
      q: "An investor pays a 1% annual expense ratio instead of 0.05% for 30 years on a $50,000 investment at 7% gross return. Approximately how much does the extra ~1% fee cost in total ending wealth?",
      choices: [
        "About $500 — 1% of the original $50,000",
        "About $1,500 — 1% per year for 30 years on the starting amount",
        "About $90,000 — roughly 25% of the total ending wealth",
        "Nothing — expense ratios are only charged in years when the fund has positive returns",
      ],
      correct: 2,
      explain: "A 1% annual fee compounds against you over 30 years and consumes approximately 25% of total ending wealth. On $50,000 at 7% for 30 years: 0% fees → ~$380k; 1% fees → ~$287k. The ~$93k difference is the compounding cost of fees — you didn't just lose 1% each year, you lost all the returns that fee money would have generated through further compounding.",
    },
  ],
};

// ── Unit 11 — Bonds & Fixed Income ────────────────────────────────────────────

const U11_BEATS: StoryBeat[] = [
  {
    narrative: (
      <>
        <p>
          Imagine you lend $1,000 to your friend. They promise to pay you <B>$50 per year</B>{" "}
          for the next 10 years, then return your $1,000 at the end. That&apos;s a bond.
          Instead of your friend, the borrowers are governments and corporations. The $50
          annual payment is the <I>coupon</I>. The $1,000 you lend is the <I>face value</I>{" "}
          (or <I>par value</I>). The date you get your $1,000 back is the{" "}
          <I>maturity date</I>.
        </p>
        <p>
          Bonds are fundamentally different from stocks. When you buy a stock, you own a piece
          of a company — your return depends on how well the business performs. When you buy a
          bond, you&apos;re a lender — the company or government owes you a contractual
          payment. If the company fails, bondholders get paid before stockholders in
          bankruptcy. Bonds trade lower risk for lower expected return.
        </p>
      </>
    ),
    term: {
      name: "Bond",
      definition:
        "A bond is a debt instrument — the issuer (government or corporation) borrows money from investors and promises to pay a fixed interest rate (coupon) at regular intervals and return the principal (face value) at maturity. Key terms: Face Value (par) — typically $1,000; Coupon Rate — annual interest as % of face value (a 5% coupon on $1,000 bond = $50/year); Maturity — when principal is returned (1 month to 30+ years); Issuer — U.S. Treasury (safest), municipal governments, or corporations. U.S. Treasury bonds are considered risk-free because the U.S. government can print dollars to pay them.",
      impact:
        "The global bond market is worth approximately $130 trillion — larger than the global stock market ($100 trillion). Bonds fund everything: U.S. government bonds finance federal spending, corporate bonds fund business expansion, municipal bonds build schools and highways. Apple, Microsoft, and Walmart all regularly issue bonds to raise capital. When you buy a government savings bond, you're literally lending money to the U.S. Treasury. Most retirement portfolios hold some bonds because they provide predictable income and stability that stocks cannot.",
    },
    check: {
      q: "You buy a $1,000 corporate bond with a 5% coupon rate maturing in 10 years. How much total cash do you receive if you hold it to maturity?",
      choices: [
        "$1,050 — the face value plus one year of interest",
        "$1,500 — the face value plus 50% interest",
        "$1,500 — $1,000 face value plus $50/year × 10 years",
        "$2,000 — bonds always double in value by maturity",
      ],
      correct: 2,
      explain: "A 5% coupon on a $1,000 bond means $50 per year in interest payments. Over 10 years, that's 10 × $50 = $500 in interest. Plus you get back the $1,000 face value at maturity. Total: $1,500. The coupon rate tells you the annual interest as a percentage of face value — it's fixed for the life of the bond.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Here&apos;s where bonds get confusing. A bond has a <I>coupon rate</I> — fixed at
          issuance. But it also has a <I>current yield</I> — which changes every day based on
          what price you actually pay for the bond.
        </p>
        <p>
          Suppose a $1,000 bond pays a 5% coupon ($50/year). If you buy it at a discount —
          say, $800 — your current yield is $50 ÷ $800 = <B>6.25%</B>. You&apos;re earning a
          better yield because you bought at a discount. If instead you pay a premium — $1,200
          for the same bond — your current yield is $50 ÷ $1,200 = <B>4.17%</B>. Same bond.
          Same coupon. Wildly different yield. Bond prices and yields always move in opposite
          directions.
        </p>
      </>
    ),
    term: {
      name: "Coupon Rate vs. Current Yield",
      definition:
        "Coupon Rate: Fixed annual interest payment ÷ face value. Set at issuance and never changes. Current Yield: Annual coupon payment ÷ current market price. Changes every time the bond's price moves. If a bond trades at a discount (below face value), current yield > coupon rate. If at premium (above face value), current yield < coupon rate. Yield to Maturity (YTM) is the most complete measure — it accounts for the coupon payments AND the gain/loss when the bond matures at face value. When analysts say 'the 10-year yield is 4.5%,' they're referring to YTM.",
      impact:
        "In 2022, investors who bought 20-year Treasury bonds in 2020 (at extremely low yields, meaning they paid very high prices) saw those bonds fall 30%+ in price. The coupon rate stayed fixed, but as new bonds were issued at higher rates, old bonds' prices fell to make their yields competitive. A bond bought at $1,000 paying 1.5% would need to fall to ~$750 to match a newly issued bond paying 2%. Price adjusts to make yields equal — always.",
    },
    visual: (
      <div style={{ background: "#f0faf0", border: "1px solid #bbf7d0", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 10 }}>Same Bond, Different Price → Different Yield</div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Bond: $1,000 face value, 5% coupon ($50/year fixed)</div>
        {[
          ["Buy at $800 (discount)", "$50 ÷ $800", "6.25%", "#16a34a"],
          ["Buy at $1,000 (par)", "$50 ÷ $1,000", "5.00%", "#475569"],
          ["Buy at $1,200 (premium)", "$50 ÷ $1,200", "4.17%", "#dc2626"],
        ].map(([label, calc, yield_, color]) => (
          <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
            <span style={{ flex: 2, fontSize: 12 }}>{label as string}</span>
            <span style={{ flex: 2, fontSize: 12, color: "#64748b" }}>{calc as string}</span>
            <span style={{ flex: 1, fontWeight: 700, color: color as string, textAlign: "right" }}>{yield_ as string}</span>
          </div>
        ))}
      </div>
    ),
    check: {
      q: "A bond has a 4% coupon rate. If you buy it at a price below its face value (at a discount), what happens to your actual yield compared to the 4% coupon?",
      choices: [
        "Your yield drops below 4% because you paid less for the bond",
        "Your yield stays exactly 4% regardless of price — the coupon rate is fixed",
        "Your yield rises above 4% because you're getting the same $40/year on a smaller investment",
        "Your yield doubles to 8% automatically when purchased at a discount",
      ],
      correct: 2,
      explain: "Current yield = annual coupon ÷ price paid. If the coupon is $40/year (4% of $1,000 face value) but you paid $800, your yield is $40 ÷ $800 = 5%. The fixed coupon payment is now a higher percentage of what you actually paid. Buying at a discount raises your effective yield; buying at a premium lowers it.",
    },
  },
  {
    narrative: (
      <>
        <p>
          The most important relationship in bond investing is also the most counterintuitive:
          when interest rates go <I>up</I>, bond prices go <I>down</I>. Not sometimes. Always.
          Here&apos;s why.
        </p>
        <p>
          You hold a bond paying 3% per year. The government raises rates and new bonds now pay
          4%. Why would anyone buy your 3% bond when they can get 4%? They wouldn&apos;t — unless
          your bond got cheaper. The price must fall until your 3% coupon translates to a
          competitive 4% yield. The bond market adjusts prices so all bonds of similar quality
          yield approximately the same rate. Rates up → existing bond prices down. Rates down
          → existing bond prices up. This is the seesaw that caught millions of investors by
          surprise in 2022.
        </p>
      </>
    ),
    term: {
      name: "The Inverse Relationship (Price vs. Yield)",
      definition:
        "Bond price and yield move in opposite directions — always. When market interest rates rise, existing bonds paying lower fixed rates become less attractive, so their prices fall until their yield matches the new market rate. When rates fall, existing bonds paying higher fixed rates become more attractive, so prices rise. This relationship is mathematical: price = PV of all future cash flows discounted at the current yield. A higher discount rate produces a lower price. Lower discount rate → higher price.",
      impact:
        "In 2022, the Federal Reserve raised the federal funds rate from 0.25% to 4.50% in one year — the fastest rate-hiking cycle in 40 years. TLT (iShares 20+ Year Treasury ETF) fell 31% as long-duration Treasury bond prices collapsed. Investors who thought they were 'safe' in government bonds lost more than the S&P 500. The lesson: even 'safe' bonds have significant price risk when rates change rapidly — especially long-duration bonds.",
    },
    visual: (
      <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 12 }}>The Bond Price ↔ Interest Rate Seesaw</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24 }}>📈</div>
            <div style={{ fontWeight: 700, color: "#dc2626", fontSize: 13 }}>Rates Rise</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Fed hikes to 4.5%</div>
          </div>
          <div style={{ fontSize: 28, color: "#94a3b8" }}>⇔</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24 }}>📉</div>
            <div style={{ fontWeight: 700, color: "#16a34a", fontSize: 13 }}>Bond Prices Fall</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>TLT down 31%</div>
          </div>
        </div>
        <div style={{ borderTop: "1px dashed #e2e8f0", marginTop: 12, paddingTop: 8, fontSize: 12, color: "#64748b", textAlign: "center" }}>
          Because: old bonds paying 1–2% must fall in price to compete with new bonds paying 4–5%
        </div>
      </div>
    ),
    check: {
      q: "In 2022, the Federal Reserve rapidly raised interest rates from near 0% to 4.5%. What happened to the prices of existing long-term Treasury bonds during this period?",
      choices: [
        "Prices rose sharply because Treasury bonds are guaranteed by the government",
        "Prices stayed flat — government bonds are immune to interest rate changes",
        "Prices fell sharply because existing bonds with low fixed rates were now less attractive compared to new bonds",
        "Prices rose temporarily, then returned to normal within a few weeks",
      ],
      correct: 2,
      explain: "When rates rose rapidly in 2022, TLT (20+ year Treasury ETF) fell 31%. Existing bonds with 1–2% coupons became much less attractive than newly issued bonds offering 4–5%. To compensate buyers, existing bond prices had to fall — making their fixed coupons a higher percentage of the lower price. Government guarantee doesn't protect you from price drops when rates change.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Not all bonds fall the same amount when interest rates rise. A 1-year bond loses
          very little; a 30-year bond can lose 25–35% for the same rate move. The measure that
          predicts this is called <I>duration</I> — and it explains why TLT (20+ year
          Treasuries) was so devastated in 2022 while short-term bond funds barely moved.
        </p>
        <p>
          Duration tells you, approximately: for every 1% rise in interest rates, this bond
          will fall X% in price. A bond with duration of 8 will fall about 8% if rates rise
          1%. TLT&apos;s duration in 2022 was approximately 18. Rates rose about 4.5%. Result:
          18 × 4.5% ≈ 81% potential price impact (it fell &quot;only&quot; 31% because yields
          didn&apos;t move in lockstep). Duration is the number investors use to measure
          interest-rate risk in bonds.
        </p>
      </>
    ),
    term: {
      name: "Duration",
      definition:
        "Duration measures a bond's sensitivity to interest rate changes. Approximately: if duration = D, a 1% rise in rates causes approximately D% drop in price. It's also the weighted average time to receive all cash flows (in years). Short-duration bonds (1–3 years) have low rate sensitivity. Long-duration bonds (15–30 years) have high sensitivity. Modified Duration is the version used for price sensitivity calculations. The 2022 bond crash: TLT had ~18 duration × ~4% rate rise ≈ 72% theoretical price impact (actual was less due to complex yield curve movements).",
      impact:
        "Understanding duration is why sophisticated investors shift from long-duration bonds to short-duration bonds when they expect rates to rise. In 2022, investors in ultra-short-term Treasury funds (duration ~0.5) saw losses under 1%. Investors in TLT (duration ~18) saw 31% losses. Same 'safe' government bonds. Wildly different outcomes. Duration is the single most important number for understanding bond risk — more important than credit quality for rate-risk assessment.",
    },
    check: {
      q: "Bond A has a duration of 2 years. Bond B has a duration of 15 years. Interest rates rise by 1%. Which statement best describes what happens to each bond's price?",
      choices: [
        "Bond A falls about 15%, Bond B falls about 2% — longer bonds are safer",
        "Both bonds fall by exactly 1% — duration doesn't affect price sensitivity",
        "Bond A falls about 2%, Bond B falls about 15% — longer duration means more price sensitivity",
        "Neither bond's price changes — only newly issued bonds react to rate changes",
      ],
      correct: 2,
      explain: "Duration tells you price sensitivity: for every 1% rise in rates, the bond falls approximately that many percent. Bond A (duration 2) falls ~2%. Bond B (duration 15) falls ~15%. This is why long-term bonds like TLT are much riskier than short-term bonds when rates rise — they have much higher duration.",
    },
  },
  {
    narrative: (
      <>
        <p>
          Not every borrower is equally trustworthy. When a corporation issues bonds, credit
          rating agencies — Moody&apos;s, S&amp;P, and Fitch — evaluate the borrower&apos;s
          financial health and assign a <I>credit rating</I>. AAA is the highest possible
          (ultra-safe). BBB- is the lowest &quot;investment grade&quot; rating. Below that is
          &quot;junk&quot; (officially called high-yield or speculative grade).
        </p>
        <p>
          Junk bonds pay higher interest to compensate for higher risk. A AAA-rated corporate
          bond might yield 4.5%. A BB-rated (junk) bond from the same industry might yield
          8–10%. Investors demand more yield to take more default risk. Historical data shows
          roughly 1–2% of investment-grade bonds default within 5 years, vs. 15–20% of CCC
          bonds. The yield premium compensates for that expected loss — usually.
        </p>
      </>
    ),
    term: {
      name: "Credit Ratings & Default Risk",
      definition:
        "Credit ratings assess the likelihood that a bond issuer will fail to make payments. S&P/Fitch scale: AAA → AA → A → BBB (investment grade) | BB → B → CCC → D (speculative/junk). Moody's uses Aaa, Aa, A, Baa, Ba, B, Caa, Ca, C. Investment grade: BBB-/Baa3 or higher. Default rates over 5 years: AAA: ~0.1%; BBB: ~1–2%; BB: ~5–7%; B: ~10–15%; CCC: ~25–35%. The 'yield spread' over Treasuries (credit spread) represents the extra yield demanded by investors for credit risk.",
      impact:
        "In 2008, mortgage-backed securities rated AAA by rating agencies turned out to be full of subprime mortgages with hidden default risks. When the housing market collapsed, 'AAA' bonds defaulted en masse — something that had essentially never happened before for top-rated debt. The crisis revealed that ratings are opinions, not guarantees. Rating agencies had conflicts of interest (paid by the issuers they rated). Since then, regulators have reformed rating agency practices, but sophisticated investors treat ratings as one input, not a guarantee.",
    },
    check: {
      q: "A company rated CCC wants to sell bonds. Why does it have to offer a much higher interest rate than a company rated AAA?",
      choices: [
        "Because CCC bonds are more popular and must pay more to attract enough investors",
        "Because investors demand higher yields to compensate for the higher risk that a CCC company might fail to repay them",
        "Because the government requires junk bonds to pay a minimum 10% yield",
        "Because CCC companies are growing faster and can afford to pay more",
      ],
      correct: 1,
      explain: "Investors require higher yields for riskier bonds because the risk of default (not getting paid back) is higher. Historical data shows roughly 25–35% of CCC-rated bonds default within 5 years. To compensate for that risk, CCC bonds must offer much higher interest rates — maybe 10–12% vs. 4–5% for AAA bonds. This extra yield is called the credit spread.",
    },
  },
  {
    narrative: (
      <>
        <p>
          After 2022, many investors asked: if bonds can fall 30%, why own them at all? The
          answer is: bonds serve a specific role that stocks cannot. They provide{" "}
          <I>predictable income</I>, <I>capital preservation</I> in most environments, and —
          in normal recessions — they tend to rise when stocks fall.
        </p>
        <p>
          During the 2008 financial crisis, the S&amp;P 500 fell 38%. 20-year Treasury bonds
          rose 25%. During the 2020 COVID crash, stocks fell 34% in 5 weeks; Treasuries rose
          8–10%. These are the scenarios where bonds earn their place. The 2022 crash was
          unusual — stocks and bonds fell simultaneously because the problem was{" "}
          <I>inflation</I> (which hurts bonds directly) rather than recession (which
          historically helps bonds as investors seek safety).
        </p>
      </>
    ),
    term: {
      name: "Why Own Bonds?",
      definition:
        "Bonds serve three portfolio roles: (1) Income: predictable coupon payments regardless of market conditions; (2) Capital preservation: principal returned at maturity if held to term; (3) Diversification: historically negative correlation with stocks during recessions (when stocks fall, investors buy 'safe' Treasuries, pushing bond prices up). The classic 60/40 portfolio (60% stocks, 40% bonds) exploits this: bonds cushion equity crashes in typical recessions. 2022 was an outlier — inflation hurt both stocks and bonds simultaneously, the first time since the 1970s that a 60/40 portfolio had a truly bad year.",
      impact:
        "From 2000–2020, the 60/40 portfolio averaged 7.3% annual returns with much lower volatility than 100% stocks. The 2008 crash (-38% for stocks) was softened to about -21% for the 60/40 portfolio by Treasury bonds rallying. For investors within 5–10 years of retirement, this cushioning matters enormously — a 50% stock crash at age 62 is catastrophic; a 20% portfolio drawdown is manageable. Bonds don't maximize returns. They provide the stability that allows investors to stay invested through crises.",
    },
    check: {
      q: "During the 2008 financial crisis, the S&P 500 fell about 38%. What did 20-year Treasury bonds do?",
      choices: [
        "They also fell about 38% because all assets collapse in a financial crisis",
        "They stayed flat — bonds are stable and never move during crises",
        "They rose approximately 25% as investors moved to safe assets",
        "They were frozen by the government and couldn't be traded",
      ],
      correct: 2,
      explain: "During the 2008 crisis — a recession-driven crash — investors fled to the safety of U.S. Treasury bonds, driving bond prices up roughly 25%. This is the classic 'flight to safety.' Stocks and bonds moved in opposite directions, which is exactly why a 60/40 portfolio cushions recessions. 2022 was different: inflation drove both stocks and bonds down simultaneously, which was a rare exception.",
    },
  },
  {
    narrative: (
      <>
        <p>
          There&apos;s one type of bond designed specifically to protect you from inflation:
          Treasury Inflation-Protected Securities, or <I>TIPS</I>. Regular bonds have a fixed
          face value — you lend $1,000 and get $1,000 back in 10 years, no matter what
          inflation does. TIPS are different: their <I>principal adjusts</I> with inflation.
          If inflation runs at 3% per year, your $1,000 principal grows to $1,030 after year
          one, then $1,061 after year two — and the coupon is paid on the adjusted (growing)
          principal.
        </p>
        <p>
          In 2022, TIPS significantly outperformed regular Treasury bonds. While TLT fell 31%,
          TIPS funds fell only 10–12%. TIPS still fell because their duration sensitivity to
          real rates hurt them. But they avoided the worst of the inflation damage that
          devastated nominal (regular) Treasuries.
        </p>
      </>
    ),
    term: {
      name: "TIPS (Treasury Inflation-Protected Securities)",
      definition:
        "TIPS are U.S. government bonds whose principal adjusts with the Consumer Price Index (CPI). At maturity, you receive either the inflation-adjusted principal or the original face value, whichever is higher. Coupon rate is fixed, but paid on the growing principal — so coupon payments also rise with inflation. TIPS real yield = TIPS yield − current inflation rate (versus regular Treasuries' nominal yield). TIPS outperform regular Treasuries when actual inflation exceeds what the market expected when regular Treasuries were priced. The breakeven inflation rate (TIPS yield vs. regular Treasury yield) tells you the inflation level at which TIPS and regular Treasuries return equally.",
      impact:
        "When inflation surged to 8.5% in 2022 (highest since 1981), TIPS provided meaningful inflation protection that regular bonds could not. The U.S. I-Bond rate briefly hit 9.62% annually as its rate adjusted to match CPI. Pension funds and retirees heavily dependent on bond income were badly hurt by 8.5% inflation eating into fixed coupon payments — but TIPS holders saw their principal adjust upward, partially offsetting the inflation erosion. TIPS are most valuable when inflation is higher than the market expected — their 'insurance value' kicks in exactly when regular bonds are most painful.",
    },
    visual: (
      <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 10 }}>How TIPS Protect Against Inflation</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#dc2626", marginBottom: 6 }}>Regular Treasury Bond</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              <div>Principal: <b>$1,000</b> (fixed forever)</div>
              <div>After 3% inflation × 10 yrs:</div>
              <div>Buying power: <b style={{ color: "#dc2626" }}>$744</b></div>
            </div>
          </div>
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#16a34a", marginBottom: 6 }}>TIPS Bond</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              <div>Principal: <b>$1,000</b> (adjusts with CPI)</div>
              <div>After 3% inflation × 10 yrs:</div>
              <div>Principal grows to: <b style={{ color: "#16a34a" }}>$1,344</b></div>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>TIPS adjusts your principal up each year with inflation — protecting your purchasing power.</div>
      </div>
    ),
    check: {
      q: "How is a TIPS (Treasury Inflation-Protected Security) different from a regular Treasury bond?",
      choices: [
        "TIPS pays a higher fixed interest rate than regular Treasuries of the same maturity",
        "TIPS principal adjusts upward with inflation (CPI), protecting purchasing power",
        "TIPS are only available to institutional investors like pension funds",
        "TIPS pays interest monthly instead of semi-annually like regular bonds",
      ],
      correct: 1,
      explain: "The key TIPS feature is the adjustable principal: as CPI rises, so does your bond's face value — and since coupon payments are a percentage of that face value, your coupon payments rise too. At maturity, you get back the inflation-adjusted principal (or the original face value if inflation was negative). This protects you from the purchasing power erosion that kills regular bond investors during high-inflation periods.",
    },
  },
];

const U11: StockUnit = {
  num: 11,
  slug: "unit-11",
  title: "Bonds & Fixed Income",
  accent: "#475569",
  previewHook: "In 2022, TLT — a fund of 20-year U.S. Treasury bonds — fell 31%. People hiding in bonds 'for safety' lost more than the S&P 500. What happened?",
  concepts: ["Bonds basics", "Yield", "Price-rate relationship", "Duration", "Credit ratings", "TIPS"],
  hook: {
    title: "When 'Safe' Bonds Weren't Safe",
    setup: (
      <>
        <p>
          In 2022, investors worried about stock market volatility moved money into U.S.
          Treasury bonds — considered the safest investment on earth. The U.S. government has
          never defaulted. Treasuries are backed by the full faith and credit of the federal
          government.
        </p>
        <p>
          By the end of 2022, TLT — a popular ETF holding 20-year Treasury bonds — had fallen{" "}
          <strong>31%</strong>. The S&P 500 fell 19% that year. The &quot;safe&quot; investment
          was worse than stocks.
        </p>
      </>
    ),
    question: "How do government bonds backed by the U.S. Treasury lose 31% in a single year?",
    reveal: {
      stat: "Duration risk",
      statSub: "interest rates rose 4.25 percentage points in 12 months — the fastest in 40 years",
      explanation:
        "Bonds have a hidden risk that most investors discover the hard way: when interest rates rise, existing bond prices fall. TLT held bonds with very long maturities (20+ years), which meant high duration — high sensitivity to rate changes. When the Fed raised rates from 0.25% to 4.50% in 2022, those long-duration bonds had to fall in price to make their fixed coupons competitive with the new higher rates. 'Safe' only means safe from default — it says nothing about price risk. Understanding bonds means understanding duration, yield, and the inverse relationship between rates and prices.",
    },
  },
  lesson: {
    title: "The Bond Market — Larger Than Stocks, More Misunderstood",
    character: "The story of how bonds actually work — and why the 2022 bond crash surprised investors who thought they were being careful",
    beats: U11_BEATS,
    ctaLabel: "Understand Fixed Income →",
    ctaSubtitle: "Bonds are a $130 trillion market. Every serious investor needs to understand how they work, even if they never buy one.",
  },
  mission: {
    title: "Mission 11: Research a Bond ETF",
    description:
      "Explore how bond ETFs work and how they differ from stocks in your portfolio. Understanding bonds helps you design a portfolio that matches your timeline and risk tolerance.",
    steps: [
      "Look up TLT (20+ Year Treasury ETF) — check its current yield and price chart for 2022",
      "Compare it to BND (Total Bond Market ETF) — notice the different durations",
      "Look up AGG (iShares Core U.S. Aggregate Bond ETF) — this is what most 60/40 portfolios hold",
      "Notice each ETF's 30-day SEC yield — this tells you what income you'd earn annually",
      "Consider: if you were 60 years old in 2022, what would holding TLT have done to your retirement?",
    ],
  },
  unitQuiz: [
    {
      q: "A $1,000 bond has a 4% coupon rate. You buy it for $800. What is your current yield?",
      choices: [
        "4% — the coupon rate is always equal to the yield",
        "5% — $40 ÷ $800",
        "3.2% — 4% minus the discount you received",
        "8% — double the coupon because you got a 20% discount",
      ],
      correct: 1,
      explain: "Current yield = annual coupon payment ÷ price paid. This bond pays $40/year (4% of $1,000 face value). You paid $800. So current yield = $40 ÷ $800 = 5%. Buying at a discount always raises your effective yield above the stated coupon rate.",
    },
    {
      q: "The Federal Reserve announces a large interest rate increase. What should you expect to happen to existing long-term bond prices?",
      choices: [
        "Long-term bond prices will rise because higher rates mean higher future income",
        "Long-term bond prices will fall because their fixed coupons are now less competitive",
        "Bond prices won't change — only newly issued bonds are affected by rate changes",
        "Short-term bonds fall more than long-term bonds when rates rise",
      ],
      correct: 1,
      explain: "Bond prices and interest rates always move in opposite directions. When rates rise, newly issued bonds pay higher coupons. Existing bonds paying lower fixed coupons must fall in price to remain competitive. Long-term bonds fall more than short-term bonds because they have higher duration — their price is more sensitive to rate changes.",
    },
    {
      q: "Bond X has a duration of 3. Bond Y has a duration of 20. Interest rates rise by 2%. Which bond falls more in price?",
      choices: [
        "Bond X falls more — shorter duration means more price risk",
        "Both bonds fall by the same 2% — duration doesn't affect price sensitivity",
        "Bond Y falls more — approximately 40% vs. approximately 6% for Bond X",
        "Neither bond falls — the 2% rate rise is within the normal range and doesn't trigger price changes",
      ],
      correct: 2,
      explain: "Duration predicts price sensitivity: Bond X (duration 3) falls ~6% for a 2% rate rise (3 × 2%). Bond Y (duration 20) falls ~40% (20 × 2%). This is exactly why TLT — with duration ~18 — fell 31% in 2022 when rates rose ~4%. Short-duration bonds barely moved while long-duration bonds were crushed.",
    },
    {
      q: "A company has a credit rating of CCC. What does this tell you about its bonds?",
      choices: [
        "They are extremely safe — CCC is the top rating from Moody's",
        "They are moderate risk — similar to most U.S. corporate bonds",
        "They are speculative (junk) grade — high default risk, requiring higher yields to attract investors",
        "They are only available to pension funds and institutional investors",
      ],
      correct: 2,
      explain: "CCC is deep in 'junk' or 'high-yield' territory — well below investment grade (BBB- or better). Historical default rates for CCC-rated bonds are 25–35% over 5 years. To compensate investors for this risk, CCC bonds must offer very high yields — often 10–15% vs. 4–5% for investment-grade bonds. The extra yield is called the credit spread.",
    },
    {
      q: "Inflation jumps to 7%. You own regular Treasury bonds and TIPS bonds. Which performs better and why?",
      choices: [
        "Regular Treasuries perform better because they are guaranteed by the U.S. government and TIPS are not",
        "TIPS performs better because its principal adjusts upward with inflation, protecting purchasing power",
        "They perform identically — both are government bonds with the same return characteristics",
        "Regular Treasuries perform better because higher inflation means higher nominal coupon payments",
      ],
      correct: 1,
      explain: "TIPS are specifically designed to handle inflation: as CPI rises, the bond's principal is adjusted upward, and since the coupon is a percentage of that principal, your coupon payments rise too. Regular Treasury bond coupons are fixed in dollar terms — if inflation is 7% and your coupon pays 3%, you're losing purchasing power with each payment. TIPS outperform regular Treasuries whenever inflation is higher than expected.",
    },
  ],
};

// ── Full course export ─────────────────────────────────────────────────────────

export const STOCK_UNITS: StockUnit[] = [U1, U2, U3, U4, U5, U6, U7, U8, U9, U10, U11];

export function getStockUnit(slug: string): StockUnit | undefined {
  return STOCK_UNITS.find((u) => u.slug === slug);
}

export function getStockUnitByNum(num: number): StockUnit | undefined {
  return STOCK_UNITS.find((u) => u.num === num);
}
