"use client";

import { useState } from "react";

export default function SupportQueuePage() {
  const [status, setStatus] = useState("ממתין");

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
  }

  return (
    <section className="stack">
      <h1>תור תמיכה</h1>
      <article className="card">
        <button className="button" onClick={createDemoTicket}>
          יצירת פנייה מוסלמת
        </button>
        <p>{status}</p>
      </article>
    </section>
  );
}
