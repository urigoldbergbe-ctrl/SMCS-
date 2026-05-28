"use client";

import { useEffect, useState } from "react";
import { useMessages } from "../lib/i18n";

interface CourierView {
  id: string;
  name: string;
  phone: string;
  city: string;
  status: "online" | "offline" | "on_run";
  deliveries: number;
  issues: {
    customerDidNotReceive: number;
    highPtod: number;
  };
}

const initialForm = {
  name: "",
  phone: "",
  city: "באר שבע"
};

export default function CouriersPage() {
  const { t } = useMessages();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [couriers, setCouriers] = useState<CourierView[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadCouriers(): Promise<void> {
    try {
      setLoading(true);
      const response = await fetch("/api/couriers");
      const body = (await response.json()) as { couriers?: CourierView[] };
      setCouriers(body.couriers ?? []);
    } catch {
      setMessage("טעינת רשימת שליחים נכשלה.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCouriers();
  }, []);

  async function createCourier(): Promise<void> {
    if (!form.name.trim() || !form.phone.trim() || !form.city.trim()) {
      setMessage("יש למלא שם, טלפון ועיר.");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setMessage("שומר שליח...");
    try {
      const response = await fetch("/api/couriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          city: form.city,
          vehicleType: "scooter",
          preferredLanguage: "he"
        })
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setMessage(`יצירת שליח נכשלה: ${body.error ?? "יש לבדוק שם/טלפון/עיר."}`);
        return;
      }

      setForm(initialForm);
      setMessage("השליח נשמר בהצלחה.");
      await loadCouriers();
    } catch {
      setMessage("יצירת שליח נכשלה עקב שגיאת רשת.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="stack">
      <h1>{t.couriers_title}</h1>
      <article className="card">
        <h3 className="section-title">{t.couriers_add}</h3>
        <div className="form-row">
          <input
            className="input"
            placeholder="שם מלא"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          <input
            className="input"
            placeholder="מספר טלפון"
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
          />
          <select
            className="select"
            value={form.city}
            onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
          >
            <option>באר שבע</option>
            <option>אשדוד</option>
            <option>תל אביב</option>
          </select>
          <button className="button" onClick={createCourier} disabled={submitting}>
            {submitting ? "יוצר שליח..." : "יצירת שליח ושליחת קישור התחברות"}
          </button>
          {message ? <p>{message}</p> : null}
        </div>
      </article>
      <article className="card">
        <h3 className="section-title">{t.couriers_list}</h3>
        <div className="alert-list" style={{ marginTop: "10px" }}>
          {loading ? <div className="alert-item">טוען שליחים...</div> : null}
          {!loading && couriers.length === 0 ? <div className="alert-item">אין שליחים שמורים עדיין.</div> : null}
          {couriers.map((courier) => (
            <div key={courier.id} className="alert-item">
              <strong>{courier.name}</strong> | {courier.city} | {courier.phone} | סטטוס: {courier.status} | משלוחים:{" "}
              {courier.deliveries}
              <div style={{ color: "var(--muted)" }}>
                בעיות: לקוח לא קיבל הזמנה ({courier.issues.customerDidNotReceive}), PToD גבוה ({courier.issues.highPtod})
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
