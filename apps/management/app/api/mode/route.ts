import { NextResponse } from "next/server";
import { operationModeSchema } from "@scms/shared";
import { getMode, setMode } from "@/lib/services/state";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ mode: getMode() }, { status: 200 });
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const parsed = operationModeSchema.safeParse(body.mode);
  if (!parsed.success) return NextResponse.json({ error: "Invalid operation mode" }, { status: 400 });
  return NextResponse.json({ mode: setMode(parsed.data) }, { status: 200 });
}
