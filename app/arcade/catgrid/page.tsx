import type { Metadata } from "next";
import CatGrid from "@/components/arcade/catgrid/CatGrid";

export const metadata: Metadata = { title: "Cat Grid | Classroom Arcade" };
export default function Page() { return <CatGrid />; }
