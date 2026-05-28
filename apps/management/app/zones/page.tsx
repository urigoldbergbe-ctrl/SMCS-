"use client";

import { useEffect, useState } from "react";

interface ZoneConfig {
  id: string;
  name: string;
  city: string;
  maxPtodMinutes: number;
  maxPulledOrders: number;
}

export default function ZonesPage() {
  const [zones, setZones] = useState<ZoneConfig[]>([]);
  const [form, setForm] = useState<ZoneConfig>({
    id: "",
    name: "",
    city: "beer_sheva",
    maxPtodMinutes: 60,
    maxPulledOrders: 2
  });
  const [message, setMessage] = useState<string | null>(null);

  async function loadZones(): Promise<void> {
    const response = await fetch("/api/zones");
    const body = (await response.json()) as { zones?: ZoneConfig[] };
    setZones(body.zones ?? []);
  }

  useEffect(() => {
    void loadZones();
  }, []);

  async function saveZones(nextZones: ZoneConfig[]): Promise<void> {
    const response = await fetch("/api/zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zones: nextZones })
    });
    setMessage(response.ok ? "האזורים נשמרו בהצלחה." : "שמירת אזורים נכשלה.");
  }

  async function addZone(): Promise<void> {
    if (!form.id.trim() || !form.name.trim()) {
      setMessage("יש להזין מזהה ושם אזור.");
      return;
    }
    const nextZones = [...zones, form];
    setZones(nextZones);
    await saveZones(nextZones);
    setForm({
      id: "",
      name: "",
      city: "beer_sheva",
      maxPtodMinutes: 60,
      maxPulledOrders: 2
    });
  }

  return (
    <section className="stack">
      <h1>ניהול אזורים</h1>
      <article className="card">
        <h3>הוספת אזור</h3>
        <div className="form-row">
          <input
            className="input"
            placeholder="מזהה אזור (למשל bs_center)"
            value={form.id}
            onChange={(event) => setForm((current) => ({ ...current, id: event.target.value }))}
          />
          <input
            className="input"
            placeholder="שם אזור"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          <select
            className="select"
            value={form.city}
            onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
          >
            <option value="beer_sheva">באר שבע</option>
            <option value="ashdod">אשדוד</option>
            <option value="tlv">תל אביב</option>
          </select>
          <input
            className="input"
            type="number"
            min={10}
            value={form.maxPtodMinutes}
            onChange={(event) => setForm((current) => ({ ...current, maxPtodMinutes: Number(event.target.value) }))}
            placeholder="מקסימום PToD"
          />
          <input
            className="input"
            type="number"
            min={1}
            value={form.maxPulledOrders}
            onChange={(event) => setForm((current) => ({ ...current, maxPulledOrders: Number(event.target.value) }))}
            placeholder="מקסימום הזמנות משוכות"
          />
          <button className="button" onClick={addZone}>
            הוספת אזור
          </button>
          {message ? <p>{message}</p> : null}
        </div>
      </article>
      <article className="card">
        <h3>רשימת אזורים</h3>
        <div className="alert-list">
          {zones.length === 0 ? <div className="alert-item">אין אזורים שמורים.</div> : null}
          {zones.map((zone) => (
            <div key={zone.id} className="alert-item">
              <strong>{zone.name}</strong> ({zone.id}) | עיר: {zone.city} | PToD: עד {zone.maxPtodMinutes} דק׳ | משיכות: עד{" "}
              {zone.maxPulledOrders}
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
