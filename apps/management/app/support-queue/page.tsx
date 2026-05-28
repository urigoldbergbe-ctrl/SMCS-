"use client";

import { useEffect, useState } from "react";

interface Ticket {
  id: string;
  courierId: string;
  issueCategory: string;
  status: "open" | "ai_handling" | "escalated" | "resolved";
  createdAt: string;
}

export default function SupportQueuePage() {
  const [status, setStatus] = useState("ממתין");
  const [tickets, setTickets] = useState<Ticket[]>([]);

  async function loadTickets(): Promise<void> {
    const response = await fetch("/api/support");
    const body = (await response.json()) as { tickets?: Ticket[] };
    setTickets(body.tickets ?? []);
  }

  useEffect(() => {
    void loadTickets();
  }, []);

  async function createDemoTicket(): Promise<void> {
    setStatus("יוצר...");
    const response = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        courierId: "11111111-1111-1111-1111-111111111111",
        issueCategory: "customer_not_answering",
        status: "escalated",
        transcript: [{ by: "ai", message: "מעביר לנציג אנושי", createdAt: new Date().toISOString() }],
        resolutionTag: null,
        createdAt: new Date().toISOString(),
        resolvedAt: null
      })
    });
    setStatus(response.ok ? "הפנייה נוצרה" : "יצירת הפנייה נכשלה");
    if (response.ok) await loadTickets();
  }

  async function resolveTicket(ticketId: string): Promise<void> {
    setStatus("מעדכן סטטוס...");
    const response = await fetch("/api/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketId,
        status: "resolved",
        message: "Closed by operator"
      })
    });
    setStatus(response.ok ? "הפנייה נסגרה" : "עדכון סטטוס נכשל");
    if (response.ok) await loadTickets();
  }

  return (
    <section className="stack">
      <h1>תור תמיכה</h1>
      <article className="card">
        <button className="button" onClick={createDemoTicket}>
          יצירת פנייה מוסלמת
        </button>
        <p>{status}</p>
        <div className="alert-list">
          {tickets.length === 0 ? <div className="alert-item">אין פניות פתוחות.</div> : null}
          {tickets.map((ticket) => (
            <div key={ticket.id} className="alert-item">
              <div>
                <strong>{ticket.issueCategory}</strong> | שליח: {ticket.courierId} | סטטוס: {ticket.status}
              </div>
              <div style={{ color: "var(--muted)" }}>{new Date(ticket.createdAt).toLocaleString()}</div>
              {ticket.status !== "resolved" ? (
                <button className="button" style={{ marginTop: "6px" }} onClick={() => resolveTicket(ticket.id)}>
                  סגירת פנייה
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
