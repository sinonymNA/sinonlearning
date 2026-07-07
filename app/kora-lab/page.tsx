import { isAdminRequest } from "@/lib/adminAuth";
import KoraLabLoginGate from "@/components/koraLab/KoraLabLoginGate";
import KoraLabApp from "@/components/koraLab/KoraLabApp";

export const dynamic = "force-dynamic";

export default async function KoraLabPage() {
  if (!(await isAdminRequest())) {
    return <KoraLabLoginGate />;
  }
  return (
    <div className="min-h-screen bg-cream-50">
      <KoraLabApp />
    </div>
  );
}
