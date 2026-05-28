import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type VipStatus = "half_time" | "one_full" | "two_full";

const requiredCapacityByStatus: Record<VipStatus, number> = {
  half_time: 0.5,
  one_full: 1,
  two_full: 2
};

function normalizeStatus(value: unknown): VipStatus {
  return value === "half_time" || value === "two_full" ? value : "one_full";
}

interface ComplianceEntry {
  capacity: number;
  required: number;
  compliant: boolean;
}

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    const [restaurantsRes, couriersRes, vipRes] = await Promise.all([
      supabase.from("restaurants").select("*").eq("is_active", true).order("name", { ascending: true }),
      supabase
        .from("couriers")
        .select("id, name, assigned_restaurant_ids")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase.from("vip_customers").select("*").eq("is_active", true).order("name", { ascending: true })
    ]);

    const assignmentsByRestaurant: Record<string, string[]> = {};
    const assignmentsByVip: Record<string, string[]> = {};
    const restaurants = (restaurantsRes.data ?? []) as Array<{ id: string; name: string; vip_status?: string }>;
    const couriers = (couriersRes.data ?? []) as Array<{ id: string; name: string; assigned_restaurant_ids?: string[] }>;
    const vipCustomers = (vipRes.data ?? []) as Array<{ id: string; name: string; vip_status?: string; assigned_courier_ids?: string[] }>;

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

    // A courier assigned to a single entity (restaurant or VIP) counts as full (1.0).
    // A courier shared across more than one entity counts as half (0.5) toward each.
    const courierEntityCount = new Map<string, number>();
    const bump = (courierId: string): void => {
      courierEntityCount.set(courierId, (courierEntityCount.get(courierId) ?? 0) + 1);
    };
    for (const courierIds of Object.values(assignmentsByRestaurant)) {
      for (const courierId of courierIds) bump(courierId);
    }
    for (const courierIds of Object.values(assignmentsByVip)) {
      for (const courierId of courierIds) bump(courierId);
    }
    const contribution = (courierId: string): number => ((courierEntityCount.get(courierId) ?? 0) > 1 ? 0.5 : 1);

    const buildCompliance = (assignedCourierIds: string[], status: VipStatus): ComplianceEntry => {
      const capacity = assignedCourierIds.reduce((sum, courierId) => sum + contribution(courierId), 0);
      const required = requiredCapacityByStatus[status];
      return { capacity: Math.round(capacity * 10) / 10, required, compliant: capacity + 1e-9 >= required };
    };

    const restaurantCompliance: Record<string, ComplianceEntry> = {};
    for (const restaurant of restaurants) {
      restaurantCompliance[restaurant.id] = buildCompliance(
        assignmentsByRestaurant[restaurant.id] ?? [],
        normalizeStatus(restaurant.vip_status)
      );
    }
    const vipCompliance: Record<string, ComplianceEntry> = {};
    for (const vip of vipCustomers) {
      vipCompliance[vip.id] = buildCompliance(assignmentsByVip[vip.id] ?? [], normalizeStatus(vip.vip_status));
    }

    return NextResponse.json({
      assignments: {
        restaurants: assignmentsByRestaurant,
        vip: assignmentsByVip
      },
      compliance: {
        restaurants: restaurantCompliance,
        vip: vipCompliance
      },
      dictionaries: {
        restaurants: restaurants.map((row) => ({ id: row.id, name: row.name })),
        couriers: couriers.map((row) => ({ id: row.id, name: row.name })),
        vipCustomers: vipCustomers.map((row) => ({ id: row.id, name: row.name }))
      }
    });
  } catch {
    return NextResponse.json({
      assignments: { restaurants: {}, vip: {} },
      compliance: { restaurants: {}, vip: {} },
      dictionaries: { restaurants: [], couriers: [], vipCustomers: [] }
    });
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
