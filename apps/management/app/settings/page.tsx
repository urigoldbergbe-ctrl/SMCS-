"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [mode, setMode] = useState("integrated");
  const [saved, setSaved] = useState<string | null>(null);

  async function saveMode(): Promise<void> {
    const response = await fetch("/api/mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode })
    });
    setSaved(response.ok ? "המצב עודכן." : "עדכון המצב נכשל.");
  }

  return (
    <section className="stack">
      <h1>הגדרות</h1>
      <article className="card">
        <label>מצב תפעול</label>
        <select className="select" value={mode} onChange={(event) => setMode(event.target.value)}>
          <option value="integrated">אינטגרטיבי</option>
          <option value="standalone">עצמאי</option>
          <option value="simulation">סימולציה</option>
        </select>
        <button className="button" onClick={saveMode}>
          שמירה
        </button>
        {saved ? <p>{saved}</p> : null}
      </article>
    </section>
  );
}
