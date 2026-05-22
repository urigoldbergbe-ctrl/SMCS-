import { NextResponse } from "next/server";
import { listConfigHistory, rollbackConfig } from "@/lib/services/state";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") ?? undefined;
  return NextResponse.json({ history: listConfigHistory(city) }, { status: 200 });
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const snapshotId = body.snapshotId as string | undefined;
  if (!snapshotId) return NextResponse.json({ error: "snapshotId is required" }, { status: 400 });
  const changedBy = body.changedBy ?? "admin";
  const rollback = rollbackConfig(snapshotId, changedBy);
  if (!rollback) return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  return NextResponse.json({ rollback }, { status: 200 });
}
