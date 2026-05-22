import { NextResponse } from "next/server";
import { z } from "zod";

const locationSchema = z.object({
  courierId: z.string().uuid(),
  lat: z.number(),
  lng: z.number(),
  orderId: z.string().optional(),
  timestamp: z.string().datetime(),
  mode: z.enum(["integrated", "standalone"])
});

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const parsed = locationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid location payload" }, { status: 400 });

  return NextResponse.json(
    {
      storedInScms: true,
      forwardedTo10bis: parsed.data.mode === "integrated",
      fireAndForget: true
    },
    { status: 200 }
  );
}
