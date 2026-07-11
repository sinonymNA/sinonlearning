"use client";

import NarrativeLesson, { StoryBeat } from "./NarrativeLesson";
import NetWorthVisual from "./NetWorthVisual";

const ACCENT = "#7c3aed";
const INK = "#0f172a";

function Em({ children }: { children: React.ReactNode }) {
  return <em style={{ color: INK, fontStyle: "italic" }}>{children}</em>;
}

function Num({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: INK }}>{children}</strong>;
}

const BEATS: StoryBeat[] = [
  {
    visual: <NetWorthVisual highlightSection="networth" />,
    narrative: (
      <>
        <p>
          One year into her job at Apex Creative, Maya sat down on a Sunday afternoon
          with a blank spreadsheet and a question she&apos;d been avoiding:{" "}
          <Em>What do I actually have?</Em>
        </p>
        <p>
          She listed everything she owned. Everything she owed. Subtracted one from
          the other. The number that appeared was <Num>($8,500)</Num>.
          Negative. She stared at it. She&apos;d expected worse — she&apos;d entered
          the workforce with <Num>$28,000</Num> in student loans. But she&apos;d also
          expected better. She called her dad.{" "}
          <Em>&ldquo;Is negative $8,500 bad?&rdquo;</Em>
          He asked a different question: <Em>&ldquo;What was it a year ago?&rdquo;</Em>
          She didn&apos;t know. That was the point he was making.
        </p>
      </>
    ),
    term: {
      name: "Net Worth",
      definition:
        "Net worth = total assets − total liabilities. It's a point-in-time financial snapshot: what you own minus what you owe. At 22–25, negative net worth is normal — student loans are liabilities that most graduates carry. Net worth is not a measure of success, character, or financial skill. It's a baseline that becomes meaningful only when you compare it to where it was before.",
      impact:
        "Maya's net worth of ($8,500) tells her almost nothing by itself. Combined with where she started ($19,000 negative one year ago), it tells her everything: she improved by $10,500 in 12 months — an average of $875/month in net worth growth while living on her own for the first time. The number matters less than its direction.",
    },
  },
  {
    visual: <NetWorthVisual highlightSection="assets" />,
    narrative: (
      <>
        <p>
          She built the left column first: things she owned.
          Checking account: <Num>$1,850</Num>. High-yield savings: <Num>$4,200</Num>.
          Her 401(k), which had grown slightly faster than she&apos;d expected: <Num>$3,150</Num>.
          Her 2022 Honda Civic, which she&apos;d bought used for $14,000 and was now
          worth <Num>$8,500</Num>.
        </p>
        <p>
          She stared at the car number. It was lower than she expected.
          <Em>&ldquo;Cars lose value the second you drive them off the lot,&rdquo;</Em>
          she remembered someone saying. She&apos;d bought a $14,000 car and already
          had <Num>$5,500</Num> less in net worth to show for it — just from depreciation,
          not from anything she did wrong.
        </p>
      </>
    ),
    term: {
      name: "Assets",
      definition:
        "Assets are things you own with monetary value that could be converted to cash: checking and savings accounts, investment accounts, retirement accounts, vehicles at current market value, real estate at current market value. Not everything you paid for qualifies — a $1,200 laptop at 3 years old might be worth $200. Assets are valued at what they're worth today, not what you paid.",
      impact:
        "Maya's $17,700 in total assets includes $3,150 in her 401(k) — money she can't access without penalty until retirement. It includes $8,500 in a car that loses value every year. And it includes $6,050 in liquid savings she can actually reach immediately. The composition of your assets matters as much as the total — not all $17,700 is equally available to her.",
    },
  },
  {
    visual: <NetWorthVisual highlightSection="liabilities" />,
    narrative: (
      <>
        <p>
          The right column: things she owed. Credit card: <Num>$0</Num>.
          Car loan: <Num>$0</Num> — she&apos;d bought it outright from savings before
          her job started. Student loan: <Num>$26,200</Num>.
        </p>
        <p>
          She&apos;d borrowed <Num>$28,000</Num> for school. After 12 months of
          $280/month payments, the balance was $26,200. She&apos;d sent{" "}
          <Num>$3,360</Num> to her loan servicer. <Num>$1,800</Num> had come off
          the principal. The rest had gone to interest. She knew this was how loans
          worked. Seeing it in her own numbers made it concrete for the first time.
        </p>
      </>
    ),
    term: {
      name: "Liabilities",
      definition:
        "Liabilities are debts you legally owe: student loans, car loans, credit card balances, mortgages, personal loans. Every liability reduces your net worth by its exact balance. A $26,200 student loan balance reduces net worth by $26,200 — regardless of the education it funded or the career it enabled. Liabilities aren't bad by definition; they become a problem only when they exceed your ability to service them.",
      impact:
        "Maya's single liability of $26,200 on a $28,000 loan at 5.5% interest means $1,540 of her first 12 months' payments went to interest rather than reducing what she owes. By the end of year 10, she will have paid approximately $36,700 total to retire a $28,000 loan — $8,700 in interest. The faster she pays beyond the minimum, the less that number grows.",
    },
  },
  {
    visual: <NetWorthVisual highlightSection="liquidity" />,
    narrative: (
      <>
        <p>
          Her dad asked a practical question: <Em>&ldquo;If your car broke down tomorrow
          and needed a $2,000 repair — how long would it take to get the money?&rdquo;</Em>
        </p>
        <p>
          She looked at her asset list. The 401(k): can&apos;t touch it without a
          10% penalty plus income tax — effectively <Num>$2,500+</Num> in costs to access $2,000.
          The car: she&apos;d need to sell it, which takes days at minimum.
          The checking and savings: she had <Num>$6,050</Num> available by tomorrow morning.
          That was her real safety net. Not $17,700. <Num>$6,050</Num>.
        </p>
      </>
    ),
    term: {
      name: "Liquidity",
      definition:
        "Liquidity describes how quickly and easily an asset can be converted to cash without significant loss. Cash and checking accounts are fully liquid — instantly available. HYSAs are liquid within 1–2 business days. A 401(k) is technically accessible but taxed and penalized — effectively illiquid for emergencies. A house is highly illiquid — selling takes weeks or months and costs 6–10% of the value in fees.",
      impact:
        "Maya has $17,700 in assets but only $6,050 is liquid (checking $1,850 + HYSA $4,200). Her 401(k) and car are illiquid for emergency purposes. If a $6,000 emergency hit — major medical bill, job loss for two months — her liquid assets could handle it with a $50 buffer. If a $7,000 emergency hit, she'd need to borrow. Liquidity is the difference between having wealth and having access to it.",
    },
  },
  {
    visual: <NetWorthVisual highlightSection="trajectory" />,
    narrative: (
      <>
        <p>
          Her dad told her to write down one more number: her net worth from exactly
          a year ago. She hadn&apos;t tracked it then, but she could reconstruct it.
          Before the job: savings of <Num>$3,200</Num>, the car at <Num>$14,000</Num>,
          no investments. Student loan: <Num>$28,000</Num>. Net worth: <Num>($10,800)</Num>.
        </p>
        <p>
          Wait — <Num>($10,800)</Num> then, <Num>($8,500)</Num> now.
          She&apos;d improved by <Num>$2,300</Num>. Better than nothing, but not the leap
          she expected from a full year of working. Then she remembered the car.
          She&apos;d bought it for $14,000 before her job started using savings —
          and it was now worth $8,500. The <Num>$5,500</Num> drop in car value had
          offset most of a year&apos;s financial progress. <Em>The car depreciation was
          invisible until she tracked net worth. Now it wasn&apos;t.</Em>
        </p>
      </>
    ),
    term: {
      name: "Net Worth Trajectory",
      definition:
        "Net worth trajectory is the rate of change in your net worth over time — the direction and speed of financial progress. A negative net worth improving month over month is a better financial picture than a stagnant positive net worth. Trajectory reveals whether your financial habits are building or eroding wealth, which a single snapshot never shows.",
      impact:
        "Maya's net worth improved by $2,300 in Year 1 — but only because she rebuilt her savings, reduced her loan balance, and contributed to retirement. The car depreciation erased $5,500 of progress she otherwise would have seen. Understanding trajectory taught her that a $14,000 car purchase was a $5,500/year headwind on her net worth, not a one-time cost. That's the kind of math that changes future decisions.",
    },
  },
];

export default function NetWorthNarrativeLesson({ onReady }: { onReady: () => void }) {
  return (
    <NarrativeLesson
      title="Maya's Year-End Reckoning"
      character="A graphic designer, 24 years old, doing the math on her first full year"
      beats={BEATS}
      accent={ACCENT}
      onReady={onReady}
      ctaLabel="Calculate My Net Worth →"
      ctaSubtitle="You've seen Maya's first real balance sheet. Now let's build yours."
    />
  );
}
