import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const key = "courier_assignments";

const fallback = {
  restaurants: {
    "Campus Grill": ["דניאל לוי"],
    "Burger Hub": ["מוחמד חטיב"],
    "Pizza Station": ["סרגיי פטרוב"]
  },
  vip: {
    "חברת אינטל": ["דניאל לוי", "מוחמד חטיב"],
    "Global Tech HQ": ["רון כהן"],
    "משרד עורכי דין לוין": ["סרגיי פטרוב"]
  }
};

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
    if (error || !data) {
      return NextResponse.json({ assignments: fallback });
    }
    return NextResponse.json({ assignments: data.value ?? fallback });
  } catch {
    return NextResponse.json({ assignments: fallback });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { assignments?: unknown };
    const supabase = getSupabaseAdminClient();
    const { data: existingData } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
    const existing =
      typeof existingData?.value === "object" && existingData.value
        ? (existingData.value as Record<string, unknown>)
        : fallback;
    const incoming =
      typeof body.assignments === "object" && body.assignments ? (body.assignments as Record<string, unknown>) : {};
    const assignments = { ...existing, ...incoming };
    const { error } = await supabase.from("app_settings").upsert(
      {
        key,
        value: assignments,
        updated_at: new Date().toISOString()
      },
      { onConflict: "key" }
    );
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to save assignments" },
      { status: 400 }
    );
  }
}
