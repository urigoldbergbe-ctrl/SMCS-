import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    const [restaurantsRes, couriersRes, vipRes] = await Promise.all([
      supabase.from("restaurants").select("id, name").eq("is_active", true).order("name", { ascending: true }),
      supabase
        .from("couriers")
        .select("id, name, assigned_restaurant_ids")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase.from("vip_customers").select("id, name, assigned_courier_ids").eq("is_active", true).order("name", { ascending: true })
    ]);
    if (restaurantsRes.error || couriersRes.error || vipRes.error) {
      return NextResponse.json(
        { error: restaurantsRes.error?.message ?? couriersRes.error?.message ?? vipRes.error?.message },
        { status: 500 }
      );
    }

    const assignmentsByRestaurant: Record<string, string[]> = {};
    const assignmentsByVip: Record<string, string[]> = {};
    const restaurants = restaurantsRes.data ?? [];
    const couriers = couriersRes.data ?? [];
    const vipCustomers = vipRes.data ?? [];

    for (const restaurant of restaurants) {
      assignmentsByRestaurant[restaurant.id] = [];
    }
    for (const courier of couriers) {
      for (const restaurantId of courier.assigned_restaurant_ids ?? []) {
        if (!assignmentsByRestaurant[restaurantId]) assignmentsByRestaurant[restaurantId] = [];
        assignmentsByRestaurant[restaurantId].push(courier.id);
      }
    }
    for (const vip of vipCustomers) {
      assignmentsByVip[vip.id] = vip.assigned_courier_ids ?? [];
    }

    return NextResponse.json({
      assignments: {
        restaurants: assignmentsByRestaurant,
        vip: assignmentsByVip
      },
      dictionaries: {
        restaurants: restaurants.map((row) => ({ id: row.id, name: row.name })),
        couriers: couriers.map((row) => ({ id: row.id, name: row.name })),
        vipCustomers: vipCustomers.map((row) => ({ id: row.id, name: row.name }))
      }
    });
  } catch {
    return NextResponse.json({ assignments: { restaurants: {}, vip: {} }, dictionaries: { restaurants: [], couriers: [], vipCustomers: [] } });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      assignments?: {
        restaurants?: Record<string, string[]>;
        vip?: Record<string, string[]>;
      };
    };
    const supabase = getSupabaseAdminClient();

    const restaurantAssignments = body.assignments?.restaurants;
    const vipAssignments = body.assignments?.vip;

    // Only rewrite the courier->restaurant mapping when restaurant assignments are submitted.
    if (restaurantAssignments) {
      const { data: couriers, error: couriersError } = await supabase
        .from("couriers")
        .select("id")
        .eq("is_active", true);
      if (couriersError) {
        return NextResponse.json({ ok: false, error: couriersError.message }, { status: 500 });
      }

      const courierIds = (couriers ?? []).map((row) => row.id);
      for (const courierId of courierIds) {
        const assignedRestaurantIds = Object.entries(restaurantAssignments)
          .filter(([, assignedCourierIds]) => assignedCourierIds.includes(courierId))
          .map(([restaurantId]) => restaurantId);
        const { error: updateError } = await supabase
          .from("couriers")
          .update({ assigned_restaurant_ids: assignedRestaurantIds })
          .eq("id", courierId);
        if (updateError) {
          return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
        }
      }
    }

    // Only update VIP assignments when the VIP map is submitted.
    if (vipAssignments) {
      for (const [vipId, assignedCourierIds] of Object.entries(vipAssignments)) {
        const { error: vipUpdateError } = await supabase
          .from("vip_customers")
          .update({ assigned_courier_ids: assignedCourierIds })
          .eq("id", vipId);
        if (vipUpdateError) {
          return NextResponse.json({ ok: false, error: vipUpdateError.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to save assignments" },
      { status: 400 }
    );
  }
}
