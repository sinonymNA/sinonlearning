export type KoraTaskType =
  | "anchor"
  | "graph"
  | "evaluate"
  | "diagnosis"
  | "evidence_events"
  | "misconception_sim"
  | "next_probe"
  | "notes_generation"
  | "game_response_eval";

export type KoraEvidenceLevel = "Not Yet Shown" | "Emerging" | "Solid" | "Strong";

export interface KoraNotesSection {
  heading: string;
  type:
    | "anchor"
    | "prerequisite_check"
    | "core_idea"
    | "example_analysis"
    | "misconception_alert"
    | "transfer_challenge";
  content: string;
  understanding_focus: string;
}

export interface KoraVocabEntry {
  term: string;
  definition: string;
  example: string;
}

export interface KoraSelfCheckQuestion {
  question: string;
  target_dimension: "accuracy" | "causality" | "application" | "transfer" | "model_quality";
  what_strong_answer_includes: string;
}

export interface KoraNotesOutput {
  concept: string;
  title: string;
  learning_objective: string;
  essential_question: string;
  sections: KoraNotesSection[];
  key_vocabulary: KoraVocabEntry[];
  common_pitfalls: string[];
  self_check_questions: KoraSelfCheckQuestion[];
}

export interface KoraGameEvalOutput {
  concept: string;
  probe: string;
  student_response: string;
  points: number;
  understanding_level: KoraEvidenceLevel;
  misconception_detected: boolean;
  misconception_label: string | null;
  feedback: string;
  advance: boolean;
}

export interface KoraEvidenceEvent {
  type: string;
  prompt: string;
  target_dimension: string;
  difficulty: string;
  success_criteria: string[];
  misconceptions_tested: string[];
}

export interface KoraEvidenceEventsOutput {
  events: KoraEvidenceEvent[];
}
