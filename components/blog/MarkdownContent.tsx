import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  h1: ({ children }) => (
    <h2 className="mt-10 font-display text-2xl font-medium text-navy-900">{children}</h2>
  ),
  h2: ({ children }) => (
    <h2 className="mt-10 font-display text-2xl font-medium text-navy-900">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 font-display text-lg font-medium text-navy-900">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mt-4 leading-relaxed text-navy-700/85">{children}</p>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-teal-700 underline underline-offset-2 transition-colors hover:text-teal-600"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="mt-4 list-disc space-y-2 pl-6 text-navy-700/85">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-4 list-decimal space-y-2 pl-6 text-navy-700/85">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-navy-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="mt-4 border-l-2 border-teal-500/40 pl-4 text-navy-700/70 italic">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-navy-900/[0.06] px-1.5 py-0.5 font-mono text-[0.85em] text-navy-900">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mt-4 overflow-x-auto rounded-xl bg-navy-900/[0.06] p-4 font-mono text-[0.85em] text-navy-900">
      {children}
    </pre>
  ),
  hr: () => <hr className="mt-8 border-navy-900/10" />,
};

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="text-base">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
