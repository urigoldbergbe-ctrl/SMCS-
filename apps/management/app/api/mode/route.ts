import { NextResponse } from "next/server";
import { operationModeSchema } from "@scms/shared";
import { getMode, setMode } from "@/lib/services/state";

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json({ mode: await getMode() }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ mode: "integrated", warning: `Fallback mode used: ${String(error)}` }, { status: 200 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = operationModeSchema.safeParse(body.mode);
    if (!parsed.success) return NextResponse.json({ error: "Invalid operation mode" }, { status: 400 });
    return NextResponse.json({ mode: await setMode(parsed.data) }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save mode", detail: String(error) }, { status: 500 });
  }
}
