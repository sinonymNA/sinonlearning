"use client";

import { useEffect, useRef, useState } from "react";
import { Clipboard, Download, FileText, Presentation, Printer } from "lucide-react";
import ComingSoonBadge from "@/components/ComingSoonBadge";
import {
  anchoredProjectToJSON,
  anchoredProjectToMarkdown,
  anchoredProjectToPlainText,
  downloadAnchoredTextFile,
  slugifyAnchoredFilename,
} from "@/lib/anchoredNotesExport";
import type { AnchoredNotesProject } from "@/lib/anchoredNotesTypes";

interface ExportPanelProps {
  project: AnchoredNotesProject;
  onGoogleDocCreated: (url: string) => void;
}

type GoogleTarget = "anchoredNotesDoc" | "anchoredNotesSlides";

interface GoogleExportMessage {
  source?: string;
  error?: string;
  accessToken?: string;
  target?: "docs" | "slides";
}

const COMING_SOON_TARGETS = [
  { name: "Answer Key Doc", note: "Generate a separate teacher-only answer key document." },
  { name: "Teacher Guide Doc", note: "Generate pacing notes and discussion prompts alongside the handout." },
];

export default function ExportPanel({ project, onGoogleDocCreated }: ExportPanelProps) {
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [googleLoading, setGoogleLoading] = useState<GoogleTarget | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const projectRef = useRef(project);
  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  const filename = slugifyAnchoredFilename(project.title);

  const handleCopyMarkdown = async () => {
    await navigator.clipboard.writeText(anchoredProjectToMarkdown(project));
    setCopiedMd(true);
    window.setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(anchoredProjectToPlainText(project));
    setCopiedText(true);
    window.setTimeout(() => setCopiedText(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    downloadAnchoredTextFile(`${filename}.md`, anchoredProjectToMarkdown(project), "text/markdown");
  };

  const handleDownloadJSON = () => {
    downloadAnchoredTextFile(`${filename}.json`, anchoredProjectToJSON(project), "application/json");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGoogleExport = (target: GoogleTarget) => {
    setGoogleError(null);
    const oauthTarget = target === "anchoredNotesSlides" ? "slides" : "docs";
    const popup = window.open(`/api/google/auth?target=${oauthTarget}`, "sinon-google-export", "width=480,height=640");
    if (!popup) {
      setGoogleError("Please allow popups for this site to export to Google.");
      return;
    }
    setGoogleLoading(target);

    const handleMessage = async (event: MessageEvent<GoogleExportMessage>) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.source !== "sinon-google-export") return;
      window.removeEventListener("message", handleMessage);

      if (data.error || !data.accessToken) {
        setGoogleLoading(null);
        setGoogleError(data.error || "Couldn't sign in with Google.");
        return;
      }

      try {
        const res = await fetch("/api/google/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: data.accessToken, target, project: projectRef.current }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Export failed.");
        if (target === "anchoredNotesDoc") onGoogleDocCreated(json.url);
        window.open(json.url, "_blank", "noopener,noreferrer");
      } catch (err) {
        setGoogleError(err instanceof Error ? err.message : "Export failed.");
      } finally {
        setGoogleLoading(null);
      }
    };

    window.addEventListener("message", handleMessage);
  };

  return (
    <div className="glass-panel rounded-2xl p-4">
      <p className="mb-1 text-sm font-semibold text-navy-900">Export</p>
      <p className="mb-3 text-xs text-navy-700/60">
        Copy, download, and print work fully offline. Google export signs you into your own Google account just long enough to create
        the file, then forgets it — nothing is stored on our side.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <ExportButton icon={<Clipboard size={16} />} label={copiedMd ? "Copied!" : "Copy markdown"} onClick={handleCopyMarkdown} />
        <ExportButton icon={<Clipboard size={16} />} label={copiedText ? "Copied!" : "Copy plain text"} onClick={handleCopyText} />
        <ExportButton icon={<Download size={16} />} label="Download .json" onClick={handleDownloadJSON} />
        <ExportButton icon={<Download size={16} />} label="Download .md" onClick={handleDownloadMarkdown} />
        <ExportButton icon={<Printer size={16} />} label="Print / Save PDF" onClick={handlePrint} />
        <ExportButton
          icon={<FileText size={16} />}
          label={googleLoading === "anchoredNotesDoc" ? "Connecting…" : "Generate Google Doc"}
          onClick={() => handleGoogleExport("anchoredNotesDoc")}
          disabled={googleLoading !== null}
        />
        <ExportButton
          icon={<Presentation size={16} />}
          label={googleLoading === "anchoredNotesSlides" ? "Connecting…" : "Generate Slides (basic)"}
          onClick={() => handleGoogleExport("anchoredNotesSlides")}
          disabled={googleLoading !== null}
        />
      </div>

      {googleError && <p className="mt-2 text-xs font-medium text-rose-600">{googleError}</p>}

      {project.googleDocUrl && (
        <a
          href={project.googleDocUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block truncate text-xs font-medium text-teal-700 hover:underline"
        >
          Last Google Doc: {project.googleDocUrl}
        </a>
      )}

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-navy-700/50">Coming soon</p>
        <div className="grid grid-cols-2 gap-2">
          {COMING_SOON_TARGETS.map((target) => (
            <div key={target.name} className="rounded-xl border border-navy-900/8 bg-navy-900/[0.02] p-3 opacity-70">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-navy-800">{target.name}</span>
                <ComingSoonBadge />
              </div>
              <p className="text-[11px] text-navy-700/50">{target.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExportButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1.5 rounded-xl border border-navy-900/10 bg-white px-3 py-3 text-xs font-medium text-navy-800 transition hover:border-teal-400/60 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-navy-900/10 disabled:hover:bg-white"
    >
      {icon}
      {label}
    </button>
  );
}
