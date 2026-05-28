"use client";

import { useEffect, useState } from "react";

type Language = "he" | "en" | "ru" | "ar";
type Appearance = "light" | "dark";

const settingsKey = "courier_app_settings";

function applyUi(language: Language, appearance: Appearance): void {
  const direction = language === "he" || language === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = language;
  document.documentElement.dir = direction;
  const root = document.documentElement;
  if (appearance === "dark") {
    root.style.setProperty("--bg", "#111827");
    root.style.setProperty("--panel", "#1f2937");
    root.style.setProperty("--text", "#f9fafb");
    root.style.setProperty("--muted", "#c7d2fe");
    root.style.setProperty("--border", "#374151");
  } else {
    root.style.setProperty("--bg", "#f7f9fc");
    root.style.setProperty("--panel", "#ffffff");
    root.style.setProperty("--text", "#1b2a41");
    root.style.setProperty("--muted", "#5f6f86");
    root.style.setProperty("--border", "#d8e1ec");
  }
}

export default function CourierSettingsPage() {
  const [language, setLanguage] = useState<Language>("he");
  const [appearance, setAppearance] = useState<Appearance>("light");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(settingsKey);
    if (!raw) {
      applyUi(language, appearance);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { language?: Language; appearance?: Appearance };
      const nextLanguage = parsed.language ?? "he";
      const nextAppearance = parsed.appearance ?? "light";
      setLanguage(nextLanguage);
      setAppearance(nextAppearance);
      applyUi(nextLanguage, nextAppearance);
    } catch {
      applyUi(language, appearance);
    }
  }, []);

  function save(): void {
    localStorage.setItem(settingsKey, JSON.stringify({ language, appearance }));
    applyUi(language, appearance);
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
        <select className="secondary" value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
          <option value="he">עברית</option>
          <option value="en">English</option>
          <option value="ru">Русский</option>
          <option value="ar">العربية</option>
        </select>
      </section>

      <section className="card">
        <label>מראה</label>
        <select className="secondary" value={appearance} onChange={(event) => setAppearance(event.target.value as Appearance)}>
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
