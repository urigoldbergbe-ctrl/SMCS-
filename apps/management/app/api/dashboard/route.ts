import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

interface TripJobRow {
  order_id: string;
  dispatch_time: string;
  couriers?: { name?: string } | { name?: string }[] | null;
  restaurants?: { name?: string } | { name?: string }[] | null;
}

function single<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = getSupabaseAdminClient();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [activeRes, onRunRes, waitingRes, inProgressRes, ptodRes, jobsRes, manualRes] = await Promise.all([
      supabase.from("couriers").select("id", { count: "exact", head: true }).eq("is_active", true).in("status", ["online", "on_run"]),
      supabase.from("couriers").select("id", { count: "exact", head: true }).eq("is_active", true).eq("status", "on_run"),
      supabase.from("couriers").select("id", { count: "exact", head: true }).eq("is_active", true).eq("status", "online"),
      supabase
        .from("trips")
        .select("id", { count: "exact", head: true })
        .is("delivery_time", null)
        .eq("cancellation_flag", false),
      supabase
        .from("trips")
        .select("ptod_minutes")
        .not("ptod_minutes", "is", null)
        .gte("delivery_time", startOfToday.toISOString()),
      supabase
        .from("trips")
        .select("order_id, dispatch_time, couriers(name), restaurants(name)")
        .is("delivery_time", null)
        .eq("cancellation_flag", false)
        .order("dispatch_time", { ascending: false })
        .limit(50),
      supabase.from("manual_orders").select("id, customer_address_full")
    ]);

    const ptodValues = (ptodRes.data ?? []).map((row) => Number(row.ptod_minutes)).filter((value) => !Number.isNaN(value));
    const currentPtod = ptodValues.length
      ? Math.round((ptodValues.reduce((sum, value) => sum + value, 0) / ptodValues.length) * 10) / 10
      : 0;

    const activeCouriers = activeRes.count ?? 0;
    const onRun = onRunRes.count ?? 0;
    const waiting = waitingRes.count ?? 0;
    const inProgress = inProgressRes.count ?? 0;
    const utilization = activeCouriers > 0 ? Math.round((onRun / activeCouriers) * 100) : 0;

    const destinationByOrderId = new Map<string, string>();
    for (const row of manualRes.data ?? []) {
      destinationByOrderId.set(row.id, row.customer_address_full);
    }

    const jobs = ((jobsRes.data ?? []) as TripJobRow[]).map((row) => {
      const courier = single(row.couriers);
      const restaurant = single(row.restaurants);
      const minutesOnJob = Math.max(0, Math.round((Date.now() - new Date(row.dispatch_time).getTime()) / 60_000));
      return {
        orderId: row.order_id,
        courier: courier?.name ?? "—",
        restaurant: restaurant?.name ?? "—",
        destination: destinationByOrderId.get(row.order_id) ?? "—",
        minutesOnJob
      };
    });

    return NextResponse.json(
      {
        kpis: { activeCouriers, inProgress, currentPtod, utilization, onRun, waiting },
        jobs
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        kpis: { activeCouriers: 0, inProgress: 0, currentPtod: 0, utilization: 0, onRun: 0, waiting: 0 },
        jobs: [],
        error: String(error)
      },
      { status: 200 }
    );
  }
}
