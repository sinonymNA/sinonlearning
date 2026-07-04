import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getClassesByTeacher } from "@/lib/marginsDb";
import MarginsHeader from "@/components/margins/MarginsHeader";
import NewClassButton from "@/components/margins/NewClassButton";

export default async function TeacherDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login");
  if (user.role !== "teacher") redirect("/margins/student");

  const classes = await getClassesByTeacher(user.id);

  return (
    <div className="min-h-screen bg-stone-50">
      <MarginsHeader name={user.name} role="teacher" homeHref="/margins/teacher" />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-stone-900">Your classes</h1>
            <p className="text-sm text-stone-400 mt-0.5">Create a class, share the code, and build assignments.</p>
          </div>
          <NewClassButton />
        </div>

        {classes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-12 text-center">
            <p className="text-stone-400 text-sm">No classes yet. Create your first class to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {classes.map((cls) => (
              <Link
                key={cls.id}
                href={`/margins/teacher/classes/${cls.id}`}
                className="group rounded-2xl border border-stone-100 bg-white p-5 hover:border-violet-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-stone-900">{cls.name}</h3>
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-stone-400">
                      <Users size={12} />
                      Join code: <span className="font-mono font-semibold text-violet-600">{cls.join_code}</span>
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-stone-300 group-hover:text-violet-500 transition-colors mt-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
