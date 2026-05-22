import { NextResponse } from "next/server";
import { supportTicketSchema } from "@scms/shared";
import { addSupportTicket, listSupportTickets, updateSupportTicketStatus } from "@/lib/services/state";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ tickets: listSupportTickets() }, { status: 200 });
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const parsed = supportTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid support ticket", issues: parsed.error.flatten() }, { status: 400 });
  }
  return NextResponse.json({ ticket: addSupportTicket(parsed.data) }, { status: 200 });
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const ticket = updateSupportTicketStatus(body.ticketId, body.status, body.message);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  return NextResponse.json({ ticket }, { status: 200 });
}
