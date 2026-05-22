import { NextResponse } from "next/server";
import { manualOrderEntrySchema } from "@scms/shared";
import { addManualOrder, listManualOrders } from "@/lib/services/state";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ orders: listManualOrders() }, { status: 200 });
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const parsed = manualOrderEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid manual order payload",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const order = addManualOrder(parsed.data);
  return NextResponse.json({ order }, { status: 200 });
}
