import ApwhAuthForm from "@/components/apwh/ApwhAuthForm";

export default async function ApwhLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  return <ApwhAuthForm mode="login" initialRole={role === "teacher" ? "teacher" : "student"} />;
}
