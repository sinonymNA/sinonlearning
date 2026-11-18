import ProjectorClient from "@/components/arcade/ProjectorClient";

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <ProjectorClient code={code} />;
}
