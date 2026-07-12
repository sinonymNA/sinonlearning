"use client";

import type { StoryBeat } from "@/components/life-budget/lessons/NarrativeLesson";

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
};

// ── Full course export ─────────────────────────────────────────────────────────

export const STOCK_UNITS: StockUnit[] = [U1, U2, U3, U4, U5, U6, U7, U8, U9];

export function getStockUnit(slug: string): StockUnit | undefined {
  return STOCK_UNITS.find((u) => u.slug === slug);
}

export function getStockUnitByNum(num: number): StockUnit | undefined {
  return STOCK_UNITS.find((u) => u.num === num);
}
