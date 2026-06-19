// A toy hiring-ranking model used to demonstrate proxy bias: removing one biased feature
// (School Tier) isn't enough when another feature (Zip Tier) is correlated with the same group
// and quietly encodes the same bias. Group labels are intentionally abstract (Group 1 / Group 2)
// rather than real demographic categories — the lesson is about the *mechanism*, not a real-world
// claim about any actual group. By construction, both groups are equally qualified on the merit
// features (GPA, Experience); any ranking gap is purely an artifact of the proxy features.

export type Group = "Group 1" | "Group 2";

export interface Candidate {
  id: string;
  name: string;
  group: Group;
  gpa: number; // 0-4
  experience: number; // years, 0-10
  schoolTier: number; // 1 (lowest) - 3 (highest), correlated with group
  zipTier: number; // 1 (lowest) - 3 (highest), also correlated with group
}

export const CANDIDATES: Candidate[] = [
  { id: "c1", name: "Candidate A", group: "Group 1", gpa: 3.8, experience: 4, schoolTier: 3, zipTier: 3 },
  { id: "c2", name: "Candidate B", group: "Group 1", gpa: 3.1, experience: 7, schoolTier: 2, zipTier: 3 },
  { id: "c3", name: "Candidate C", group: "Group 1", gpa: 3.5, experience: 2, schoolTier: 3, zipTier: 2 },
  { id: "c4", name: "Candidate D", group: "Group 1", gpa: 2.8, experience: 9, schoolTier: 3, zipTier: 3 },
  { id: "c5", name: "Candidate E", group: "Group 1", gpa: 3.9, experience: 1, schoolTier: 2, zipTier: 3 },
  { id: "c6", name: "Candidate F", group: "Group 1", gpa: 3.3, experience: 5, schoolTier: 3, zipTier: 2 },
  { id: "c7", name: "Candidate G", group: "Group 1", gpa: 2.6, experience: 8, schoolTier: 2, zipTier: 3 },
  { id: "c8", name: "Candidate H", group: "Group 1", gpa: 3.6, experience: 3, schoolTier: 3, zipTier: 3 },
  { id: "c9", name: "Candidate I", group: "Group 2", gpa: 3.9, experience: 3, schoolTier: 1, zipTier: 1 },
  { id: "c10", name: "Candidate J", group: "Group 2", gpa: 3.2, experience: 8, schoolTier: 1, zipTier: 2 },
  { id: "c11", name: "Candidate K", group: "Group 2", gpa: 3.7, experience: 2, schoolTier: 2, zipTier: 1 },
  { id: "c12", name: "Candidate L", group: "Group 2", gpa: 2.9, experience: 9, schoolTier: 1, zipTier: 1 },
  { id: "c13", name: "Candidate M", group: "Group 2", gpa: 3.8, experience: 1, schoolTier: 1, zipTier: 2 },
  { id: "c14", name: "Candidate N", group: "Group 2", gpa: 3.4, experience: 5, schoolTier: 2, zipTier: 1 },
  { id: "c15", name: "Candidate O", group: "Group 2", gpa: 2.7, experience: 7, schoolTier: 1, zipTier: 1 },
  { id: "c16", name: "Candidate P", group: "Group 2", gpa: 3.5, experience: 4, schoolTier: 1, zipTier: 2 },
];

export type FeatureKey = "gpa" | "experience" | "schoolTier" | "zipTier";

export const DEFAULT_WEIGHTS: Record<FeatureKey, number> = {
  gpa: 0.3,
  experience: 0.25,
  schoolTier: 0.25,
  zipTier: 0.2,
};

const normalize = (value: number, max: number) => value / max;

function featureValue(candidate: Candidate, key: FeatureKey): number {
  switch (key) {
    case "gpa":
      return normalize(candidate.gpa, 4);
    case "experience":
      return normalize(candidate.experience, 10);
    case "schoolTier":
      return normalize(candidate.schoolTier, 3);
    case "zipTier":
      return normalize(candidate.zipTier, 3);
  }
}

// The "true merit" ground truth — deliberately built from GPA + experience only, so it has
// zero relationship to school or zip tier. Any model that scores differently from this ranking
// purely because of group membership is demonstrating bias, not predicting real performance.
export function trueMeritScore(candidate: Candidate): number {
  return 0.55 * normalize(candidate.gpa, 4) + 0.45 * normalize(candidate.experience, 10);
}

export function modelScore(candidate: Candidate, activeFeatures: FeatureKey[]): number {
  if (activeFeatures.length === 0) return 0;
  const totalWeight = activeFeatures.reduce((sum, key) => sum + DEFAULT_WEIGHTS[key], 0);
  return activeFeatures.reduce(
    (sum, key) => sum + (DEFAULT_WEIGHTS[key] / totalWeight) * featureValue(candidate, key),
    0
  );
}

export function rankByScore(candidates: Candidate[], scoreFn: (c: Candidate) => number): Candidate[] {
  return [...candidates].sort((a, b) => scoreFn(b) - scoreFn(a));
}

export function averageRankByGroup(ranked: Candidate[]): Record<Group, number> {
  const ranks: Record<Group, number[]> = { "Group 1": [], "Group 2": [] };
  ranked.forEach((candidate, index) => {
    ranks[candidate.group].push(index + 1);
  });
  return {
    "Group 1": ranks["Group 1"].reduce((a, b) => a + b, 0) / ranks["Group 1"].length,
    "Group 2": ranks["Group 2"].reduce((a, b) => a + b, 0) / ranks["Group 2"].length,
  };
}

// % of all pairs the model ranks in the same relative order as true merit.
export function agreementWithTrueMerit(candidates: Candidate[], activeFeatures: FeatureKey[]): number {
  let agree = 0;
  let total = 0;
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i];
      const b = candidates[j];
      const modelOrder = Math.sign(modelScore(a, activeFeatures) - modelScore(b, activeFeatures));
      const trueOrder = Math.sign(trueMeritScore(a) - trueMeritScore(b));
      if (modelOrder !== 0 && trueOrder !== 0) {
        total++;
        if (modelOrder === trueOrder) agree++;
      }
    }
  }
  return total === 0 ? 0 : agree / total;
}
