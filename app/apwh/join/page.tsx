import ApwhAuthForm from "@/components/apwh/ApwhAuthForm";
import { getApwhPilotClasses } from "@/lib/apwhDb";

export const dynamic = "force-dynamic";

export default async function ApwhJoinPage() {
  const classes = await getApwhPilotClasses();
  return <ApwhAuthForm mode="join" classes={classes.map(({ id, name }) => ({ id, name }))} />;
}
