import { NextResponse } from "next/server";
import { getApwhPilotClasses } from "@/lib/apwhDb";

export const dynamic = "force-dynamic";

export async function GET() {
  const classes = await getApwhPilotClasses();
  return NextResponse.json({
    classes: classes.map((item) => ({ id: item.id, name: item.name })),
  });
}
