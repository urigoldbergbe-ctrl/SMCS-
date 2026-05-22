import { NextResponse } from "next/server";
import { z } from "zod";
import { decideDispatch } from "@scms/dispatch";
import {
  courierSnapshotSchema,
  dispatchConfigSchema,
  operationModeSchema,
  strategicOrderSchema
} from "@scms/shared";

const decisionRequestSchema = z.object({
  mode: operationModeSchema,
  order: strategicOrderSchema,
  config: dispatchConfigSchema,
  couriers: z.array(courierSnapshotSchema),
  partnerActive: z.boolean(),
  restaurantPriority: z.union([z.literal(1), z.literal(2), z.literal(3)])
});

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const parsed = decisionRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid dispatch decision payload",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const decision = decideDispatch(parsed.data.order, {
    mode: parsed.data.mode,
    config: parsed.data.config,
    couriers: parsed.data.couriers,
    partnerActive: parsed.data.partnerActive,
    restaurantPriority: parsed.data.restaurantPriority
  });

  return NextResponse.json({ decision }, { status: 200 });
}
