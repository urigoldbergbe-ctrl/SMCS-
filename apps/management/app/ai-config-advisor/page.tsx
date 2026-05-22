"use client";

import { useState } from "react";

export default function AiConfigAdvisorPage() {
  const [prompt, setPrompt] = useState("נתח את תצורת באר שבע והצג סיכונים");
  const [answer, setAnswer] = useState<string | null>(null);

  async function ask(): Promise<void> {
    const response = await fetch("/api/ai/advisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: "beer_sheva",
        intent: "config_review",
        prompt
      })
    });
    const body = await response.json();
    setAnswer(response.ok ? `${body.recommendation} (${body.rationale.join(" | ")})` : "הבקשה ליועץ נכשלה.");
  }

  return (
    <section className="stack">
      <h1>יועץ תצורה AI</h1>
      <article className="card">
        <textarea className="textarea" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
        <button className="button" onClick={ask}>
          שאל את היועץ
        </button>
      </article>
      {answer ? <article className="card">{answer}</article> : null}
    </section>
  );
}
