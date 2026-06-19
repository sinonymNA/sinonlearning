export interface CalibrationClaim {
  text: string;
  isTrue: boolean;
  explanation: string;
}

export type Confidence = "low" | "medium" | "high";

export interface ClaimResponse {
  guessedTrue: boolean;
  confidence: Confidence;
}

export interface CalibrationSummary {
  total: number;
  correctCount: number;
  overconfidentWrong: number; // said "high confidence" but was wrong — the AI-hallucination failure mode
  underconfidentRight: number; // said "low confidence" but was actually right
  wellCalibrated: number; // confidence level matched actual accuracy
}

export function isResponseCorrect(claim: CalibrationClaim, response: ClaimResponse): boolean {
  return response.guessedTrue === claim.isTrue;
}

export function summarizeCalibration(claims: CalibrationClaim[], responses: ClaimResponse[]): CalibrationSummary {
  let correctCount = 0;
  let overconfidentWrong = 0;
  let underconfidentRight = 0;
  let wellCalibrated = 0;

  claims.forEach((claim, i) => {
    const response = responses[i];
    if (!response) return;
    const correct = isResponseCorrect(claim, response);
    if (correct) correctCount++;

    if (response.confidence === "high" && !correct) overconfidentWrong++;
    else if (response.confidence === "low" && correct) underconfidentRight++;
    else if ((response.confidence === "high" && correct) || (response.confidence === "low" && !correct)) {
      wellCalibrated++;
    }
  });

  return { total: claims.length, correctCount, overconfidentWrong, underconfidentRight, wellCalibrated };
}

// A mix of confidently-stated true facts and confidently-stated myths/hallucination-style
// claims, written in the same flat, authoritative register an AI assistant would use — the
// student has to learn to distinguish tone of voice from actual accuracy.
export const CALIBRATION_CLAIMS: CalibrationClaim[] = [
  {
    text: "The Great Wall of China is visible to the naked eye from space.",
    isTrue: false,
    explanation:
      "A persistent myth. The Wall is long but only a few meters wide — astronauts have confirmed it isn't distinguishable from low orbit without aid, let alone from deep space.",
  },
  {
    text: "Mount Everest is the tallest mountain on Earth, measured from sea level to peak.",
    isTrue: true,
    explanation: "Correct — Everest's peak sits at about 8,849 meters above sea level, the highest of any mountain measured this way.",
  },
  {
    text: "Albert Einstein failed math as a student.",
    isTrue: false,
    explanation:
      "A famous myth. Einstein excelled at math from a young age — he had mastered calculus by 15. The story likely spread because grading scales differed between countries.",
  },
  {
    text: "Humans are born with about 270 bones, more than the 206 an adult has, because many fuse together during growth.",
    isTrue: true,
    explanation:
      "True, and easy to mistake for a hallucination because it contradicts the commonly-cited '206 bones' figure — that number only applies to adults.",
  },
  {
    text: "Goldfish have a memory span of only a few seconds.",
    isTrue: false,
    explanation:
      "Debunked. Studies show goldfish can remember things for months — they can even be trained to respond to specific cues well after the fact.",
  },
  {
    text: "The first general-purpose programmable computer, the Z3, was built by Konrad Zuse in 1941.",
    isTrue: true,
    explanation: "Correct, and a good example of a true claim that sounds almost too specific to believe — specificity isn't a sign of fabrication by itself.",
  },
  {
    text: "Bananas are technically classified as berries, while strawberries are not.",
    isTrue: true,
    explanation:
      "True, botanically — a 'true berry' develops from a single flower with one ovary, which bananas satisfy and strawberries (an 'aggregate fruit') don't.",
  },
  {
    text: "Napoleon Bonaparte was unusually short for his era, standing around 5'2\".",
    isTrue: false,
    explanation:
      "A myth that stuck partly due to a measurement-unit mix-up (French vs. English inches). Napoleon was about 5'6\"-5'7\", roughly average height for a Frenchman of his time.",
  },
  {
    text: "Lightning never strikes the same place twice.",
    isTrue: false,
    explanation:
      "False, and dangerously so — tall, exposed structures like the Empire State Building are struck dozens of times a year. Lightning has no memory of where it's already hit.",
  },
  {
    text: "The speed of light in a vacuum is approximately 299,792 kilometers per second.",
    isTrue: true,
    explanation: "Correct — this is one of the most precisely measured constants in physics.",
  },
  {
    text: "Vikings commonly wore horned helmets into battle.",
    isTrue: false,
    explanation:
      "No archaeological battle-helmet finds have horns. The image comes almost entirely from 19th-century opera costumes and later pop culture, not historical Norse gear.",
  },
  {
    text: "Octopuses have three hearts.",
    isTrue: true,
    explanation: "True — two pump blood through the gills, and a third pumps it through the rest of the body.",
  },
];
