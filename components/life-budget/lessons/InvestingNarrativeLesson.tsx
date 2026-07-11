"use client";

import NarrativeLesson, { StoryBeat } from "./NarrativeLesson";
import InvestingVisual from "./InvestingVisual";

const ACCENT = "#d97706";
const INK = "#0f172a";

function Em({ children }: { children: React.ReactNode }) {
  return <em style={{ color: INK, fontStyle: "italic" }}>{children}</em>;
}

function Num({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: INK }}>{children}</strong>;
}

const BEATS: StoryBeat[] = [
  {
    visual: <InvestingVisual highlightSection="contribution" />,
    narrative: (
      <>
        <p>
          The email had been sitting in Marcus&apos;s inbox for three weeks: subject line
          <Em> 401(k) Enrollment — Action Required. Deadline: November 30.</Em>
          He&apos;d meant to open it. Something else always came up. On November 28th,
          Diane appeared in the break room with a very specific look.
        </p>
        <p>
          <Em>&ldquo;You enrolled yet?&rdquo;</Em>
        </p>
        <p>
          He hadn&apos;t. She sat down across from him and pulled up her phone.
          <Em>&ldquo;A 401(k) is a retirement account at work. Money comes out of your
          paycheck before taxes — so you pay taxes later, not now. That reduces your
          taxable income this year, which means you keep more of every dollar you put in.
          You with me?&rdquo;</Em> He was. Barely.
        </p>
      </>
    ),
    term: {
      name: "401(k)",
      definition:
        "A 401(k) is an employer-sponsored retirement savings account funded with pre-tax payroll contributions. Money goes in before federal income tax is calculated, reducing your taxable income now and deferring tax until withdrawal in retirement. The government limits contributions to $23,500/year (2025). Unlike a personal savings account, the 401(k) is tied to your employer — it moves with you when you leave.",
      impact:
        "Marcus's 6% contribution of $212.50/month reduces his taxable income by the same amount. At his effective tax rate of roughly 12%, that $212.50 only reduces his take-home by about $186 — he keeps $186 instead of $212.50 not going to retirement at all. The tax treatment makes every dollar he contributes more efficient than a regular savings account.",
    },
  },
  {
    visual: <InvestingVisual highlightSection="match" />,
    narrative: (
      <>
        <p>
          <Em>&ldquo;Here&apos;s the part that gets people,&rdquo;</Em> Diane said.{" "}
          <Em>&ldquo;Your company matches 50% of whatever you put in, up to 6% of your salary.&rdquo;</Em>
        </p>
        <p>
          Marcus did the math. His salary: <Num>$42,500</Num>. Six percent: <Num>$2,550/year</Num>.
          The company would add 50% of that:{" "}
          <Num>$1,275</Num>. For free. Every year. He had to put in <Num>$212.50/month</Num> to
          get the full match.{" "}
          <Em>&ldquo;What if I don&apos;t contribute enough to get the match?&rdquo;</Em> he asked.
        </p>
        <p>
          <Em>&ldquo;Then you&apos;re leaving $1,275 on the table. Annually. For the entire
          time you work here.&rdquo;</Em>
        </p>
      </>
    ),
    term: {
      name: "Employer Match",
      definition:
        "An employer match is when your company contributes money to your 401(k) proportional to your own contributions — commonly 50% match up to 3–6% of salary. The match only applies to the percentage you actually contribute. Contribute less than the match threshold and you forfeit the unmatched portion. It's the closest thing to a guaranteed 50–100% return available anywhere.",
      impact:
        "Marcus's match: $1,275/year added to his account at no additional cost. Over 10 years at 7% growth, that $1,275/year of employer money (ignoring his own contributions) grows to about $17,600. He had almost missed the enrollment deadline — almost left $17,600+ on the table before a single investment decision was made.",
    },
  },
  {
    visual: <InvestingVisual highlightSection="fund" />,
    narrative: (
      <>
        <p>
          The enrollment portal had 18 fund options. Marcus stared at the list for a
          long time. He recognized none of the names except one:{" "}
          <strong>Vanguard 500 Index Fund Admiral Shares. Expense ratio: 0.04%.</strong>
        </p>
        <p>
          He spent an hour reading. Every source said the same thing: most actively
          managed funds underperform the index over 20+ years. The fund managers
          who charge 1–2% to try to beat the market almost never do — and even when
          they do, the fees eat the difference. An index fund holds a slice of every
          company in the S&amp;P 500, costs almost nothing to run, and has historically
          returned <Num>~10.5%/year</Num> since 1957. He made his choice.
        </p>
      </>
    ),
    term: {
      name: "Index Fund",
      definition:
        "An index fund holds a proportional slice of every company in a market index — the S&P 500 index fund, for example, holds fractions of all 500 companies proportionally to their market size. Because it requires no active stock selection, the expense ratio is near zero (0.04–0.10%). Decades of data show that index funds outperform most actively-managed funds over 20+ year periods after fees.",
      impact:
        "A 1% lower expense ratio on a $10,000 investment compounding for 30 years at 7% gross = approximately $19,800 more in your account ($76,100 vs. $57,400). Marcus's 0.04% index fund vs. a 1% actively managed fund on his $318.75/month contributions: after 40 years, the difference is approximately $200,000. Fund fees are a permanent drag on returns.",
    },
  },
  {
    visual: <InvestingVisual highlightSection="targetdate" />,
    narrative: (
      <>
        <p>
          Diane suggested something simpler while Marcus was staring at fund options.{" "}
          <Em>&ldquo;Target date fund. You pick the year closest to when you plan to retire.
          Put everything in it. Never think about it again.&rdquo;</Em>
        </p>
        <p>
          He found the <strong>Vanguard Target Retirement 2065 Fund</strong>. It held 90%
          stocks now — for growth — and would automatically shift to 40% stocks by 2065
          as he approached retirement age, reducing risk without requiring any action from
          him. The expense ratio: <Num>0.08%</Num>. He chose it. He could always change
          later. But &ldquo;set it and forget it&rdquo; was a better starting strategy than
          never getting started at all.
        </p>
      </>
    ),
    term: {
      name: "Target Date Fund",
      definition:
        "A target date fund automatically adjusts its investment mix over time based on a projected retirement year. In early decades, it holds mostly stocks for growth. As the target year approaches, it shifts toward bonds for capital preservation — reducing volatility automatically without any action required from you. It's a complete retirement portfolio in a single fund.",
      impact:
        "At 22, Marcus holds 90% stocks in his 2065 fund — appropriate for a 43-year time horizon where short-term volatility doesn't matter. By 2045, the fund auto-shifts to 65% stocks. By 2065, it's 40% stocks. He doesn't have to learn to rebalance, pick new funds, or react to market downturns — the fund handles it. Inaction becomes the right action.",
    },
  },
  {
    visual: <InvestingVisual highlightSection="compound" />,
    narrative: (
      <>
        <p>
          Marcus ran one more calculation before he hit submit.
          He&apos;d been putting this off for three weeks. What if he&apos;d waited until he
          was <Num>32</Num> to start? Same contribution rate. Same salary growth.
          Same fund. Just 10 years later.
        </p>
        <p>
          Starting at 22: projected balance at 65: <Num>~$519,000</Num>.
          Starting at 32: <Num>~$241,000</Num>. The <Num>$278,000 difference</Num> wasn&apos;t
          from contributing more. It wasn&apos;t from a better fund or smarter choices.
          It was from clicking &ldquo;Enroll&rdquo; on November 28th instead of waiting
          until he was 32 to figure it out. He clicked Enroll. He closed the laptop.
          He went to get lunch.
        </p>
      </>
    ),
    term: {
      name: "Compound Interest",
      definition:
        "Compound interest is earning returns on your returns — the interest, dividends, and gains from your investments generate their own future gains. The longer the time horizon, the more dramatic the effect. Doubling the starting age reduces the ending balance by more than half, because the years of compounding early in a portfolio's life are the most valuable.",
      impact:
        "Marcus's $212.50/month contribution starting at 22 produces ~$519,000 by 65 at 7% average returns. Starting the same contribution at 32 produces ~$241,000 — a $278,000 difference from 10 fewer years of compounding. He didn't contribute more. He just started earlier. Time is the one variable in compound interest that can never be recovered.",
    },
  },
];

export default function InvestingNarrativeLesson({ onReady }: { onReady: () => void }) {
  return (
    <NarrativeLesson
      title="Marcus Clicks Enroll"
      character="A first-year analyst, 22 years old, with a 401(k) deadline he almost ignored"
      beats={BEATS}
      accent={ACCENT}
      onReady={onReady}
      ctaLabel="Start My Investment Plan →"
      ctaSubtitle="You've seen why Marcus almost left $278,000 on the table. Now let's start yours."
    />
  );
}
