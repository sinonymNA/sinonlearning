import StudioWorkspace from "@/components/studio/StudioWorkspace";

export default async function StudioProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <StudioWorkspace key={projectId} projectId={projectId} />;
}
