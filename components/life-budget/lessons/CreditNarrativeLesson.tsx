"use client";

import NarrativeLesson, { StoryBeat } from "./NarrativeLesson";
import CreditStatementVisual from "./CreditStatementVisual";

const ACCENT = "#dc2626";
const INK = "#0f172a";

function Em({ children }: { children: React.ReactNode }) {
  return <em style={{ color: INK, fontStyle: "italic" }}>{children}</em>;
}

function Num({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: INK }}>{children}</strong>;
}

const BEATS: StoryBeat[] = [
  {
    visual: <CreditStatementVisual highlightSection="apr" />,
    narrative: (
      <>
        <p>
          Priya&apos;s first month at her new job, she sat down with her first adult
          credit card statement. Balance: <Num>$3,400</Num>. College had been expensive
          in ways she hadn&apos;t fully tracked — textbooks, a broken laptop replaced in a hurry,
          a semester her financial aid was delayed. The balance had accumulated quietly.
        </p>
        <p>
          She looked at the interest rate for the first time: <Num>24.99% APR</Num>.
          She searched for what that actually meant in her monthly payment.
          $3,400 × 24.99% ÷ 12 = <Num>$70.97</Num>. Seventy-one dollars — nearly
          her entire minimum payment — was disappearing every month before a single
          dollar touched the actual debt.
        </p>
      </>
    ),
    term: {
      name: "APR",
      definition:
        "APR (Annual Percentage Rate) is the yearly cost of carrying a credit card balance, divided across 12 months. On a $3,400 balance at 24.99% APR, you pay approximately $70.97/month in interest charges — even if you don't make a single new purchase. This interest is charged on the remaining balance at the end of each billing cycle.",
      impact:
        "Priya's $70.97/month in interest means she's paying $851/year just to maintain the same $3,400 balance — without reducing it at all. At that rate, her debt doesn't go down, it stays flat while she pays more than $70 a month for the privilege of owing it.",
    },
  },
  {
    visual: <CreditStatementVisual highlightSection="minimum" />,
    narrative: (
      <>
        <p>
          The minimum payment listed at the bottom: <Num>$68</Num>. She almost felt
          relieved — she could handle $68. Then she looked up what $68/month would
          actually accomplish. The result stopped her cold.
        </p>
        <p>
          Minimum payments only: <Num>141 months</Num> to pay off the balance.
          Nearly 12 years. Total interest paid: <Num>$1,620</Num>.
          She would pay <Num>$5,020</Num> to retire a <Num>$3,400</Num> debt.
          She looked at the alternative: <Num>$150/month</Num>.
          Twenty-seven months. <Num>$480</Num> in interest. Same starting balance.
          <Num> $1,140 less paid </Num> just by doubling the payment.
        </p>
      </>
    ),
    term: {
      name: "Minimum Payment",
      definition:
        "The minimum payment keeps your account in good standing and avoids late fees — typically 2% of the balance or $25, whichever is higher. But minimums barely cover interest charges, leaving the principal almost untouched. The credit card company sets the minimum to maximize the interest you pay over time — it is designed in their interest, not yours.",
      impact:
        "Priya's minimum payment of $68 on a $3,400 balance at 24.99% APR: 141 months and $1,620 in interest to pay off. Paying $150/month instead: 27 months and $480 in interest — $1,140 saved and almost 10 fewer years of payments. The difference between minimum and slightly-more-than-minimum is enormous.",
    },
  },
  {
    visual: <CreditStatementVisual highlightSection="score" />,
    narrative: (
      <>
        <p>
          Priya found an apartment she loved in Midtown. <Num>$1,050/month</Num>.
          She applied. The landlord ran a credit check.
          Three days later: a form rejection. Credit score minimum: <Num>680</Num>.
          Her score: <Num>638</Num>.
        </p>
        <p>
          She hadn&apos;t checked her score since college. She checked it that night.
          The breakdown told the story: payment history — solid. Length of history — short.
          New inquiries — two recent ones from credit cards she&apos;d applied for last year.
          And the biggest number with the biggest weight:{" "}
          <Em>&ldquo;Amounts owed — high utilization.&rdquo;</Em>
        </p>
      </>
    ),
    term: {
      name: "Credit Score",
      definition:
        "A credit score (300–850) summarizes your credit history into a single number used by landlords, lenders, and sometimes employers. The five factors: payment history (35%), amounts owed/utilization (30%), length of history (15%), credit mix (10%), and new inquiries (10%). A score of 680+ is typically required to rent an apartment without a co-signer.",
      impact:
        "Priya's 638 score cost her the apartment she wanted. The gap between 638 and 680 might only take 4–8 months to close by paying down her balance and keeping all payments on time. The same apartment that rejected her today would likely approve her by spring — if she acts now.",
    },
  },
  {
    visual: <CreditStatementVisual highlightSection="utilization" />,
    narrative: (
      <>
        <p>
          She read the credit score explanation more carefully.
          The &ldquo;amounts owed&rdquo; category — the one weighing her score down hardest —
          wasn&apos;t just about how much she owed. It was about what percentage of her
          available credit she was using. Her limit: <Num>$3,500</Num>.
          Her balance: <Num>$3,400</Num>. Utilization: <Num>97%</Num>.
        </p>
        <p>
          The recommended threshold was <Num>30%</Num> — which meant her balance needed
          to drop to <Num>$1,050</Num> or below to stop the penalty. She was using
          nearly every dollar of credit available to her. From the lender&apos;s perspective,
          she looked maxed out. Even if she paid on time every month.
        </p>
      </>
    ),
    term: {
      name: "Credit Utilization",
      definition:
        "Credit utilization is the percentage of your total available credit that you're currently using. It's calculated monthly from your statement balance — even if you plan to pay in full, the balance reported to bureaus at statement close is what counts. High utilization (above 30%) signals financial stress to lenders and drags your score down significantly.",
      impact:
        "Priya's 97% utilization is the single biggest factor hurting her 638 score. Paying the balance from $3,400 to $1,050 (30% utilization) could raise her score by 40–60 points within one billing cycle — potentially moving her from 638 to 680+. Utilization is the fastest score lever she can pull.",
    },
  },
  {
    visual: <CreditStatementVisual highlightSection="inquiry" />,
    narrative: (
      <>
        <p>
          She thought about opening a new credit card to increase her total available
          credit and lower her utilization ratio. She found two cards she liked and
          applied for both on the same afternoon.
        </p>
        <p>
          Two days later she checked her score. It had dropped <Num>10 points</Num>.
          She looked at her credit report: two hard inquiries, both from the same week.
          The applications she&apos;d hoped would help had pushed her further from the
          680 she needed. She canceled the cards and made a plan instead:{" "}
          pay down the balance to $1,050, wait 60 days, check the score.
          No more applications until she understood exactly what each one would cost.
        </p>
      </>
    ),
    term: {
      name: "Hard vs. Soft Inquiry",
      definition:
        "A hard inquiry occurs when a lender pulls your credit to evaluate a loan or card application — it temporarily lowers your score by about 5 points per inquiry and stays on your report for 12 months. A soft inquiry (checking your own score, pre-qualification checks, employer verification) has zero effect on your score. You can check your own credit as often as you want without penalty.",
      impact:
        "Priya's two applications in one week = two hard inquiries = approximately 10 points off her score. She went from 638 to 628 while trying to improve her score. Spaced 6+ months apart, the same applications would have only cost 5 points each. Understanding the difference between hard and soft inquiries is what prevents the well-intentioned mistake.",
    },
  },
];

export default function CreditNarrativeLesson({ onReady }: { onReady: () => void }) {
  return (
    <NarrativeLesson
      title="Priya's $3,400 Statement"
      character="A new grad, 23 years old, reading her credit card statement with adult eyes for the first time"
      beats={BEATS}
      accent={ACCENT}
      onReady={onReady}
      ctaLabel="Document My Credit →"
      ctaSubtitle="You've seen Priya's credit picture. Now let's look at yours."
    />
  );
}
