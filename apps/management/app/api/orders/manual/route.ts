import { NextResponse } from "next/server";
import { manualOrderEntrySchema } from "@scms/shared";
import { addManualOrder, listManualOrders } from "@/lib/services/state";

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json({ orders: await listManualOrders() }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ orders: [], warning: `Manual orders unavailable: ${String(error)}` }, { status: 200 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
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

    const order = await addManualOrder(parsed.data);
    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create manual order", detail: String(error) }, { status: 500 });
  }
}
