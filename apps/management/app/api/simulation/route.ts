import { NextResponse } from "next/server";
import { simulationRequestSchema } from "@scms/shared";
import { listSimulationRuns, runSimulationScenario } from "@/lib/services/state";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ runs: listSimulationRuns() }, { status: 200 });
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const parsed = simulationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid simulation request", issues: parsed.error.flatten() }, { status: 400 });
  }
  const result = runSimulationScenario(parsed.data);
  return NextResponse.json({ result }, { status: 200 });
}
