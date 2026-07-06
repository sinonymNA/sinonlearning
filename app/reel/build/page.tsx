import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/marginsAuth";
import ReelBuildWizard from "@/components/reel/ReelBuildWizard";

export default async function ReelBuildPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login?next=/reel/build");
  if (user.role !== "teacher") redirect("/margins/student");
  return <ReelBuildWizard />;
}
