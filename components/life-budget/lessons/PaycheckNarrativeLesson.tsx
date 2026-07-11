"use client";

import NarrativeLesson, { StoryBeat } from "./NarrativeLesson";
import PayStubVisual from "./PayStubVisual";

const ACCENT = "#059669";

const INK = "#0f172a";

function Em({ children }: { children: React.ReactNode }) {
  return <em style={{ color: INK, fontStyle: "italic" }}>{children}</em>;
}

function Num({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: INK }}>{children}</strong>;
}

const BEATS: StoryBeat[] = [
  {
    visual: <PayStubVisual highlightSection="gap" />,
    narrative: (
      <>
        <p>
          Marcus checked his phone on a Friday morning. Direct deposit:{" "}
          <Num>$2,554</Num>. He&apos;d expected <Num>$3,542</Num> — his{" "}
          <Num>$42,500</Num> salary divided by 12.
        </p>
        <p>
          He did the math twice. Both times: <Num>nearly $1,000 missing</Num>.
          He sat at his desk and stared at the number. Then he walked to his
          coworker Diane&apos;s desk.{" "}
          <Em>&ldquo;Where does it go?&rdquo;</Em> She pulled her chair next to
          his.
        </p>
      </>
    ),
    term: {
      name: "Gross vs. Net Income",
      definition:
        "Gross income is what your employer agreed to pay you — the number in your offer letter. Net income is what actually deposits. The $988 gap isn't missing and it isn't a mistake. It's the sum of several mandatory and elected deductions, all taken before the money ever reaches you.",
      impact:
        "Marcus's $42,500/year becomes $30,648/year after all deductions — an $11,852 annual gap. His entire budget: rent, food, savings, loan payments, everything, has to fit inside that lower number, not the figure in his offer letter.",
    },
  },
  {
    visual: <PayStubVisual highlightSection="federal" />,
    narrative: (
      <>
        <p>
          Line 1 on his pay stub:{" "}
          <strong>Federal Income Tax: $295</strong>. Marcus had read about tax
          brackets.{" "}
          <Em>&ldquo;Am I in the 22% bracket?&rdquo;</Em>
        </p>
        <p>
          Diane shook her head.{" "}
          <Em>
            &ldquo;You&apos;re near it — but it doesn&apos;t mean you pay 22% on
            everything. The bracket only applies to income above the threshold.
            After the standard deduction, most of your salary sits in the 12%
            bracket. Your effective rate comes out to about 10%.&rdquo;
          </Em>
        </p>
        <p>
          Marcus stared at $295 on the screen.{" "}
          <Em>&ldquo;Still $3,540 a year,&rdquo;</Em> he said. She nodded.{" "}
          <Em>&ldquo;Yes.&rdquo;</Em>
        </p>
      </>
    ),
    term: {
      name: "Federal Income Tax",
      definition:
        "The US uses progressive tax brackets — each rate applies only to income within that bracket's range. At $42,500, Marcus takes the $14,600 standard deduction first. His taxable income is $27,900: he pays 10% on the first $11,600, then 12% on the remaining $16,300. The 22% bracket doesn't touch his salary at all.",
      impact:
        "$295/month, $3,540/year in federal taxes on a $42,500 salary — an effective rate of about 10%, not 22%. A $5,000 raise keeps Marcus comfortably in the same bracket. Knowing this matters when evaluating a job offer or a salary bump.",
    },
  },
  {
    visual: <PayStubVisual highlightSection="fica" />,
    narrative: (
      <>
        <p>
          Lines 2 and 3:{" "}
          <strong>Social Security: $220. Medicare: $51.</strong> Total: $271.
        </p>
        <p>
          <Em>&ldquo;These are different,&rdquo;</Em> Diane said.{" "}
          <Em>
            &ldquo;There&apos;s no bracket. No W-4 adjustment that touches them.
            Social Security is 6.2% of every dollar you earn. Medicare is 1.45%.
            You pay it. I pay it. Every employed person in America pays it.&rdquo;
          </Em>
        </p>
        <p>
          Marcus did the math quietly: $271/month, $3,252/year, for every year he
          worked. <Em>&ldquo;What do I get for it?&rdquo;</Em> Diane paused.{" "}
          <Em>
            &ldquo;Eventually — retirement income. And Medicare when you&apos;re
            65. But that feels very far away right now, I know.&rdquo;
          </Em>
        </p>
      </>
    ),
    term: {
      name: "FICA",
      definition:
        "Federal Insurance Contributions Act: 7.65% from every paycheck — 6.2% for Social Security and 1.45% for Medicare. Unlike income tax, nothing on your W-4 reduces FICA. Your employer also pays a matching 7.65% on your behalf, a cost of employment that never appears anywhere on your pay stub.",
      impact:
        "Marcus pays $3,252/year in FICA. His employer pays another $3,252 on his behalf. Together, $6,504/year flows to Social Security and Medicare on a $42,500 salary — before income tax, before benefits, before anything else.",
    },
  },
  {
    visual: <PayStubVisual highlightSection="benefits" />,
    narrative: (
      <>
        <p>
          Two more lines: <strong>Health Insurance: $140</strong>.{" "}
          <strong>401(k): $177</strong> — Marcus had elected 5%.
        </p>
        <p>
          He almost lumped them together as &ldquo;stuff the company takes.&rdquo;
          Diane stopped him.
        </p>
        <p>
          <Em>
            &ldquo;Those are completely different. The $177 in your 401(k) is
            still yours — it&apos;s sitting in an account with your name on it,
            growing, tax-deferred. The $140 for health insurance is gone. But it
            bought you something real. One ER visit without insurance averages
            $2,000 — more than your entire year of premiums.&rdquo;
          </Em>
        </p>
      </>
    ),
    term: {
      name: "Pre-Tax Benefits",
      definition:
        "Both the 401(k) and health insurance premiums are deducted before taxes, which lowers your taxable income. But the 401(k) creates an asset: it compounds in your name and you'll withdraw it in retirement. Health insurance creates protection. The pay stub says both reduce your paycheck. The outcome is completely different.",
      impact:
        "Marcus contributes $177/month to his 401(k). His employer adds a 3% match — $106 more each month. His actual retirement savings rate: $283/month, even though only $177 came from his paycheck. The $140 health premium also protects him from costs that could otherwise wipe out months of savings.",
    },
  },
  {
    visual: <PayStubVisual highlightSection="net" />,
    narrative: (
      <>
        <p>
          Diane wrote a number on a sticky note and handed it to Marcus:{" "}
          <Num>$2,554</Num>.
        </p>
        <p>
          <Em>
            &ldquo;That&apos;s your budget. Every decision you make this month —
            rent, groceries, your student loan, savings, everything — comes out of
            that number. I know it&apos;s less than you expected. But knowing it
            exactly is worth more than guessing at the round number.&rdquo;
          </Em>
        </p>
        <p>Marcus folded the sticky note and put it in his wallet.</p>
      </>
    ),
  },
];

export default function PaycheckNarrativeLesson({ onReady }: { onReady: () => void }) {
  return (
    <NarrativeLesson
      title="Marcus and the Missing $988"
      character="A first-year analyst, 22 years old, on his first payday"
      beats={BEATS}
      accent={ACCENT}
      onReady={onReady}
      ctaLabel="Calculate My Paycheck →"
      ctaSubtitle="You've seen where Marcus's $988 went. Now let's find yours."
    />
  );
}
