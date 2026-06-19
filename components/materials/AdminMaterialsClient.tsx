"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Lock, Plus, Trash2, LogOut, FileText, Presentation } from "lucide-react";
import type { Material } from "@/lib/material";

export default function AdminMaterialsClient() {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [materials, setMaterials] = useState<Material[]>([]);
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
    if (!isAdmin) return;
    fetch("/api/materials")
      .then((res) => res.json())
      .then((data) => setMaterials(data.materials ?? []));
  }, [isAdmin]);

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
      body: JSON.stringify({ title, url }),
    });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json();
      setMaterials((prev) => [data.material, ...prev]);
      setTitle("");
      setUrl("");
    } else {
      const data = await res.json().catch(() => ({}));
      setFormError(data.error ?? "Something went wrong");
    }
  };

  const removeMaterial = async (id: number) => {
    await fetch(`/api/materials/${id}`, { method: "DELETE" });
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  if (checking) return null;

  if (!isAdmin) {
    return (
      <form
        onSubmit={login}
        className="mx-auto w-full max-w-sm rounded-3xl border border-navy-900/8 bg-white p-8 text-center shadow-[0_1px_2px_rgba(13,27,46,0.04)]"
      >
        <Lock className="mx-auto text-teal-700" size={28} />
        <h1 className="mt-4 font-display text-xl font-medium text-navy-900">Admin sign-in</h1>
        <p className="mt-2 text-sm text-navy-700/70">
          Enter the admin password to manage course materials.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="mt-5 w-full rounded-lg border border-navy-900/12 bg-cream-50 px-3 py-2 text-center text-sm text-navy-900 focus:border-teal-500/50 focus:outline-none"
        />
        {loginError && <p className="mt-2 text-sm text-rose-600">{loginError}</p>}
        <button
          type="submit"
          className="mt-5 w-full rounded-full bg-teal-500 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-400"
        >
          Sign in
        </button>
      </form>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium text-navy-900">Manage Course Materials</h1>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-navy-700/60 transition-colors hover:text-navy-900"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>

      <form
        onSubmit={addMaterial}
        className="mt-6 rounded-3xl border border-navy-900/8 bg-white p-6 shadow-[0_1px_2px_rgba(13,27,46,0.04)]"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr]">
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
      </form>

      <ul className="mt-6 space-y-2">
        {materials.map((material) => {
          const Icon = material.kind === "slides" ? Presentation : FileText;
          return (
            <li
              key={material.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-navy-900/8 bg-white px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Icon size={16} className="shrink-0 text-teal-700" />
                <span className="truncate text-sm font-medium text-navy-900">{material.title}</span>
              </div>
              <button
                onClick={() => removeMaterial(material.id)}
                aria-label={`Remove ${material.title}`}
                className="shrink-0 text-navy-700/40 transition-colors hover:text-rose-600"
              >
                <Trash2 size={15} />
              </button>
            </li>
          );
        })}
        {materials.length === 0 && (
          <li className="rounded-xl border border-dashed border-navy-900/15 px-4 py-6 text-center text-sm text-navy-700/50">
            No materials yet. Add your first one above.
          </li>
        )}
      </ul>
    </div>
  );
}
