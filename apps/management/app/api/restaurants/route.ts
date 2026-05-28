import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const vipStatusEnum = z.enum(["half_time", "one_full", "two_full"]);

const restaurantCreateSchema = z.object({
  name: z.string().min(2),
  code: z.string().optional().default(""),
  city: z.string().min(2),
  street: z.string().min(1),
  streetNumber: z.string().min(1),
  specialDirections: z.string().optional().default(""),
  zone: z.string().optional().default(""),
  vipStatus: vipStatusEnum.default("one_full")
});

interface RestaurantRow {
  id: string;
  name: string;
  address: string | null;
  city: string;
  code: string | null;
  street: string | null;
  street_number: string | null;
  special_directions: string | null;
  zone: string | null;
  vip_status: string | null;
  is_active: boolean;
}

function mapRestaurant(row: RestaurantRow) {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    code: row.code ?? "",
    street: row.street ?? "",
    streetNumber: row.street_number ?? "",
    specialDirections: row.special_directions ?? "",
    zone: row.zone ?? "",
    vipStatus: (row.vip_status as "half_time" | "one_full" | "two_full") ?? "one_full",
    address: row.address ?? `${row.street ?? ""} ${row.street_number ?? ""}, ${row.city}`.trim()
  };
}

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (error) {
      return NextResponse.json({ restaurants: [], error: error.message }, { status: 500 });
    }
    return NextResponse.json({ restaurants: (data ?? []).map((row) => mapRestaurant(row as RestaurantRow)) }, { status: 200 });
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
    const { name, code, city, street, streetNumber, specialDirections, zone, vipStatus } = payload.data;
    const address = `${street} ${streetNumber}, ${city}`.trim();

    const fullInsert = {
      name,
      address,
      city,
      code,
      street,
      street_number: streetNumber,
      special_directions: specialDirections,
      zone,
      vip_status: vipStatus,
      priority: 2,
      ov_cap_percent: 30,
      eligible_tracks: ["A1", "A2", "B"]
    };

    let result = await supabase.from("restaurants").insert(fullInsert).select("*").single();

    // Resilient fallback if the new columns haven't been migrated yet.
    if (result.error && /column .* does not exist/i.test(result.error.message)) {
      result = await supabase
        .from("restaurants")
        .insert({ name, address, city, priority: 2, ov_cap_percent: 30, eligible_tracks: ["A1", "A2", "B"] })
        .select("*")
        .single();
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
    return NextResponse.json({ restaurant: mapRestaurant(result.data as RestaurantRow) }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
