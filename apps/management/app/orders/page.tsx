"use client";

import { useState } from "react";
import type { ManualOrderEntry } from "@scms/shared";

interface FormState {
  restaurantName: string;
  restaurantAddressFull: string;
  customerName: string;
  customerPhone: string;
  customerAddressFull: string;
  notes: string;
}

interface RouteEstimateResponse {
  validated: boolean;
  warnings: string[];
  normalizedAddresses?: {
    origin: string;
    destination: string;
  };
  routeEstimate: {
    distanceText: string;
    distanceMeters: number;
    durationText: string;
    durationSeconds: number;
  } | null;
  warning?: string;
}

const initialFormState: FormState = {
  restaurantName: "",
  restaurantAddressFull: "",
  customerName: "",
  customerPhone: "",
  customerAddressFull: "",
  notes: ""
};

function buildMapEmbedUrl(address: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

function buildMapLink(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export default function OrdersPage() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [orders, setOrders] = useState<ManualOrderEntry[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteEstimateResponse | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  async function submitOrder(): Promise<void> {
    setMessage("שולח...");
    const response = await fetch("/api/orders/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        ...form,
        status: "pending_dispatch",
        createdAt: new Date().toISOString()
      })
    });
    const body = await response.json();
    if (!response.ok) {
      setMessage("יצירת הזמנה נכשלה. יש למלא את כל השדות הנדרשים.");
      return;
    }
    setOrders((current) => [body.order as ManualOrderEntry, ...current]);
    setForm(initialFormState);
    setMessage("ההזמנה נשלחה לתור השיבוץ.");
  }

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]): void {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function validateAndEstimateRoute(): Promise<void> {
    if (form.restaurantAddressFull.trim().length < 5 || form.customerAddressFull.trim().length < 5) {
      setRouteInfo({
        validated: false,
        warnings: ["יש להזין כתובת מלאה למסעדה וללקוח לפני חישוב מסלול."],
        routeEstimate: null
      });
      return;
    }

    setRouteLoading(true);
    const response = await fetch("/api/maps/route-estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originAddress: form.restaurantAddressFull,
        destinationAddress: form.customerAddressFull
      })
    });
    const body = (await response.json()) as RouteEstimateResponse;
    setRouteLoading(false);
    setRouteInfo(body);
  }

  return (
    <section className="stack">
      <h1>הזמנות במצב עצמאי</h1>
      <article className="card">
        <h3>הזנת הזמנה ידנית</h3>
        <div className="form-row">
          <input
            className="input"
            placeholder="שם המסעדה"
            value={form.restaurantName}
            onChange={(event) => updateField("restaurantName", event.target.value)}
          />
          <input
            className="input"
            placeholder="כתובת מלאה של המסעדה"
            value={form.restaurantAddressFull}
            onChange={(event) => updateField("restaurantAddressFull", event.target.value)}
          />
          {form.restaurantAddressFull ? (
            <>
              <a
                className="button"
                href={buildMapLink(form.restaurantAddressFull)}
                target="_blank"
                rel="noreferrer"
                style={{ display: "inline-block" }}
              >
                פתח כתובת מסעדה בגוגל מפות
              </a>
              <iframe
                title="מפת מיקום מסעדה"
                src={buildMapEmbedUrl(form.restaurantAddressFull)}
                style={{ width: "100%", height: "220px", border: "1px solid var(--border)", borderRadius: "10px" }}
                loading="lazy"
              />
            </>
          ) : null}
          <input
            className="input"
            placeholder="שם הלקוח"
            value={form.customerName}
            onChange={(event) => updateField("customerName", event.target.value)}
          />
          <input
            className="input"
            placeholder="מספר טלפון לקוח"
            value={form.customerPhone}
            onChange={(event) => updateField("customerPhone", event.target.value)}
          />
          <input
            className="input"
            placeholder="כתובת מלאה של הלקוח"
            value={form.customerAddressFull}
            onChange={(event) => updateField("customerAddressFull", event.target.value)}
          />
          {form.customerAddressFull ? (
            <>
              <a
                className="button"
                href={buildMapLink(form.customerAddressFull)}
                target="_blank"
                rel="noreferrer"
                style={{ display: "inline-block" }}
              >
                פתח כתובת לקוח בגוגל מפות
              </a>
              <iframe
                title="מפת מיקום לקוח"
                src={buildMapEmbedUrl(form.customerAddressFull)}
                style={{ width: "100%", height: "220px", border: "1px solid var(--border)", borderRadius: "10px" }}
                loading="lazy"
              />
            </>
          ) : null}
          <textarea
            className="textarea"
            placeholder="הערות נוספות"
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
          />
          <button className="button" onClick={submitOrder}>
            שליחה לתור שיבוץ
          </button>
          <button className="button" onClick={validateAndEstimateRoute} disabled={routeLoading}>
            {routeLoading ? "בודק מסלול..." : "אימות כתובות + חישוב מסלול"}
          </button>
          {message ? <p>{message}</p> : null}
          {routeInfo?.warning ? <p style={{ color: "var(--warning)" }}>{routeInfo.warning}</p> : null}
          {routeInfo?.warnings?.length ? (
            <div className="alert-item" style={{ borderColor: "var(--warning)", color: "#ffd8a6" }}>
              {routeInfo.warnings.map((warning) => (
                <div key={warning}>אזהרה: {warning}</div>
              ))}
            </div>
          ) : null}
          {routeInfo?.routeEstimate ? (
            <div className="alert-item" style={{ borderColor: "var(--success)" }}>
              <div>מרחק: {routeInfo.routeEstimate.distanceText}</div>
              <div>זמן הגעה משוער: {routeInfo.routeEstimate.durationText}</div>
              {routeInfo.normalizedAddresses ? (
                <div style={{ color: "var(--muted)" }}>
                  מסלול: {routeInfo.normalizedAddresses.origin} -&gt; {routeInfo.normalizedAddresses.destination}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </article>
      <article className="card">
        <h3>תור הזמנות ידניות</h3>
        {orders.length === 0 ? <p>עדיין לא נשלחו הזמנות ידניות.</p> : null}
        {orders.map((order) => (
          <div key={order.id} className="alert-item">
            <strong>{order.restaurantName}</strong> - {order.customerName} ({order.customerPhone})
            <div style={{ color: "var(--muted)" }}>
              {order.restaurantAddressFull} | {order.customerAddressFull}
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap" }}>
              <a href={buildMapLink(order.restaurantAddressFull)} target="_blank" rel="noreferrer">
                מפת מסעדה
              </a>
              <a href={buildMapLink(order.customerAddressFull)} target="_blank" rel="noreferrer">
                מפת לקוח
              </a>
            </div>
            {order.notes ? <div style={{ color: "var(--muted)" }}>הערות: {order.notes}</div> : null}
          </div>
        ))}
      </article>
    </section>
  );
}
