import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

interface TripRow {
  order_id: string;
  order_source: string;
  track: string;
  assigned_via: string;
  dispatch_time: string;
  pickup_time: string | null;
  delivery_time: string | null;
  ptod_minutes: number | null;
  cancellation_flag: boolean;
  cancellation_reason: string | null;
  couriers?: { name?: string } | { name?: string }[] | null;
  restaurants?: { name?: string } | { name?: string }[] | null;
}

function single<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from("trips")
      .select(
        "order_id, order_source, track, assigned_via, dispatch_time, pickup_time, delivery_time, ptod_minutes, cancellation_flag, cancellation_reason, couriers(name), restaurants(name)"
      )
      .order("dispatch_time", { ascending: false })
      .limit(1000);

    if (from) query = query.gte("dispatch_time", from);
    if (to) query = query.lte("dispatch_time", to);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ trips: [], error: error.message }, { status: 500 });
    }

    const trips = ((data ?? []) as TripRow[]).map((row) => ({
      orderId: row.order_id,
      orderSource: row.order_source,
      track: row.track,
      assignedVia: row.assigned_via,
      courier: single(row.couriers)?.name ?? "—",
      restaurant: single(row.restaurants)?.name ?? "—",
      dispatchTime: row.dispatch_time,
      pickupTime: row.pickup_time,
      deliveryTime: row.delivery_time,
      ptodMinutes: row.ptod_minutes,
      cancelled: row.cancellation_flag,
      cancellationReason: row.cancellation_reason ?? ""
    }));

    return NextResponse.json({ trips }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ trips: [], error: String(error) }, { status: 200 });
  }
}
