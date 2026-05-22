import { NextResponse } from "next/server";
import { dispatchConfigSchema } from "@scms/shared";
import { getConfig, listConfigs, saveConfig } from "@/lib/services/state";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  if (city) return NextResponse.json({ config: getConfig(city) }, { status: 200 });
  return NextResponse.json({ configs: listConfigs() }, { status: 200 });
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const parsed = dispatchConfigSchema.safeParse(body.config);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid config", issues: parsed.error.flatten() }, { status: 400 });
  }

  const city = body.city ?? parsed.data.city;
  const changedBy = body.changedBy ?? "admin";
  const changeNote = body.changeNote ?? "Updated via API";
  const saved = saveConfig(city, { ...parsed.data, city }, changedBy, changeNote);
  return NextResponse.json({ config: saved }, { status: 200 });
}
