import type { Metadata } from "next";
import BackIssues from "@/components/arcade/issues/BackIssues";

export const metadata: Metadata = { title: "Back Issues | Classroom Arcade" };
export default function Page() { return <BackIssues />; }
