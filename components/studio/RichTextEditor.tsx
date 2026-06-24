"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, List, ListOrdered, Underline } from "lucide-react";
import { sanitizeRichTextHtml } from "@/lib/richText";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeightClassName?: string;
}

const TOOLBAR_BUTTONS: { command: string; label: string; Icon: typeof Bold }[] = [
  { command: "bold", label: "Bold", Icon: Bold },
  { command: "italic", label: "Italic", Icon: Italic },
  { command: "underline", label: "Underline", Icon: Underline },
  { command: "insertUnorderedList", label: "Bulleted list", Icon: List },
  { command: "insertOrderedList", label: "Numbered list", Icon: ListOrdered },
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  className = "",
  minHeightClassName = "min-h-[2.5rem]",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef(value);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (value !== lastEmitted.current) {
      el.innerHTML = value;
      lastEmitted.current = value;
    }
  }, [value]);

  const emitChange = () => {
    const el = editorRef.current;
    if (!el) return;
    const sanitized = sanitizeRichTextHtml(el.innerHTML);
    lastEmitted.current = sanitized;
    onChange(sanitized);
  };

  const runCommand = (command: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false);
    emitChange();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  return (
    <div className={className}>
      <div className="mb-1 flex items-center gap-1">
        {TOOLBAR_BUTTONS.map(({ command, label, Icon }) => (
          <button
            key={command}
            type="button"
            aria-label={label}
            title={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand(command)}
            className="flex h-6 w-6 items-center justify-center rounded text-navy-700/50 hover:bg-navy-900/[0.06] hover:text-teal-700"
          >
            <Icon size={13} />
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={emitChange}
        onBlur={emitChange}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        suppressContentEditableWarning
        className={`empty:before:pointer-events-none empty:before:text-navy-700/30 empty:before:content-[attr(data-placeholder)] focus-visible:outline-none ${minHeightClassName}`}
      />
    </div>
  );
}
