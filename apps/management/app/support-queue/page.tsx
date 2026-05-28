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
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  async function loadTickets(): Promise<void> {
    try {
      setLoading(true);
      const response = await fetch("/api/support");
      const body = (await response.json()) as { tickets?: Ticket[] };
      setTickets(body.tickets ?? []);
    } catch {
      setStatus("טעינת הפניות נכשלה");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTickets();
  }, []);

  async function createDemoTicket(): Promise<void> {
    if (creating) return;
    setCreating(true);
    setStatus("יוצר...");
    try {
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
    } catch {
      setStatus("יצירת הפנייה נכשלה");
    } finally {
      setCreating(false);
    }
  }

  async function resolveTicket(ticketId: string): Promise<void> {
    if (resolvingId) return;
    setResolvingId(ticketId);
    setStatus("מעדכן סטטוס...");
    try {
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
    } catch {
      setStatus("עדכון סטטוס נכשל");
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <section className="stack">
      <h1>תור תמיכה</h1>
      <article className="card">
        <button className="button" onClick={createDemoTicket} disabled={creating}>
          {creating ? "יוצר פנייה..." : "יצירת פנייה מוסלמת"}
        </button>
        <p>{status}</p>
        <div className="alert-list">
          {loading ? <div className="alert-item">טוען פניות...</div> : null}
          {!loading && tickets.length === 0 ? <div className="alert-item">אין פניות פתוחות.</div> : null}
          {tickets.map((ticket) => (
            <div key={ticket.id} className="alert-item">
              <div>
                <strong>{ticket.issueCategory}</strong> | שליח: {ticket.courierId} | סטטוס: {ticket.status}
              </div>
              <div className="muted-text">{new Date(ticket.createdAt).toLocaleString()}</div>
              {ticket.status !== "resolved" ? (
                <button className="button" onClick={() => resolveTicket(ticket.id)} disabled={resolvingId === ticket.id}>
                  {resolvingId === ticket.id ? "סוגר פנייה..." : "סגירת פנייה"}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
