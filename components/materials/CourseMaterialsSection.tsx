"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Lock, Plus, LogOut, Pencil } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import MaterialCard from "@/components/MaterialCard";
import type { Material } from "@/lib/material";

export default function CourseMaterialsSection({ courseSlug }: { courseSlug: string }) {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((res) => res.json())
      .then((data) => setIsAdmin(!!data.isAdmin))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    fetch(`/api/materials?course=${encodeURIComponent(courseSlug)}`)
      .then((res) => res.json())
      .then((data) => setMaterials(data.materials ?? []))
      .finally(() => setLoadingMaterials(false));
  }, [courseSlug]);

  const login = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setIsAdmin(true);
      setShowLogin(false);
      setPassword("");
    } else {
      const data = await res.json().catch(() => ({}));
      setLoginError(data.error ?? "Incorrect password");
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAdmin(false);
  };

  const addMaterial = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const res = await fetch("/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, url, course: courseSlug }),
    });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json();
      setMaterials((prev) => [...prev, data.material]);
      setTitle("");
      setUrl("");
    } else {
      const data = await res.json().catch(() => ({}));
      setFormError(data.error ?? "Something went wrong");
    }
  };

  const removeMaterial = async (id: number) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    await fetch(`/api/materials/${id}`, { method: "DELETE" });
  };

  const persistOrder = async (ordered: Material[]) => {
    await fetch("/api/materials/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course: courseSlug, orderedIds: ordered.map((m) => m.id) }),
    });
  };

  const moveMaterial = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= materials.length) return;
    const next = [...materials];
    [next[index], next[target]] = [next[target], next[index]];
    setMaterials(next);
    persistOrder(next);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-medium text-navy-900">Course Materials</h2>

        {!checking && (
          <div>
            {isAdmin ? (
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-sm text-navy-700/60 transition-colors hover:text-navy-900"
              >
                <LogOut size={14} />
                Sign out of admin
              </button>
            ) : showLogin ? (
              <form onSubmit={login} className="flex items-center gap-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin password"
                  autoFocus
                  className="rounded-lg border border-navy-900/12 bg-white px-3 py-1.5 text-sm text-navy-900 focus:border-teal-500/50 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-full bg-teal-500 px-3 py-1.5 text-xs font-medium text-navy-950 transition-colors hover:bg-teal-400"
                >
                  Sign in
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-navy-700/40 transition-colors hover:text-navy-900"
              >
                <Lock size={12} />
                Admin
              </button>
            )}
          </div>
        )}
      </div>
      {loginError && <p className="mt-2 text-right text-sm text-rose-600">{loginError}</p>}

      {isAdmin && (
        <form
          onSubmit={addMaterial}
          className="mt-6 rounded-3xl border border-navy-900/8 bg-white p-6 shadow-[0_1px_2px_rgba(13,27,46,0.04)]"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-navy-900">
            <Pencil size={15} className="text-teal-700" />
            Add a material to this course
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr]">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (e.g. Unit 3 Notes)"
              className="rounded-lg border border-navy-900/12 bg-cream-50 px-3 py-2 text-sm text-navy-900 placeholder:text-navy-700/35 focus:border-teal-500/50 focus:outline-none"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a Google Docs or Slides link..."
              className="rounded-lg border border-navy-900/12 bg-cream-50 px-3 py-2 text-sm text-navy-900 placeholder:text-navy-700/35 focus:border-teal-500/50 focus:outline-none"
            />
          </div>
          {formError && <p className="mt-3 text-sm text-rose-600">{formError}</p>}
          <button
            type="submit"
            disabled={submitting || !title.trim() || !url.trim()}
            className="mt-4 flex items-center gap-2 rounded-full bg-teal-500 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-400 disabled:opacity-40"
          >
            <Plus size={15} />
            Add material
          </button>
          <p className="mt-3 text-xs text-navy-700/50">
            Use the arrows on each card below to reorder materials for this course.
          </p>
        </form>
      )}

      <div className="mt-8">
        {loadingMaterials ? null : materials.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-navy-900/15 px-6 py-10 text-center text-sm text-navy-700/50">
            No materials posted for this course yet—check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((material, i) => (
              <FadeIn key={material.id} delay={(i % 3) * 0.06}>
                <MaterialCard
                  material={material}
                  admin={
                    isAdmin
                      ? {
                          onMoveUp: () => moveMaterial(i, -1),
                          onMoveDown: () => moveMaterial(i, 1),
                          onDelete: () => removeMaterial(material.id),
                          disableUp: i === 0,
                          disableDown: i === materials.length - 1,
                        }
                      : undefined
                  }
                />
              </FadeIn>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
