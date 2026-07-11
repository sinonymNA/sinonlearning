"use client";

import NarrativeLesson, { StoryBeat } from "./NarrativeLesson";

const ACCENT = "#059669";

const INK  = "#0f172a";
const MUTED = "#64748b";

function Em({ children }: { children: React.ReactNode }) {
  return <em style={{ color: INK, fontStyle: "italic" }}>{children}</em>;
}

function Num({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: INK }}>{children}</strong>;
}

const BEATS: StoryBeat[] = [
  {
    narrative: (
      <p>
        Marcus checked his phone on a Friday morning. Direct deposit:{" "}
        <Num>$2,891</Num>. He&apos;d expected <Num>$3,542</Num> — his{" "}
        <Num>$42,500</Num> salary divided by 12. He did the math twice. Both
        times: <Num>$651 missing</Num>. He sat at his desk and stared at the
        number. Then he walked to his coworker Diane&apos;s desk.{" "}
        <Em>&ldquo;Where does it go?&rdquo;</Em> She pulled her chair next to his.
      </p>
    ),
    term: {
      name: "Gross vs. Net Income",
      definition:
        "Gross income is what your employer agreed to pay you — the number in your offer letter. Net income is what actually deposits. The $651 gap isn't missing and it isn't a mistake. It's the sum of several mandatory and elected deductions, all taken before the money ever reaches you.",
      impact:
        "Marcus's $42,500/year becomes $34,692/year after all deductions — a $7,808 annual gap. His entire budget: rent, food, savings, loan payments, everything, has to fit inside $34,692, not the number he told his parents.",
    },
  },
  {
    narrative: (
      <p>
        Line 1 on his pay stub: <strong>Federal Income Tax: $322</strong>.{" "}
        Marcus had read about tax brackets. <Em>&ldquo;Am I in the 22% bracket?&rdquo;</Em>{" "}
        Diane shook her head. <Em>&ldquo;You&apos;re near it — but it doesn&apos;t mean you pay 22%
        on everything. The bracket only applies to income above the
        threshold. On $42,500, your effective rate is around 11%.&rdquo;</Em> Marcus
        stared at $322 on the screen. <Em>&ldquo;Still $3,864 a year,&rdquo;</Em>{" "}
        he said. She nodded. <Em>&ldquo;Yes.&rdquo;</Em>
      </p>
    ),
    term: {
      name: "Federal Income Tax",
      definition:
        "The US uses progressive tax brackets — each rate applies only to income within that bracket's range, not to your full salary. At $42,500, Marcus pays 10% on the first $11,600, and 12% on income from $11,600 up to $44,725. The 22% bracket doesn't touch his salary at all.",
      impact:
        "$322/month, $3,864/year in federal taxes on a $42,500 salary. His effective rate is about 11% — not 22%. Knowing this matters when evaluating a raise: a $5,000 bump still keeps Marcus comfortably below the 22% bracket threshold.",
    },
  },
  {
    narrative: (
      <p>
        Line 2: <strong>FICA: $325</strong>. <Em>&ldquo;This one is different,&rdquo;</Em> Diane
        said. <Em>&ldquo;There&apos;s no bracket. No threshold. No W-4 adjustment that touches
        it. Social Security is 6.2% of every dollar. Medicare is 1.45%.
        You pay it. I pay it. Every employed person in America pays it.&rdquo;</Em>{" "}
        Marcus did the math quietly: $325/month, $3,900/year, for every year
        he worked. <Em>&ldquo;What do I get for it?&rdquo;</Em> Diane paused.{" "}
        <Em>&ldquo;Eventually — retirement income. And Medicare when you&apos;re 65. But
        that feels very far away right now, I know.&rdquo;</Em>
      </p>
    ),
    term: {
      name: "FICA",
      definition:
        "Federal Insurance Contributions Act: 7.65% taken from every paycheck — 6.2% for Social Security and 1.45% for Medicare. Unlike income tax, nothing on your W-4 reduces FICA. Your employer also pays a matching 7.65% on your behalf, a cost of employment that never appears anywhere on your pay stub.",
      impact:
        "Marcus pays $3,900/year in FICA. His employer pays another $3,900 on his behalf. Together, $7,800/year flows to Social Security and Medicare on a $42,500 salary — before income tax, before benefits, before anything else.",
    },
  },
  {
    narrative: (
      <p>
        Two more lines: <strong>Health Insurance: $140</strong>.{" "}
        <strong>401(k) contribution: $212</strong> (Marcus had elected 5%).
        He almost lumped them together as &ldquo;stuff the company takes.&rdquo; Diane
        stopped him. <Em>&ldquo;Those are completely different. The $212 in your 401k
        is still yours — it&apos;s sitting in an account with your name on it,
        growing, tax-deferred. The $140 for health insurance is gone. It
        bought you coverage. Don&apos;t think of them the same way.&rdquo;</Em>
      </p>
    ),
    term: {
      name: "Pre-Tax Benefits",
      definition:
        "Both the 401k and health insurance premiums are deducted before taxes, which lowers your taxable income and saves you money at filing. But the 401k creates an asset: it compounds in your name and you'll withdraw it in retirement. Health insurance creates protection. The math says both reduce your paycheck. The outcome is very different.",
      impact:
        "Marcus contributes $212/month to his 401k. His employer adds a 3% match ($106/month). His actual retirement savings rate: $318/month — even though only $212 came from his paycheck. The $140 health premium is also working for him: one ER visit without insurance would cost more than his entire year of premiums.",
    },
  },
  {
    narrative: (
      <p>
        Diane wrote a number on a sticky note and handed it to Marcus:{" "}
        <Num>$2,891</Num>. <Em>&ldquo;That&apos;s your budget. Every decision you
        make this month — rent, groceries, your car payment, savings,
        everything — comes out of that number. I know it&apos;s less than you
        expected. But knowing it exactly is worth more than guessing at the
        round number.&rdquo;</Em> Marcus folded the sticky note and put it in his
        wallet.
      </p>
    ),
  },
];

export default function PaycheckNarrativeLesson({ onReady }: { onReady: () => void }) {
  return (
    <NarrativeLesson
      title="Marcus and the Missing $651"
      character="A first-year analyst, 22 years old, on his first payday"
      beats={BEATS}
      accent={ACCENT}
      onReady={onReady}
      ctaLabel="Calculate My Paycheck →"
      ctaSubtitle="You've seen where Marcus's $651 went. Now let's find yours."
    />
  );
}
