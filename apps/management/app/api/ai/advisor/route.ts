import { NextResponse } from "next/server";
import { aiAdvisorRequestSchema } from "@scms/shared";
import { getAiAdvisorRecommendation } from "@/lib/services/state";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = aiAdvisorRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid advisor request", issues: parsed.error.flatten() }, { status: 400 });
    }
    const output = await getAiAdvisorRecommendation(parsed.data);
    return NextResponse.json(output, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get advisor recommendation", detail: String(error) }, { status: 500 });
  }
}
