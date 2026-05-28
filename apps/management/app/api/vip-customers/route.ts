import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const vipCreateSchema = z.object({
  name: z.string().min(2),
  city: z.string().min(2),
  contactName: z.string().min(2).optional().default(""),
  contactPhone: z.string().min(7).optional().default("")
});

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("vip_customers")
      .select("id, name, city, contact_name, contact_phone, assigned_courier_ids, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (error) {
      return NextResponse.json({ vipCustomers: [], error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      {
        vipCustomers: (data ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          city: row.city,
          contactName: row.contact_name ?? "",
          contactPhone: row.contact_phone ?? "",
          assignedCourierIds: row.assigned_courier_ids ?? []
        }))
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ vipCustomers: [], error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = vipCreateSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json({ error: "Invalid VIP payload", issues: payload.error.flatten() }, { status: 400 });
    }
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("vip_customers")
      .insert({
        name: payload.data.name,
        city: payload.data.city,
        contact_name: payload.data.contactName,
        contact_phone: payload.data.contactPhone,
        assigned_courier_ids: []
      })
      .select("id, name, city, contact_name, contact_phone, assigned_courier_ids")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      {
        vipCustomer: {
          id: data.id,
          name: data.name,
          city: data.city,
          contactName: data.contact_name ?? "",
          contactPhone: data.contact_phone ?? "",
          assignedCourierIds: data.assigned_courier_ids ?? []
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
