"use client";

import NarrativeLesson, { StoryBeat } from "./NarrativeLesson";
import BankVisual from "./BankVisual";

const ACCENT = "#0369a1";
const INK = "#0f172a";

function Em({ children }: { children: React.ReactNode }) {
  return <em style={{ color: INK, fontStyle: "italic" }}>{children}</em>;
}

function Num({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: INK }}>{children}</strong>;
}

const BEATS: StoryBeat[] = [
  {
    visual: <BankVisual highlightSection="checking" />,
    narrative: (
      <>
        <p>
          Marcus had used the same bank since high school. The same checking account.
          He&apos;d never thought to change it. On the Monday after his first payday,
          his coworker Diane asked where he banked. He told her.
        </p>
        <p>
          She made a face. Not critical exactly — more like someone who just found out
          a friend had been using dial-up internet.{" "}
          <Em>&ldquo;Do you have a savings account there too?&rdquo;</Em> she asked.
          He did. He kept everything in one place because it was easy.{" "}
          <Em>&ldquo;Easy and optimal are different things,&rdquo;</Em> she said.{" "}
          <Em>&ldquo;Let me show you something.&rdquo;</Em>
        </p>
      </>
    ),
    term: {
      name: "Checking vs. Savings",
      definition:
        "Checking accounts are designed for daily transactions — paying bills, making purchases, receiving direct deposit. No limits on withdrawals, debit card linked, but earns essentially no interest. Savings accounts hold reserves you don't plan to spend immediately — money should move in, grow, and only move out for emergencies or planned purposes.",
      impact:
        "Keeping all money in one checking account works — but it removes friction between you and unplanned spending. A separate savings account creates a psychological barrier and, if it's the right kind of account, also earns interest. The right structure doesn't cost anything to set up and pays dividends immediately.",
    },
  },
  {
    visual: <BankVisual highlightSection="apy" />,
    narrative: (
      <>
        <p>
          Diane pulled up a chart on her phone. She&apos;d put her <Num>$1,800</Num> emergency
          fund in a high-yield savings account nine months ago. Interest earned since then:{" "}
          <Num>$64.13</Num>. Marcus looked at his own savings balance — about the same amount
          at his old bank. Interest earned: <Num>$0.09</Num>.
        </p>
        <p>
          <Em>&ldquo;Sixty-four dollars for doing nothing,&rdquo;</Em> Marcus said.
        </p>
        <p>
          <Em>&ldquo;For doing nothing except choosing the right bank,&rdquo;</Em> she said.
          <Em>&ldquo;And that&apos;s with $1,800. Wait until you have a real emergency fund.&rdquo;</Em>
        </p>
      </>
    ),
    term: {
      name: "APY & High-Yield Savings",
      definition:
        "APY (Annual Percentage Yield) is the actual annual return on a deposit account, including the effect of compounding. Traditional savings accounts at big banks pay 0.01% APY. High-yield savings accounts (HYSAs) — typically offered by online banks — pay 4–5% APY with identical FDIC insurance protection. The same money. A different bank. A dramatically different outcome.",
      impact:
        "$1,800 in a traditional savings account earns $0.18/year. The same $1,800 in a 4.75% HYSA earns $85.50/year. Over 5 years, the difference is $427 in interest — earned on the same deposits, for no additional effort. The only cost of staying at the old bank is choosing not to switch.",
    },
  },
  {
    visual: <BankVisual highlightSection="fdic" />,
    narrative: (
      <p>
        Marcus&apos;s first question: <Em>&ldquo;Is it safe? Like, is my money actually safe
        at one of these online banks?&rdquo;</Em> Diane said the same thing she always said when
        this question came up: <Em>&ldquo;FDIC insured means the federal government backs
        your deposits. Not the bank — the government. Up to $250,000.
        They could go bankrupt tomorrow and your money comes back.&rdquo;</Em> She&apos;d said
        this to four different coworkers. It always surprised them. The same three letters
        on the website — <strong>FDIC</strong> — that most people skipped past were the ones
        that actually mattered.
      </p>
    ),
    term: {
      name: "FDIC Insurance",
      definition:
        "The Federal Deposit Insurance Corporation (FDIC) insures deposits up to $250,000 per depositor per institution at any FDIC-member bank. If the bank fails, the FDIC makes depositors whole — your money is returned, fully, within days. Both traditional and online banks can be FDIC-insured. Check for the FDIC logo before opening any deposit account.",
      impact:
        "Marcus's $843 checking balance and $1,800 savings — combined $2,643 — are fully protected by FDIC insurance regardless of which FDIC-insured bank holds them. A bank failure that made headlines the week before would have cost him nothing. The FDIC has never failed to fully protect an insured deposit since 1934.",
    },
  },
  {
    visual: <BankVisual highlightSection="overdraft" />,
    narrative: (
      <>
        <p>
          Two weeks after Diane&apos;s banking lesson, Marcus checked his account and found
          a <Num>$35 overdraft fee</Num>. He dug through his transactions. He&apos;d had{" "}
          <Num>$4.78</Num> in checking when his <Num>$15</Num> renters insurance autopay
          tried to process. The bank covered the $15. Then charged him $35 for the favor.
          That $15 payment cost <Num>$50</Num>.
        </p>
        <p>
          He called the bank. A 10-minute hold. A representative who refunded the fee
          as a one-time courtesy. He turned on low-balance alerts. He also transferred
          an extra <Num>$200</Num> from savings into checking as a permanent buffer.
          He never wanted to make that call again.
        </p>
      </>
    ),
    term: {
      name: "Overdraft",
      definition:
        "An overdraft occurs when a transaction — a debit purchase, an ACH payment, a check — exceeds your available checking balance. Banks either decline the transaction (if you've opted out of overdraft coverage) or cover it and charge an overdraft fee of $25–$35 per occurrence. One forgotten autopay can trigger the fee even if you have the money elsewhere.",
      impact:
        "Marcus's $15 payment cost $50 because of a $35 overdraft fee. Solutions: keep a $200–$500 buffer in checking, set up low-balance alerts, link savings as overdraft protection (many banks offer this free), or choose a bank that charges no overdraft fees. The fee is avoidable — it only happens once before most people fix it.",
    },
  },
  {
    visual: <BankVisual highlightSection="ach" />,
    narrative: (
      <>
        <p>
          Marcus set up bill pay that same week. Rent, student loans, car insurance —
          all scheduled to process automatically a day before each due date.
          His landlord asked about the timing.{" "}
          <Em>&ldquo;ACH transfers take a day or two,&rdquo;</Em> Marcus said.{" "}
          <Em>&ldquo;It&apos;ll be there by the 1st.&rdquo;</Em>
        </p>
        <p>
          His landlord mentioned a previous tenant who&apos;d tried to wire rent on the
          1st every month — $25 in fees each time, $300/year, because they misunderstood
          the timeline. Marcus did the calculation. Over a 12-month lease:{" "}
          <Num>$300</Num> spent on wire fees for transactions that ACH would have handled
          free, one day earlier.
        </p>
      </>
    ),
    term: {
      name: "ACH vs. Wire Transfer",
      definition:
        "ACH (Automated Clearing House) is the network behind direct deposit, bill pay, and most bank transfers — free or low-cost, processed in 1–3 business days in batches. Wire transfers are processed individually and near-instantly but cost $15–$45 to send. Use ACH for recurring payments where timing is predictable. Use wires for same-day critical transfers where cost is secondary.",
      impact:
        "Marcus's monthly rent payment via ACH: $0. Via wire: $25/month = $300/year in unnecessary fees. ACH covers 99% of everyday banking needs. The cases that genuinely require wires — closing on a car, international transfers, time-critical payments — are rare enough that the fee is justified when needed.",
    },
  },
];

export default function BankingNarrativeLesson({ onReady }: { onReady: () => void }) {
  return (
    <NarrativeLesson
      title="Marcus and the $474 Question"
      character="A first-year analyst, 22 years old, learning his bank was quietly costing him money"
      beats={BEATS}
      accent={ACCENT}
      onReady={onReady}
      ctaLabel="Set Up My Banking →"
      ctaSubtitle="You've seen what Diane showed Marcus. Now let's set up the right accounts for you."
    />
  );
}
