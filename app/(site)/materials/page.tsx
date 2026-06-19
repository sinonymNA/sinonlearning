import { ArrowLeft } from "lucide-react";
import Button from "@/components/Button";
import FadeIn from "@/components/FadeIn";
import MaterialCard from "@/components/MaterialCard";
import { ensureSchema, query } from "@/lib/db";
import type { Material } from "@/lib/material";

export const dynamic = "force-dynamic";

async function getMaterials(): Promise<Material[]> {
  await ensureSchema();
  const { rows } = await query<Material>(
    "SELECT id, title, url, kind, file_id, created_at FROM materials ORDER BY created_at DESC"
  );
  return rows;
}

export default async function MaterialsPage() {
  const materials = await getMaterials();

  return (
    <>
      <section className="bg-grain relative overflow-hidden px-6 pt-16 pb-12 lg:px-8 lg:pt-24">
        <div className="absolute -right-20 top-10 -z-10 h-72 w-72 rounded-full bg-rose-400/15 blur-[110px]" />
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="font-display text-4xl font-medium leading-tight text-navy-900 sm:text-5xl">
            Course Materials
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-navy-700/80">
            Free Google Docs and Slides, ready to use in your classroom today.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {materials.length === 0 ? (
            <p className="text-center text-navy-700/60">
              No materials posted yet—check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {materials.map((material, i) => (
                <FadeIn key={material.id} delay={(i % 3) * 0.08}>
                  <MaterialCard material={material} />
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Button href="/">
            <ArrowLeft
              size={16}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            Back to Home
          </Button>
        </div>
      </section>
    </>
  );
}
