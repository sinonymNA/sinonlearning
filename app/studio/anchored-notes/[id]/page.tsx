import AnchoredNotesWorkspace from "@/components/anchoredNotes/AnchoredNotesWorkspace";

export default async function AnchoredNotesProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AnchoredNotesWorkspace key={id} projectId={id} />;
}
