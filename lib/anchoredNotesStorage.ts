import { newId } from "./studioDefaults";
import type { AnchoredNotesIndexEntry, AnchoredNotesProject } from "./anchoredNotesTypes";

/**
 * Separate localStorage key scheme from studioStorage.ts — Anchored Notes projects
 * are a distinct content model (paste-and-structure, not slides/worksheet authoring)
 * and intentionally don't share an index with the existing Studio project list.
 */
const INDEX_KEY = "anchoredNotes:index";

function projectKey(id: string): string {
  return `anchoredNotes:project:${id}`;
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

function readIndex(): AnchoredNotesIndexEntry[] {
  return readJSON<AnchoredNotesIndexEntry[]>(INDEX_KEY, []);
}

function writeIndex(entries: AnchoredNotesIndexEntry[]): void {
  writeJSON(INDEX_KEY, entries);
}

export function listAnchoredProjects(): AnchoredNotesIndexEntry[] {
  return readIndex().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function loadAnchoredProject(id: string): AnchoredNotesProject | null {
  return readJSON<AnchoredNotesProject | null>(projectKey(id), null);
}

export function saveAnchoredProject(project: AnchoredNotesProject): void {
  writeJSON(projectKey(project.id), project);
  const index = readIndex().filter((entry) => entry.id !== project.id);
  index.push({ id: project.id, title: project.title, updatedAt: project.updatedAt });
  writeIndex(index);
}

export function deleteAnchoredProject(id: string): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(projectKey(id));
    } catch {
      // ignore
    }
  }
  writeIndex(readIndex().filter((entry) => entry.id !== id));
}

export function duplicateAnchoredProject(id: string): AnchoredNotesProject | null {
  const source = loadAnchoredProject(id);
  if (!source) return null;
  const now = Date.now();
  const copy: AnchoredNotesProject = {
    ...source,
    id: newId(),
    title: `Copy of ${source.title}`,
    createdAt: now,
    updatedAt: now,
  };
  saveAnchoredProject(copy);
  return copy;
}
