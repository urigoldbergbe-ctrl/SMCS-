import { NextResponse } from "next/server";
import { z } from "zod";

const otpSchema = z.object({
  phone: z.string().min(7),
  otpCode: z.string().length(6),
  onboardingToken: z.string().optional()
});

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const parsed = otpSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid OTP payload" }, { status: 400 });

  return NextResponse.json(
    {
      authenticated: true,
      sessionExpiresInDays: 30,
      courier: {
        phone: parsed.data.phone,
        preferredLanguage: "he"
      }
    },
    { status: 200 }
  );
}
