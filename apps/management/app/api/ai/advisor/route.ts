import { NextResponse } from "next/server";
import { aiAdvisorRequestSchema } from "@scms/shared";
import { getAiAdvisorRecommendation } from "@/lib/services/state";

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const parsed = aiAdvisorRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid advisor request", issues: parsed.error.flatten() }, { status: 400 });
  }
  const output = getAiAdvisorRecommendation(parsed.data);
  return NextResponse.json(output, { status: 200 });
}
