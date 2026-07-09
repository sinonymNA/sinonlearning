import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/marginsAuth";
import SliderHeader from "@/components/slider/SliderHeader";
import SliderBuildTabs from "@/components/slider/SliderBuildTabs";

export default async function SliderBuildPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login?next=/slider/build");
  if (user.role !== "teacher") redirect("/margins/student");

  return (
    <div className="min-h-screen bg-stone-50">
      <SliderHeader name={user.name} role={user.role} />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <Link href="/slider" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
          ← All decks
        </Link>
        <h1 className="mt-3 mb-1 text-xl font-bold text-stone-900">Build with KORA</h1>
        <SliderBuildTabs />
      </main>
    </div>
  );
}
