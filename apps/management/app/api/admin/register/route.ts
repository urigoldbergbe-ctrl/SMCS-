import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const registerSchema = z.object({
  inviteToken: z.string().min(6),
  email: z.string().email(),
  password: z.string().min(8)
});

const ADMIN_USERS_KEY = "admin_users";

function hashSecret(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = registerSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json({ error: "Invalid registration payload", issues: payload.error.flatten() }, { status: 400 });
    }

    const expectedToken = (process.env.ADMIN_INVITE_TOKEN ?? "SCMS-ADMIN-2026").trim();
    if (payload.data.inviteToken.trim() !== expectedToken) {
      return NextResponse.json({ error: "Invalid invite token" }, { status: 403 });
    }

    const supabase = getSupabaseAdminClient();
    const { data: existingData } = await supabase.from("app_settings").select("value").eq("key", ADMIN_USERS_KEY).maybeSingle();

    const existingAdmins =
      existingData?.value && Array.isArray(existingData.value) ? (existingData.value as Array<Record<string, unknown>>) : [];
    const emailLower = payload.data.email.trim().toLowerCase();
    if (existingAdmins.some((row) => row.email === emailLower)) {
      return NextResponse.json({ error: "Admin user already exists" }, { status: 409 });
    }

    const nextAdmins = [
      ...existingAdmins,
      {
        id: crypto.randomUUID(),
        email: emailLower,
        passwordHash: hashSecret(payload.data.password),
        createdAt: new Date().toISOString()
      }
    ];

    const { error: upsertError } = await supabase.from("app_settings").upsert(
      {
        key: ADMIN_USERS_KEY,
        value: nextAdmins,
        updated_at: new Date().toISOString()
      },
      { onConflict: "key" }
    );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    await supabase.from("audit_log").insert({
      event_type: "admin_registered",
      entity_type: "admin_user",
      entity_id: emailLower,
      actor: "admin",
      payload: { email: emailLower },
      created_at: new Date().toISOString()
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
