"use client";

import { useEffect, useState } from "react";
import { useMessages } from "../lib/i18n";

type Language = "he" | "en" | "ru" | "ar";
type Appearance = "light" | "dark";

const settingsKey = "management_ui_settings";

function applyManagementUi(language: Language, appearance: Appearance): void {
  const direction = language === "he" || language === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = language;
  document.documentElement.dir = direction;

  const root = document.documentElement;
  if (appearance === "dark") {
    root.style.setProperty("--bg", "#111827");
    root.style.setProperty("--panel", "#1f2937");
    root.style.setProperty("--panel-soft", "#293548");
    root.style.setProperty("--text", "#f9fafb");
    root.style.setProperty("--muted", "#cbd5e1");
    root.style.setProperty("--border", "#374151");
  } else {
    root.style.setProperty("--bg", "#f7f9fc");
    root.style.setProperty("--panel", "#ffffff");
    root.style.setProperty("--panel-soft", "#eef3f8");
    root.style.setProperty("--text", "#1b2a41");
    root.style.setProperty("--muted", "#5f6f86");
    root.style.setProperty("--border", "#d8e1ec");
  }
}

export default function SettingsPage() {
  const { t } = useMessages();
  const [mode, setMode] = useState("integrated");
  const [language, setLanguage] = useState<Language>("he");
  const [appearance, setAppearance] = useState<Appearance>("light");
  const [saved, setSaved] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(settingsKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { language?: Language; appearance?: Appearance };
      setLanguage(parsed.language ?? "he");
      setAppearance(parsed.appearance ?? "light");
    } catch {
      // ignore malformed settings
    }
  }, []);

  async function saveMode(): Promise<void> {
    if (saving) return;
    setSaving(true);
    try {
      const response = await fetch("/api/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode })
      });
      if (!response.ok) {
        setSaved("עדכון המצב נכשל.");
        return;
      }
      localStorage.setItem(settingsKey, JSON.stringify({ language, appearance }));
      applyManagementUi(language, appearance);
      window.dispatchEvent(new CustomEvent("management-language-changed", { detail: { language } }));
      setSaved("המצב, השפה והתצוגה עודכנו.");
    } catch {
      setSaved("עדכון ההגדרות נכשל עקב שגיאת רשת.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="stack">
      <h1>{t.settings_title}</h1>
      <article className="card">
        <label>{t.settings_mode}</label>
        <select className="select" value={mode} onChange={(event) => setMode(event.target.value)}>
          <option value="integrated">אינטגרטיבי</option>
          <option value="standalone">עצמאי</option>
          <option value="simulation">סימולציה</option>
        </select>
        <label>{t.settings_language}</label>
        <select className="select" value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
          <option value="he">עברית</option>
          <option value="en">English</option>
          <option value="ru">Русский</option>
          <option value="ar">العربية</option>
        </select>
        <label>{t.settings_appearance}</label>
        <select className="select" value={appearance} onChange={(event) => setAppearance(event.target.value as Appearance)}>
          <option value="light">בהיר</option>
          <option value="dark">כהה</option>
        </select>
        <button className="button" onClick={saveMode} disabled={saving}>
          {saving ? t.saving : t.save}
        </button>
        {saved ? <p>{saved}</p> : null}
      </article>
    </section>
  );
}
