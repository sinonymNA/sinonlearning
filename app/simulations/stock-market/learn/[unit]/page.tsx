import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getAllUnitProgress } from "@/lib/stockCourseDb";
import { getStockUnit } from "@/data/stockCourse";
import StockLessonViewer from "@/components/stock-market/StockLessonViewer";

interface PageProps {
  params: Promise<{ unit: string }>;
}

export default async function StockUnitPage({ params }: PageProps) {
  const { unit: slug } = await params;
  const unitData = getStockUnit(slug);
  if (!unitData) notFound();

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/margins/login?next=/simulations/stock-market/learn/${slug}`);
  }

  const progress = await getAllUnitProgress(user.id);
  const isDone = progress.some((p) => p.unit_slug === slug && p.completed_at !== null);

  return <StockLessonViewer unit={unitData} initiallyDone={isDone} />;
}

export async function generateStaticParams() {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({ unit: `unit-${n}` }));
}
