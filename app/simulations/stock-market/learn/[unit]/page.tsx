import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getAllUnitProgress } from "@/lib/stockCourseDb";
import { isValidStockSlug, STOCK_UNIT_SLUGS } from "@/data/stockCourseMeta";
import StockLessonViewer from "@/components/stock-market/StockLessonViewer";

interface PageProps {
  params: Promise<{ unit: string }>;
}

export default async function StockUnitPage({ params }: PageProps) {
  const { unit: slug } = await params;
  if (!isValidStockSlug(slug)) notFound();

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/margins/login?next=/simulations/stock-market/learn/${slug}`);
  }

  const progress = await getAllUnitProgress(user.id);
  const isDone = progress.some((p) => p.unit_slug === slug && p.completed_at !== null);

  return <StockLessonViewer slug={slug} initiallyDone={isDone} />;
}

export async function generateStaticParams() {
  return STOCK_UNIT_SLUGS.map((slug) => ({ unit: slug }));
}
