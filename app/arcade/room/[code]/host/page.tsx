import HostDashboard from "@/components/arcade/HostDashboard";

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <HostDashboard code={code} />;
}
