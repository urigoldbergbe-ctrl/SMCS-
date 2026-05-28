"use client";

import { useEffect, useState } from "react";

type Language = "he" | "en";
type Appearance = "light" | "dark";

const settingsKey = "management_ui_settings";

function applyManagementUi(language: Language, appearance: Appearance): void {
  const direction = language === "he" ? "rtl" : "ltr";
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

export default function LanguageToggle(): JSX.Element {
  const [language, setLanguage] = useState<Language>("he");
  const [appearance, setAppearance] = useState<Appearance>("light");

  useEffect(() => {
    const raw = localStorage.getItem(settingsKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { language?: Language; appearance?: Appearance };
      setLanguage(parsed.language ?? "he");
      setAppearance(parsed.appearance ?? "light");
    } catch {
      // keep defaults
    }
  }, []);

  function toggleLanguage(): void {
    const nextLanguage: Language = language === "he" ? "en" : "he";
    const nextSettings = { language: nextLanguage, appearance };
    localStorage.setItem(settingsKey, JSON.stringify(nextSettings));
    applyManagementUi(nextLanguage, appearance);
    setLanguage(nextLanguage);
  }

  return (
    <button className="lang-toggle" onClick={toggleLanguage} aria-label="Toggle management language">
      {language === "he" ? "EN" : "HE"}
    </button>
  );
}
