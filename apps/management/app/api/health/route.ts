import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      service: "scms-management",
      status: "ok",
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}
