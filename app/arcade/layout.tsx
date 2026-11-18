import type { Metadata } from "next";
import "./fonts.css";
import "./arcade.css";

export const metadata: Metadata = {
  title: "Classroom Arcade | Sinon Learning",
  description: "Five original multiplayer party games for the whole class: Hot Potato, Quick Draw, Last One Standing, Telephone and Imposter.",
};

export default function ArcadeLayout({ children }: { children: React.ReactNode }) {
  return <div className="arcade-root">{children}</div>;
}
