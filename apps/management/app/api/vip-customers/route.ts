import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const vipStatusEnum = z.enum(["half_time", "one_full", "two_full"]);

const vipCreateSchema = z.object({
  name: z.string().min(2),
  code: z.string().optional().default(""),
  city: z.string().min(2),
  street: z.string().min(1),
  streetNumber: z.string().min(1),
  specialDirections: z.string().optional().default(""),
  zone: z.string().optional().default(""),
  vipStatus: vipStatusEnum.default("one_full"),
  contactName: z.string().optional().default(""),
  contactPhone: z.string().optional().default("")
});

interface VipRow {
  id: string;
  name: string;
  city: string;
  code: string | null;
  street: string | null;
  street_number: string | null;
  special_directions: string | null;
  zone: string | null;
  vip_status: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  assigned_courier_ids: string[] | null;
}

function mapVip(row: VipRow) {
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
    contactName: row.contact_name ?? "",
    contactPhone: row.contact_phone ?? "",
    assignedCourierIds: row.assigned_courier_ids ?? []
  };
}

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("vip_customers")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (error) {
      return NextResponse.json({ vipCustomers: [], error: error.message }, { status: 500 });
    }
    return NextResponse.json({ vipCustomers: (data ?? []).map((row) => mapVip(row as VipRow)) }, { status: 200 });
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
    const { name, code, city, street, streetNumber, specialDirections, zone, vipStatus, contactName, contactPhone } = payload.data;

    const fullInsert = {
      name,
      city,
      code,
      street,
      street_number: streetNumber,
      special_directions: specialDirections,
      zone,
      vip_status: vipStatus,
      contact_name: contactName,
      contact_phone: contactPhone,
      assigned_courier_ids: []
    };

    let result = await supabase.from("vip_customers").insert(fullInsert).select("*").single();

    if (result.error && /column .* does not exist/i.test(result.error.message)) {
      result = await supabase
        .from("vip_customers")
        .insert({ name, city, contact_name: contactName, contact_phone: contactPhone, assigned_courier_ids: [] })
        .select("*")
        .single();
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
    return NextResponse.json({ vipCustomer: mapVip(result.data as VipRow) }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
