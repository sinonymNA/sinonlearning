import { newId } from "./studioDefaults";
import type { StudioIndexEntry, TeacherStudioProject } from "./studioTypes";

const INDEX_KEY = "studio:index";

function projectKey(id: string): string {
  return `studio:project:${id}`;
}

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota/storage errors
  }
}

function readIndex(): StudioIndexEntry[] {
  return readJSON<StudioIndexEntry[]>(INDEX_KEY, []);
}

function writeIndex(entries: StudioIndexEntry[]): void {
  writeJSON(INDEX_KEY, entries);
}

export function listProjects(): StudioIndexEntry[] {
  return readIndex().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function loadProject(id: string): TeacherStudioProject | null {
  return readJSON<TeacherStudioProject | null>(projectKey(id), null);
}

export function saveProject(project: TeacherStudioProject): void {
  writeJSON(projectKey(project.id), project);
  const index = readIndex();
  const next = index.filter((entry) => entry.id !== project.id);
  next.push({
    id: project.id,
    title: project.title,
    type: project.type,
    updatedAt: project.updatedAt,
  });
  writeIndex(next);
}

export function deleteProject(id: string): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(projectKey(id));
    } catch {
      // ignore
    }
  }
  writeIndex(readIndex().filter((entry) => entry.id !== id));
}

export function duplicateProject(id: string): TeacherStudioProject | null {
  const source = loadProject(id);
  if (!source) return null;
  const now = Date.now();
  const copy: TeacherStudioProject = {
    ...source,
    id: newId(),
    title: `Copy of ${source.title}`,
    createdAt: now,
    updatedAt: now,
  };
  saveProject(copy);
  return copy;
}
