import { NextResponse } from "next/server";
import { simulationRequestSchema } from "@scms/shared";
import { listSimulationRuns, runSimulationScenario } from "@/lib/services/state";

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json({ runs: await listSimulationRuns() }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ runs: [], warning: `Simulation history unavailable: ${String(error)}` }, { status: 200 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = simulationRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid simulation request", issues: parsed.error.flatten() }, { status: 400 });
    }
    const result = await runSimulationScenario(parsed.data);
    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to run simulation", detail: String(error) }, { status: 500 });
  }
}
