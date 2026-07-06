import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getDeckById } from "@/lib/sliderDb";
import SliderHeader from "@/components/slider/SliderHeader";
import SlideEditor from "@/components/slider/SlideEditor";

export default async function SliderDeckPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login?next=/slider");
  if (user.role !== "teacher") redirect("/margins/student");

  const { deckId } = await params;
  const deck = await getDeckById(deckId);
  if (!deck) notFound();
  if (deck.teacher_id !== user.id) notFound();

  return (
    <div className="min-h-screen bg-stone-50">
      <SliderHeader name={user.name} />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Link href="/slider" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
          ← All decks
        </Link>
        <div className="mt-4">
          <SlideEditor deck={deck} />
        </div>
      </main>
    </div>
  );
}
