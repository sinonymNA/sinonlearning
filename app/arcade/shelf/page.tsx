import type { Metadata } from "next";
import ShelfStocker from "@/components/arcade/shelf/ShelfStocker";

export const metadata: Metadata = { title: "Shelf Stocker | Classroom Arcade" };
export default function Page() { return <ShelfStocker />; }
