"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, X, Check } from "lucide-react";

const DISMISSED_KEY = "sinon-email-signup-dismissed";
const SHOW_DELAY_MS = 3500;

export default function EmailSignupBar() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("submitting");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "site_popup" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
      localStorage.setItem(DISMISSED_KEY, "1");
      setTimeout(() => setVisible(false), 2600);
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 96, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:px-6"
        >
          <div className="mx-auto flex max-w-3xl items-start gap-3 rounded-2xl border border-navy-900/8 bg-white/95 p-4 shadow-[0_20px_50px_-15px_rgba(13,27,46,0.25)] backdrop-blur-md sm:items-center sm:gap-5 sm:p-5">
            <div className="flex flex-1 flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-5">
              {status === "success" ? (
                <div className="flex flex-1 items-center gap-3 py-1">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                    <Check size={17} />
                  </span>
                  <p className="text-sm font-medium text-navy-900">
                    You&rsquo;re in! We&rsquo;ll keep you posted on new free tools and updates.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3 sm:w-64 sm:shrink-0 sm:items-center">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                      <Mail size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy-900">Stay in the loop</p>
                      <p className="text-xs leading-relaxed text-navy-700/70">
                        New free tools, curriculum, and updates from Sinon Learning. No spam, unsubscribe anytime.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                    <label htmlFor="email-signup-input" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="email-signup-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@school.edu"
                      className="w-full rounded-xl border border-navy-900/15 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none placeholder:text-navy-700/40 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 sm:flex-1"
                    />
                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      className="shrink-0 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
                    >
                      {status === "submitting" ? "Joining…" : "Join the list"}
                    </button>
                  </form>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-navy-700/40 transition-colors hover:bg-navy-900/5 hover:text-navy-700"
            >
              <X size={15} />
            </button>
          </div>
          {error && (
            <p className="mx-auto mt-2 max-w-3xl text-center text-xs font-medium text-red-600">{error}</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
