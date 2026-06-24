"use client";

import { useRouter } from "next/navigation";
import { Copy, Trash2 } from "lucide-react";
import { deleteProject } from "@/lib/studioStorage";

interface ProjectSaveControlsProps {
  projectId: string;
  onDuplicate: () => void;
}

export default function ProjectSaveControls({ projectId, onDuplicate }: ProjectSaveControlsProps) {
  const router = useRouter();

  const handleDelete = () => {
    if (typeof window !== "undefined" && !window.confirm("Delete this project? This can't be undone.")) {
      return;
    }
    deleteProject(projectId);
    router.push("/studio");
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onDuplicate}
        aria-label="Duplicate project"
        className="flex h-8 w-8 items-center justify-center rounded-full text-navy-700/50 transition hover:bg-navy-900/5 hover:text-navy-900"
      >
        <Copy size={14} />
      </button>
      <button
        type="button"
        onClick={handleDelete}
        aria-label="Delete project"
        className="flex h-8 w-8 items-center justify-center rounded-full text-navy-700/50 transition hover:bg-rose-50 hover:text-rose-600"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
