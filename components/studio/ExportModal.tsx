"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Clipboard, Download, FileText, Presentation, Printer } from "lucide-react";
import StudioModal from "./StudioModal";
import ComingSoonBadge from "@/components/ComingSoonBadge";
import { downloadTextFile, projectToJSON, projectToMarkdown, slugifyFilename } from "@/lib/studioExport";
import { richTextToPlainText } from "@/lib/richText";
import type { PreviewAudience, TeacherStudioProject } from "@/lib/studioTypes";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  project: TeacherStudioProject;
  audience: PreviewAudience;
}

const COMING_SOON_TARGETS = [
  { name: "PowerPoint (.pptx)", note: "Download an editable PowerPoint file." },
  { name: "Word (.docx)", note: "Download an editable Word document." },
];

type GoogleExportTarget = "docs" | "slides";

interface GoogleExportMessage {
  source?: string;
  error?: string;
  accessToken?: string;
  target?: GoogleExportTarget;
}

export default function ExportModal({ open, onClose, project, audience }: ExportModalProps) {
  const [copied, setCopied] = useState(false);
  const [googleLoading, setGoogleLoading] = useState<GoogleExportTarget | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const projectRef = useRef(project);
  const includeAnswerKey = audience === "teacher";
  const includeAnswerKeyRef = useRef(includeAnswerKey);
  useEffect(() => {
    projectRef.current = project;
    includeAnswerKeyRef.current = includeAnswerKey;
  }, [project, includeAnswerKey]);
  const filename = slugifyFilename(project.title);

  const handleCopy = async () => {
    const markdown = projectToMarkdown(project, { includeAnswerKey });
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const markdown = projectToMarkdown(project, { includeAnswerKey });
    downloadTextFile(`${filename}.md`, markdown, "text/markdown");
  };

  const handleDownloadJSON = () => {
    downloadTextFile(`${filename}.json`, projectToJSON(project), "application/json");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGoogleExport = (target: GoogleExportTarget) => {
    setGoogleError(null);
    const popup = window.open(`/api/google/auth?target=${target}`, "sinon-google-export", "width=480,height=640");
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
          body: JSON.stringify({
            accessToken: data.accessToken,
            target: data.target,
            project: projectRef.current,
            includeAnswerKey: includeAnswerKeyRef.current,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Export failed.");
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
    <StudioModal open={open} onClose={onClose} title="Export your project" maxWidthClassName="max-w-lg">
      <div className="no-print space-y-5">
        <p className="text-sm text-navy-700/70">
          Copy, download, and print work fully offline — no account, no upload. Google export signs you into your
          own Google account just long enough to create the file, then forgets it. Exporting the{" "}
          <strong>{audience}</strong> view {includeAnswerKey ? "includes" : "hides"} the answer key.
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <ExportButton icon={<Clipboard size={16} />} label={copied ? "Copied!" : "Copy text"} onClick={handleCopy} />
          <ExportButton icon={<Download size={16} />} label="Download .md" onClick={handleDownloadMarkdown} />
          <ExportButton icon={<Download size={16} />} label="Download .json" onClick={handleDownloadJSON} />
          <ExportButton icon={<Printer size={16} />} label="Print / Save PDF" onClick={handlePrint} />
          <ExportButton
            icon={<FileText size={16} />}
            label={googleLoading === "docs" ? "Connecting…" : "Google Docs"}
            onClick={() => handleGoogleExport("docs")}
            disabled={googleLoading !== null}
          />
          <ExportButton
            icon={<Presentation size={16} />}
            label={googleLoading === "slides" ? "Connecting…" : "Google Slides"}
            onClick={() => handleGoogleExport("slides")}
            disabled={googleLoading !== null}
          />
        </div>

        {copied && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-teal-700">
            <Check size={13} /> Markdown copied to your clipboard.
          </p>
        )}
        {googleError && <p className="text-xs font-medium text-rose-600">{googleError}</p>}

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-navy-700/50">
            Coming soon
          </p>
          <div className="grid grid-cols-2 gap-2">
            {COMING_SOON_TARGETS.map((target) => (
              <div
                key={target.name}
                className="rounded-xl border border-navy-900/8 bg-navy-900/[0.02] p-3 opacity-70"
              >
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

      <PrintableProject project={project} includeAnswerKey={includeAnswerKey} />
    </StudioModal>
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

function PrintableProject({
  project,
  includeAnswerKey,
}: {
  project: TeacherStudioProject;
  includeAnswerKey: boolean;
}) {
  return (
    <div className="print-only text-navy-900">
      <h1 className="font-display text-2xl">{project.title}</h1>
      <p className="mb-4 text-sm text-navy-700/70">
        {[project.subject, project.gradeLevel, `${project.durationMinutes} min`]
          .filter(Boolean)
          .join(" · ")}
      </p>

      {project.slides.map((slide, i) => (
        <div key={slide.id} className="print-page-break mb-6">
          <h2 className="font-display text-xl">
            Slide {i + 1}: {slide.title}
          </h2>
          {slide.subtitle && <p className="italic text-navy-700/70">{slide.subtitle}</p>}
          {slide.body && <p className="mt-2 text-sm">{slide.body}</p>}
          {slide.bullets.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-sm">
              {slide.bullets.map((b) => (
                <li key={b.id}>{b.text}</li>
              ))}
            </ul>
          )}
          {slide.studentInstructions && (
            <p className="mt-2 text-sm font-medium">Instructions: {slide.studentInstructions}</p>
          )}
        </div>
      ))}

      {project.worksheetSections.map((section) => (
        <div key={section.id} className="print-page-break mb-6">
          <h2 className="font-display text-xl">{section.title}</h2>
          {section.directions && (
            <div
              className="text-sm text-navy-700/70"
              dangerouslySetInnerHTML={{ __html: section.directions }}
            />
          )}
          <ol className="mt-2 list-decimal pl-5 text-sm">
            {section.questions.map((q) => (
              <li key={q.id} className="mb-2">
                <span dangerouslySetInnerHTML={{ __html: q.prompt }} />
                {q.choices && q.choices.length > 0 && (
                  <ul className="mt-1 list-none pl-4">
                    {q.choices.map((choice, ci) => (
                      <li key={ci}>
                        {String.fromCharCode(65 + ci)}. {choice}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
          {includeAnswerKey && Object.keys(section.answerKey).length > 0 && (
            <div className="mt-3 rounded border border-dashed border-navy-900/20 p-2 text-xs">
              <strong>Answer key:</strong>{" "}
              {Object.entries(section.answerKey)
                .map(([qId, answer]) => {
                  const q = section.questions.find((question) => question.id === qId);
                  return `${q ? richTextToPlainText(q.prompt) : qId}: ${answer}`;
                })
                .join(" · ")}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
