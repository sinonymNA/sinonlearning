import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getDecksByTeacher } from "@/lib/sliderDb";
import SliderHeader from "@/components/slider/SliderHeader";
import DeckHub from "@/components/slider/DeckHub";

export default async function SliderHubPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login?next=/slider");
  if (user.role !== "teacher") redirect("/margins/student");

  const decks = await getDecksByTeacher(user.id);

  return (
    <div className="min-h-screen bg-stone-50">
      <SliderHeader name={user.name} />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <DeckHub decks={decks} />
      </main>
    </div>
  );
}
