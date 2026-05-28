import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const courierCreateSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  city: z.string().min(2),
  vehicleType: z.enum(["scooter", "bike", "car"]).default("scooter"),
  preferredLanguage: z.enum(["he", "en", "ru", "ar"]).default("he")
});

interface CourierRow {
  id: string;
  name: string;
  phone: string;
  city: string;
  status: "online" | "offline" | "on_run";
  assigned_restaurant_ids: string[] | null;
}

interface TripAggRow {
  courier_id: string;
}

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data: couriers, error } = await supabase
      .from("couriers")
      .select("id, name, phone, city, status, assigned_restaurant_ids")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) {
      return NextResponse.json({ couriers: [], error: error.message }, { status: 500 });
    }

    const courierRows = (couriers ?? []) as CourierRow[];
    const ids = courierRows.map((row) => row.id);
    const [deliveriesRes, notReceivedRes, highPtodRes] = await Promise.all([
      ids.length
        ? supabase.from("trips").select("courier_id").in("courier_id", ids).not("delivery_time", "is", null)
        : Promise.resolve({ data: [], error: null }),
      ids.length
        ? supabase
            .from("trips")
            .select("courier_id")
            .in("courier_id", ids)
            .eq("cancellation_flag", true)
            .ilike("cancellation_reason", "%didn't receive%")
        : Promise.resolve({ data: [], error: null }),
      ids.length
        ? supabase
            .from("trips")
            .select("courier_id")
            .in("courier_id", ids)
            .gt("ptod_minutes", 60)
            .not("delivery_time", "is", null)
        : Promise.resolve({ data: [], error: null })
    ]);

    if (deliveriesRes.error || notReceivedRes.error || highPtodRes.error) {
      return NextResponse.json(
        { couriers: [], error: deliveriesRes.error?.message ?? notReceivedRes.error?.message ?? highPtodRes.error?.message },
        { status: 500 }
      );
    }

    const countByCourier = (rows: TripAggRow[] | null) => {
      const counter = new Map<string, number>();
      for (const row of rows ?? []) {
        counter.set(row.courier_id, (counter.get(row.courier_id) ?? 0) + 1);
      }
      return counter;
    };

    const deliveries = countByCourier(deliveriesRes.data as TripAggRow[] | null);
    const notReceived = countByCourier(notReceivedRes.data as TripAggRow[] | null);
    const highPtod = countByCourier(highPtodRes.data as TripAggRow[] | null);

    return NextResponse.json(
      {
        couriers: courierRows.map((row) => ({
          id: row.id,
          name: row.name,
          phone: row.phone,
          city: row.city,
          status: row.status,
          assignedRestaurantIds: row.assigned_restaurant_ids ?? [],
          deliveries: deliveries.get(row.id) ?? 0,
          issues: {
            customerDidNotReceive: notReceived.get(row.id) ?? 0,
            highPtod: highPtod.get(row.id) ?? 0
          }
        }))
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ couriers: [], error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = courierCreateSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json({ error: "Invalid courier payload", issues: payload.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("couriers")
      .insert({
        name: payload.data.name,
        phone: payload.data.phone,
        city: payload.data.city,
        vehicle_type: payload.data.vehicleType,
        preferred_language: payload.data.preferredLanguage,
        status: "offline",
        assigned_restaurant_ids: []
      })
      .select("id, name, phone, city, status, assigned_restaurant_ids")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        courier: {
          id: data.id,
          name: data.name,
          phone: data.phone,
          city: data.city,
          status: data.status,
          assignedRestaurantIds: data.assigned_restaurant_ids ?? [],
          deliveries: 0,
          issues: { customerDidNotReceive: 0, highPtod: 0 }
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
