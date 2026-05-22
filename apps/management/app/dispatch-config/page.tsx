"use client";

import { useState } from "react";

export default function DispatchConfigPage() {
  const [city, setCity] = useState("beer_sheva");
  const [message, setMessage] = useState<string | null>(null);

  async function save(): Promise<void> {
    setMessage("שומר...");
    const response = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city,
        changedBy: "operator-demo",
        changeNote: "Manual save from config UI",
        config: {
          city,
          strategicTracks: ["A1", "A2", "B"],
          checks: { checkTrackEligibility: true, checkPartnerActive: true, checkAajlThreshold: true },
          weights: { proximity: 0.5, workload: 0.35, priority: 0.15, history: 0 },
          thresholds: {
            aajlThreshold: 3,
            workloadMaxActiveOrders: 2,
            workloadMaxEtaMinutes: 25,
            proximityMaxEtaMinutes: 15,
            safeguardTimeoutSeconds: 60
          }
        }
      })
    });
    setMessage(response.ok ? "התצורה נשמרה." : "שמירת התצורה נכשלה.");
  }

  return (
    <section className="stack">
      <h1>הגדרות דיספאץ'</h1>
      <article className="card">
        <div className="form-row">
          <label>עיר</label>
          <select className="select" value={city} onChange={(event) => setCity(event.target.value)}>
            <option value="beer_sheva">באר שבע</option>
            <option value="ashdod">אשדוד</option>
            <option value="tlv">תל אביב</option>
          </select>
          <button className="button" onClick={save}>
            שמירת תמונת תצורה
          </button>
          <a href="/simulation" className="button">
            פתיחת סימולציה
          </a>
        </div>
        {message ? <p>{message}</p> : null}
      </article>
    </section>
  );
}
