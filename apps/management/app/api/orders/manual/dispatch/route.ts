import { NextResponse } from "next/server";
import { decideDispatch } from "@scms/dispatch";
import type { CourierSnapshot, StrategicOrder } from "@scms/shared";
import { getConfig, getMode } from "@/lib/services/state";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

interface ManualOrderDispatchBody {
  orderId: string;
  city: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as ManualOrderDispatchBody;
    if (!body.orderId || !body.city) {
      return NextResponse.json({ error: "orderId and city are required" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data: order, error: orderError } = await supabase
      .from("manual_orders")
      .select("id, created_at, status")
      .eq("id", body.orderId)
      .maybeSingle();
    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message ?? "Order not found" }, { status: 404 });
    }
    if (order.status !== "pending_dispatch") {
      return NextResponse.json({ error: "Order is not pending dispatch" }, { status: 400 });
    }

    const { data: couriers, error: couriersError } = await supabase
      .from("couriers")
      .select("id, city, status, assigned_restaurant_ids, created_at")
      .eq("is_active", true)
      .eq("city", body.city);
    if (couriersError) {
      return NextResponse.json({ error: couriersError.message }, { status: 500 });
    }

    const courierSnapshots: CourierSnapshot[] = [];
    for (const courier of couriers ?? []) {
      const { count: activeOrders } = await supabase
        .from("trips")
        .select("id", { count: "exact", head: true })
        .eq("courier_id", courier.id)
        .is("delivery_time", null)
        .eq("cancellation_flag", false);

      courierSnapshots.push({
        courierId: courier.id,
        city: courier.city,
        assignedRestaurantIds: courier.assigned_restaurant_ids ?? [],
        activeOrders: activeOrders ?? 0,
        estimatedBusyMinutes: (activeOrders ?? 0) * 10,
        etaToRestaurantMinutes: 8,
        lastAssignedAt: null,
        seniorityDays: Math.max(1, Math.floor((Date.now() - new Date(courier.created_at).getTime()) / 86_400_000)),
        online: courier.status !== "offline"
      });
    }

    if (courierSnapshots.length === 0) {
      return NextResponse.json({ error: "No active couriers found in this city" }, { status: 400 });
    }

    const strategicOrder: StrategicOrder = {
      orderId: order.id,
      restaurantId: "00000000-0000-0000-0000-000000000000",
      city: body.city,
      track: "A1",
      aajl: null,
      orderSource: "manual",
      createdAt: order.created_at
    };

    const [config, mode] = await Promise.all([getConfig(body.city), getMode()]);
    const decision = decideDispatch(strategicOrder, {
      mode,
      config,
      partnerActive: true,
      restaurantPriority: 2,
      couriers: courierSnapshots
    });

    await supabase
      .from("manual_orders")
      .update({ status: "assigned" })
      .eq("id", body.orderId);

    return NextResponse.json(
      {
        ok: true,
        decision
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
