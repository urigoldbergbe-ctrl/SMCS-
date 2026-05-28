"use client";

import { useMessages } from "../lib/i18n";

export default function AuditLogPage() {
  const { language, t } = useMessages();
  return (
    <section className="stack">
      <h1>{t.audit_title}</h1>
      <article className="card">
        <p>
          {language === "he"
            ? "תצוגת לוג ביקורת append-only עם בסיס לסינון וייצוא בסביבת ייצור."
            : "Append-only audit log view with a baseline for filtering and export in production."}
        </p>
      </article>
    </section>
  );
}
