"use client";

import { useEffect } from "react";

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

export default function UiPreferences(): null {
  useEffect(() => {
    const raw = localStorage.getItem(settingsKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { language?: Language; appearance?: Appearance };
      applyManagementUi(parsed.language ?? "he", parsed.appearance ?? "light");
    } catch {
      // ignore malformed preferences and keep defaults
    }
  }, []);

  return null;
}
