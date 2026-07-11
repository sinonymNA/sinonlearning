"use client";

import NarrativeLesson, { StoryBeat } from "./NarrativeLesson";
import BudgetVisual from "./BudgetVisual";

const ACCENT = "#16a34a";
const INK = "#0f172a";

function Em({ children }: { children: React.ReactNode }) {
  return <em style={{ color: INK, fontStyle: "italic" }}>{children}</em>;
}

function Num({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: INK }}>{children}</strong>;
}

const BEATS: StoryBeat[] = [
  {
    visual: <BudgetVisual highlightSection="framework" />,
    narrative: (
      <>
        <p>
          Jordan&apos;s first paycheck landed on October 15th: <Num>$2,700</Num>.
          She&apos;d been waiting for this moment for four years of college and six months
          of rejection emails. She texted her best friend: <Em>&ldquo;I&apos;m rich lol.&rdquo;</Em>
        </p>
        <p>
          By October 31st she had <Num>$188</Num> left. She had no idea where it went.
          She started November with one rule: she was going to figure this out before it happened again.
          She opened a spreadsheet and typed the first thing she remembered learning in
          her personal finance class: 50% needs. 30% wants. 20% savings.
          <Em> $2,700 → $1,350 · $810 · $540.</Em> She stared at the numbers for a long time.
        </p>
      </>
    ),
    term: {
      name: "50/30/20 Rule",
      definition:
        "A budget guideline: allocate 50% of net income to needs, 30% to wants, and 20% to savings and debt payoff. 'Needs' include rent, minimum loan payments, utilities, and transportation — costs you can't skip. 'Wants' are everything discretionary. The 20% savings bucket includes emergency funds, retirement, and extra debt payments.",
      impact:
        "At $2,700/month net, Jordan's 50% needs target is $1,350. But her rent alone is $950, and her student loan minimum is $316 — that's $1,266 before groceries, car insurance, or a phone. Her 'needs' bucket already exceeds 50%. The 50/30/20 rule is a starting point, not a guarantee that it fits your life.",
    },
  },
  {
    visual: <BudgetVisual highlightSection="fixed" />,
    narrative: (
      <>
        <p>
          She listed every expense she could think of and then stared at two different kinds.
          Some had one thing in common: they were exactly the same every month whether she
          thought about them or not. Rent: <Num>$950</Num>. Student loan minimum:{" "}
          <Num>$316</Num>. Car insurance: <Num>$90</Num>. Phone: <Num>$65</Num>.
          Total: <Num>$1,421</Num>. She hadn&apos;t even bought a single meal yet and
          already <Num>52.6%</Num> of her paycheck was spoken for.
        </p>
        <p>
          <Em>&ldquo;These I can&apos;t touch,&rdquo;</Em> she wrote at the top of the column.
          Everything else was the variable: the groceries, the gas, the dinners out.
          The budget only lived inside what was left.
        </p>
      </>
    ),
    term: {
      name: "Fixed vs. Variable Expenses",
      definition:
        "Fixed expenses are locked in — same amount every month, committed in advance: rent, loan minimums, insurance premiums, subscriptions. Variable expenses change month to month based on behavior: groceries, gas, dining, clothing. You cannot reduce fixed expenses in the short term without breaking a contract or a commitment. You can reduce variables immediately.",
      impact:
        "Jordan's $1,421 in fixed expenses is 52.6% of her $2,700 net income — already above the 50% target for 'needs,' before a single variable expense. This means every dollar she wants to redirect toward savings must come from the variable column. Fixed costs are the boundary her budget has to work within.",
    },
  },
  {
    visual: <BudgetVisual highlightSection="variance" />,
    narrative: (
      <>
        <p>
          November ended. Jordan opened her spreadsheet to fill in the &ldquo;Actual&rdquo; column.
          Dining out: budgeted <Num>$200</Num>. Actual: <Num>$340</Num>. A birthday dinner
          she&apos;d split with friends, two Friday nights she didn&apos;t plan for, two lunch
          spots near the office that added up faster than she expected.
        </p>
        <p>
          She felt defensive at first. Then she looked at the number again.
          She wasn&apos;t bad at money. She just had an inaccurate budget.{" "}
          <Em>&ldquo;If it happened three months in a row,&rdquo;</Em> her coworker Marcus told her,{" "}
          <Em>&ldquo;the budget number is wrong — not you.&rdquo;</Em>
        </p>
      </>
    ),
    term: {
      name: "Budget Variance",
      definition:
        "Variance is the gap between what you planned to spend and what you actually spent — favorable (under budget) or unfavorable (over). Tracking variance each month reveals where your real spending habits differ from your planned ones. A single month of variance is noise. Three months of the same variance in the same category is signal.",
      impact:
        "Jordan's $140 dining variance in November meant $140 less went to savings than planned. If the same pattern repeats for 12 months, she'll have $1,680 less in savings at year-end than she expected. Variance isn't failure — it's the data that makes next month's budget more accurate.",
    },
  },
  {
    visual: <BudgetVisual highlightSection="emergency" />,
    narrative: (
      <>
        <p>
          October had a chapter Jordan didn&apos;t mention in the November budget review.
          A noise from her car. A mechanic. A bill for <Num>$740</Num>.
          She had <Num>$212</Num> in checking at the time.
        </p>
        <p>
          She put <Num>$528</Num> on her credit card. She paid it off over two months,
          plus <Num>$18</Num> in interest. The $740 car repair cost her <Num>$758</Num>.
          She&apos;d known the repair was coming — the car had made that sound for a month.
          She just hadn&apos;t had anywhere to put money for it.
        </p>
        <p>
          In December, the first line she wrote in her budget was: <Em>Emergency fund: $200.</Em>
        </p>
      </>
    ),
    term: {
      name: "Emergency Fund",
      definition:
        "A cash reserve — held in a separate, accessible account — sized to cover 3–6 months of essential expenses in case of job loss, medical bills, car repairs, or any unplanned expense. The goal is never to need it but to always have it. Without one, unexpected costs become credit card debt at 20–25% APR.",
      impact:
        "Jordan's $740 car repair cost her $758 because she had no emergency fund. Had she been saving $150/month for 5 months, she'd have covered the repair entirely from savings with $10 to spare. The emergency fund doesn't earn your highest return — it prevents your worst financial outcome.",
    },
  },
  {
    visual: <BudgetVisual highlightSection="zerobased" />,
    narrative: (
      <>
        <p>
          December 1st. Jordan opened a new page in her spreadsheet and typed one rule
          at the top: <Em>Every dollar needs a job before it&apos;s spent.</Em>
        </p>
        <p>
          She started with <Num>$2,700</Num> and worked down: fixed expenses, groceries,
          gas, dining out (budgeted more honestly this time at $250), miscellaneous, sinking
          fund for the next car bill, emergency fund. When she finished, the total equaled{" "}
          <Num>$2,700</Num> exactly. Zero left over. Not because she was spending everything —
          because she&apos;d given everything a purpose before December started.
          Nothing was sitting in a checking account waiting to be spent on something she
          didn&apos;t choose.
        </p>
      </>
    ),
    term: {
      name: "Zero-Based Budget",
      definition:
        "A zero-based budget assigns every dollar of income to a specific purpose — a spending category, a savings account, a debt payment — so that income minus all allocations equals zero. Every dollar is intentionally directed before the month begins. 'Zero' doesn't mean spending everything; it means having no unassigned money that can drift toward impulse spending.",
      impact:
        "Jordan's zero-based December budget: $1,421 fixed + $250 groceries + $75 gas + $250 dining + $100 misc + $200 sinking fund + $404 emergency fund = $2,700. Every dollar assigned. When an unexpected expense hits, the question isn't 'do I have money?' — she knows exactly what she has and where it already belongs.",
    },
  },
];

export default function BudgetNarrativeLesson({ onReady }: { onReady: () => void }) {
  return (
    <NarrativeLesson
      title="Jordan's $188 Wake-Up Call"
      character="An entry-level analyst, 23 years old, figuring out where the money goes"
      beats={BEATS}
      accent={ACCENT}
      onReady={onReady}
      ctaLabel="Build My Real Budget →"
      ctaSubtitle="You've seen where Jordan's money went. Now let's give every one of your dollars a job."
    />
  );
}
