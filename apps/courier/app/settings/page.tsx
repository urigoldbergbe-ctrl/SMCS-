"use client";

import { useState } from "react";

export default function CourierSettingsPage() {
  const [language, setLanguage] = useState("he");
  const [appearance, setAppearance] = useState("light");
  const [message, setMessage] = useState<string | null>(null);

  function save(): void {
    setMessage("ההגדרות נשמרו בהצלחה.");
  }

  return (
    <main className="mobile">
      <section className="card">
        <h1 style={{ marginTop: 0 }}>הגדרות אפליקציה</h1>
        <p className="muted">בחירת שפה, מראה והעדפות חשבון לשליח.</p>
      </section>

      <section className="card">
        <label>שפה</label>
        <select className="secondary" value={language} onChange={(event) => setLanguage(event.target.value)}>
          <option value="he">עברית</option>
          <option value="en">English</option>
          <option value="ru">Русский</option>
          <option value="ar">العربية</option>
        </select>
      </section>

      <section className="card">
        <label>מראה</label>
        <select className="secondary" value={appearance} onChange={(event) => setAppearance(event.target.value)}>
          <option value="light">בהיר</option>
          <option value="dark">כהה</option>
        </select>
      </section>

      <section className="card action-row">
        <a className="secondary" href="/terms">
          תנאי שימוש
        </a>
        <button className="secondary">עדכון סיסמה</button>
        <a className="secondary" href="/logs">
          יומן משלוחים
        </a>
        <button className="primary" onClick={save}>
          שמירה
        </button>
      </section>

      {message ? <section className="card">{message}</section> : null}
    </main>
  );
}
