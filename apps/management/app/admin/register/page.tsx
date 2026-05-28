"use client";

import { useState } from "react";

export default function AdminRegisterPage() {
  const [inviteToken, setInviteToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function registerAdmin(): Promise<void> {
    if (!inviteToken.trim() || !email.trim() || password.length < 8) {
      setMessage("יש למלא טוקן, אימייל וסיסמה באורך 8 תווים לפחות.");
      return;
    }

    setMessage("רושם אדמין...");
    const response = await fetch("/api/admin/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inviteToken: inviteToken.trim(),
        email: email.trim().toLowerCase(),
        password
      })
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(`רישום נכשל: ${body.error ?? "שגיאה לא ידועה"}`);
      return;
    }
    setInviteToken("");
    setEmail("");
    setPassword("");
    setMessage("חשבון אדמין נוצר בהצלחה.");
  }

  return (
    <section className="stack">
      <h1>רישום אדמין</h1>
      <article className="card">
        <div className="form-row">
          <input
            className="input"
            placeholder="טוקן הזמנה"
            value={inviteToken}
            onChange={(event) => setInviteToken(event.target.value)}
          />
          <input className="input" placeholder="אימייל" value={email} onChange={(event) => setEmail(event.target.value)} />
          <input
            className="input"
            placeholder="סיסמה"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button className="button" onClick={registerAdmin}>
            יצירת חשבון אדמין
          </button>
          {message ? <p>{message}</p> : null}
        </div>
      </article>
    </section>
  );
}
