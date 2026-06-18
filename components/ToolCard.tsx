import Card from "./Card";
import Badge from "./Badge";
import type { Tool } from "@/data/tools";

export default function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <Icon size={20} strokeWidth={2} />
        </span>
        <Badge>{tool.status}</Badge>
      </div>
      <h3 className="mt-4 font-display text-lg font-medium text-navy-900">{tool.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-navy-700/80">{tool.description}</p>
    </Card>
  );
}
