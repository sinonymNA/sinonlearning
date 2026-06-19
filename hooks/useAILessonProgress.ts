"use client";

import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { aiProgressKey, defaultAILessonProgress, type AILessonProgress } from "@/lib/aiProgress";

export function useAILessonProgress(courseSlug: string, lessonSlug: string) {
  const [progress, setProgress] = useLocalStorageState<AILessonProgress>(
    aiProgressKey(courseSlug, lessonSlug),
    defaultAILessonProgress
  );

  const markComplete = (completed: boolean) =>
    setProgress((prev) => ({ ...prev, completed, updatedAt: Date.now() }));

  const saveActivityState = (activityState: unknown) =>
    setProgress((prev) => ({ ...prev, activityState, updatedAt: Date.now() }));

  return { progress, markComplete, saveActivityState };
}
