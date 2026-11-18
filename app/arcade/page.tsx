import ArcadeHome from "@/components/arcade/ArcadeHome";
import { getArcadeUser } from "@/lib/arcadeAuth";
// @ts-ignore - plain ESM
import { isDeveloper } from "../../arcade-server/api.mjs";

export const dynamic = "force-dynamic";

export default async function ArcadePage() {
  const user = await getArcadeUser();
  return <ArcadeHome teacher={user?.role === "teacher"} dev={!!isDeveloper(user)} />;
}
