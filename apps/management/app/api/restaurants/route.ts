import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const restaurantCreateSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  city: z.string().min(2),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
  ovCapPercent: z.number().int().min(10).max(40).default(30),
  eligibleTracks: z.array(z.string().min(1)).default(["A1", "A2", "B"])
});

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("restaurants")
      .select("id, name, address, city, priority, ov_cap_percent, eligible_tracks, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (error) {
      return NextResponse.json({ restaurants: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        restaurants: (data ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          address: row.address,
          city: row.city,
          priority: row.priority,
          ovCapPercent: row.ov_cap_percent,
          eligibleTracks: row.eligible_tracks ?? [],
          isActive: row.is_active
        }))
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ restaurants: [], error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = restaurantCreateSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json({ error: "Invalid restaurant payload", issues: payload.error.flatten() }, { status: 400 });
    }
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("restaurants")
      .insert({
        name: payload.data.name,
        address: payload.data.address,
        city: payload.data.city,
        priority: payload.data.priority,
        ov_cap_percent: payload.data.ovCapPercent,
        eligible_tracks: payload.data.eligibleTracks
      })
      .select("id, name, address, city, priority, ov_cap_percent, eligible_tracks, is_active")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      {
        restaurant: {
          id: data.id,
          name: data.name,
          address: data.address,
          city: data.city,
          priority: data.priority,
          ovCapPercent: data.ov_cap_percent,
          eligibleTracks: data.eligible_tracks ?? [],
          isActive: data.is_active
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
