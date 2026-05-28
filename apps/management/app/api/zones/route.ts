import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const zoneSchema = z.object({
  id: z.string().min(2),
  name: z.string().min(2),
  city: z.string().min(2),
  maxPtodMinutes: z.number().positive(),
  maxPulledOrders: z.number().int().positive()
});

const payloadSchema = z.object({
  zones: z.array(zoneSchema)
});

const key = "dispatch_zones";

const fallback = {
  zones: [
    { id: "bs_center", name: "מרכז באר שבע", city: "beer_sheva", maxPtodMinutes: 55, maxPulledOrders: 2 },
    { id: "ashdod_north", name: "אשדוד צפון", city: "ashdod", maxPtodMinutes: 60, maxPulledOrders: 2 }
  ]
};

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
    if (error || !data) {
      return NextResponse.json(fallback, { status: 200 });
    }
    return NextResponse.json(data.value ?? fallback, { status: 200 });
  } catch {
    return NextResponse.json(fallback, { status: 200 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = payloadSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json({ error: "Invalid zones payload", issues: payload.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("app_settings").upsert(
      {
        key,
        value: payload.data,
        updated_at: new Date().toISOString()
      },
      { onConflict: "key" }
    );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
