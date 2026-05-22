"use client";

import { useState } from "react";
import type { SimulationResult } from "@scms/shared";

interface SimulationClientProps {
  initialCity: string;
  initialDatasetType: string;
  initialFleetSize: number;
}

export default function SimulationClient({
  initialCity,
  initialDatasetType,
  initialFleetSize
}: SimulationClientProps) {
  const [city, setCity] = useState(initialCity);
  const [datasetType, setDatasetType] = useState(initialDatasetType);
  const [fleetSize, setFleetSize] = useState(initialFleetSize);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [running, setRunning] = useState(false);

  async function run(): Promise<void> {
    setRunning(true);
    const response = await fetch("/api/simulation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city,
        datasetType,
        fleetSize,
        dateRange: {
          from: "2026-04-01T00:00:00.000Z",
          to: "2026-04-30T23:59:59.000Z"
        }
      })
    });
    const body = await response.json();
    setRunning(false);
    if (response.ok) setResult(body.result as SimulationResult);
  }

  return (
    <section className="stack">
      <h1>מצב סימולציה</h1>
      <article className="card">
        <div className="form-row" style={{ marginBottom: "10px" }}>
          <label>עיר</label>
          <select className="select" value={city} onChange={(event) => setCity(event.target.value)}>
            <option value="beer_sheva">באר שבע</option>
            <option value="ashdod">אשדוד</option>
            <option value="tlv">תל אביב</option>
          </select>
          <label>סוג סימולציה</label>
          <select className="select" value={datasetType} onChange={(event) => setDatasetType(event.target.value)}>
            <option value="historical_replay">שחזור היסטורי</option>
            <option value="what_if">מה יקרה אם</option>
            <option value="tlv_onboarding">אונבורדינג תל אביב</option>
            <option value="offline_disconnected">אופליין / מנותק</option>
          </select>
          <label>גודל צי</label>
          <input
            className="input"
            type="number"
            min={1}
            value={fleetSize}
            onChange={(event) => setFleetSize(Number(event.target.value))}
          />
        </div>
        <button className="button" disabled={running} onClick={run}>
          {running ? "מריץ סימולציה..." : "הרץ סימולציה"}
        </button>
      </article>
      {result ? (
        <article className="card">
          <h3>תוצאה</h3>
          <p>כיסוי צי אסטרטגי: {result.strategicCoveragePercent}%</p>
          <p>ממוצע PToD: {result.avgPtodMinutes} דקות</p>
          <p>המלצה: {result.recommendation}</p>
        </article>
      ) : null}
    </section>
  );
}
