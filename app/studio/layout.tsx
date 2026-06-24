import type { ReactNode } from "react";

export default function StudioLayout({ children }: { children: ReactNode }) {
  return <div className="bg-studio-canvas min-h-screen">{children}</div>;
}
