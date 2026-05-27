import { NextResponse } from "next/server";
import { supportTicketSchema } from "@scms/shared";
import { addSupportTicket, listSupportTickets, updateSupportTicketStatus } from "@/lib/services/state";

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json({ tickets: await listSupportTickets() }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ tickets: [], warning: `Support queue unavailable: ${String(error)}` }, { status: 200 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = supportTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid support ticket", issues: parsed.error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ticket: await addSupportTicket(parsed.data) }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create support ticket", detail: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const ticket = await updateSupportTicketStatus(body.ticketId, body.status, body.message);
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    return NextResponse.json({ ticket }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update support ticket", detail: String(error) }, { status: 500 });
  }
}
