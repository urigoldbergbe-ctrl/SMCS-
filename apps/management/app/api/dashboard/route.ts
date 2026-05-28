import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = getSupabaseAdminClient();

    const [pendingRes, onRunRes, highPtodRes, stalledRes] = await Promise.all([
      supabase.from("manual_orders").select("id", { count: "exact", head: true }).eq("status", "pending_dispatch"),
      supabase.from("couriers").select("id", { count: "exact", head: true }).eq("status", "on_run").eq("is_active", true),
      supabase
        .from("trips")
        .select("order_id, ptod_minutes")
        .gt("ptod_minutes", 60)
        .not("delivery_time", "is", null)
        .order("dispatch_time", { ascending: false })
        .limit(6),
      supabase
        .from("trips")
        .select("order_id, dispatch_time, pickup_time")
        .is("pickup_time", null)
        .eq("cancellation_flag", false)
        .order("dispatch_time", { ascending: false })
        .limit(20)
    ]);

    if (pendingRes.error || onRunRes.error || highPtodRes.error || stalledRes.error) {
      return NextResponse.json(
        { error: pendingRes.error?.message ?? onRunRes.error?.message ?? highPtodRes.error?.message ?? stalledRes.error?.message },
        { status: 500 }
      );
    }

    const stalled = (stalledRes.data ?? []).filter((row) => {
      const dispatchTimeMs = new Date(row.dispatch_time).getTime();
      return Date.now() - dispatchTimeMs > 20 * 60_000;
    });

    return NextResponse.json(
      {
        pendingAssignment: pendingRes.count ?? 0,
        couriersOnRun: onRunRes.count ?? 0,
        highPtodOrders: (highPtodRes.data ?? []).map((row) => ({
          orderId: row.order_id,
          ptodMinutes: row.ptod_minutes
        })),
        noProgressOrders: stalled.map((row) => ({
          orderId: row.order_id,
          minutesWithoutProgress: Math.round((Date.now() - new Date(row.dispatch_time).getTime()) / 60_000)
        }))
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
