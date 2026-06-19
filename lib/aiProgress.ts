export interface AILessonProgress {
  completed: boolean;
  activityState?: unknown;
  updatedAt: number;
}

export const defaultAILessonProgress: AILessonProgress = {
  completed: false,
  updatedAt: 0,
};

export function aiProgressKey(courseSlug: string, lessonSlug: string): string {
  return `ai:${courseSlug}:lesson:${lessonSlug}`;
}

export function readAllLessonProgress(
  courseSlug: string,
  lessonSlugs: string[]
): Record<string, AILessonProgress> {
  if (typeof window === "undefined") return {};
  const result: Record<string, AILessonProgress> = {};
  for (const slug of lessonSlugs) {
    try {
      const raw = localStorage.getItem(aiProgressKey(courseSlug, slug));
      if (raw) result[slug] = JSON.parse(raw) as AILessonProgress;
    } catch {
      // ignore malformed/inaccessible storage
    }
  }
  return result;
}
