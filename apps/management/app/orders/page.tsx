"use client";

import { useEffect, useMemo, useState } from "react";
import type { ManualOrderEntry } from "@scms/shared";
import { useMessages } from "../lib/i18n";

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
  const { t } = useMessages();
  const [city, setCity] = useState("beer_sheva");
  const [form, setForm] = useState<FormState>(initialFormState);
  const [orders, setOrders] = useState<ManualOrderEntry[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteEstimateResponse | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dispatchingOrderId, setDispatchingOrderId] = useState<string | null>(null);

  const restaurantMapAddress = useMemo(
    () => (form.restaurantAddressFull.trim() ? form.restaurantAddressFull : "באר שבע"),
    [form.restaurantAddressFull]
  );
  const customerMapAddress = useMemo(
    () => (form.customerAddressFull.trim() ? form.customerAddressFull : "אשדוד"),
    [form.customerAddressFull]
  );

  async function loadOrders(): Promise<void> {
    try {
      setOrdersLoading(true);
      const response = await fetch("/api/orders/manual");
      const body = (await response.json()) as { orders?: ManualOrderEntry[] };
      setOrders(body.orders ?? []);
    } catch {
      setMessage("טעינת ההזמנות נכשלה.");
    } finally {
      setOrdersLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  async function submitOrder(): Promise<void> {
    const missingRequiredFields =
      !form.restaurantName.trim() ||
      !form.restaurantAddressFull.trim() ||
      !form.customerName.trim() ||
      !form.customerPhone.trim() ||
      !form.customerAddressFull.trim();
    if (missingRequiredFields) {
      setMessage("יש למלא את כל השדות לפני שליחה.");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setMessage("שולח...");
    try {
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
      const body = (await response.json()) as { error?: string; order?: ManualOrderEntry };
      if (!response.ok || !body.order) {
        setMessage(`יצירת הזמנה נכשלה: ${body.error ?? "יש לבדוק תקינות נתונים ולנסות שוב."}`);
        return;
      }
      const createdOrder = body.order;
      const dispatchResponse = await fetch("/api/orders/manual/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: createdOrder.id, city })
      });
      const orderToInsert = dispatchResponse.ok ? { ...createdOrder, status: "assigned" as const } : createdOrder;
      setOrders((current) => [orderToInsert, ...current]);
      setForm(initialFormState);
      setRouteInfo(null);
      setMessage(dispatchResponse.ok ? "ההזמנה נשלחה ושובצה בהצלחה." : "ההזמנה נשלחה. שיבוץ אוטומטי נכשל, ניתן לשבץ ידנית.");
    } catch {
      setMessage("שליחת ההזמנה נכשלה. נסה שוב.");
    } finally {
      setSubmitting(false);
    }
  }

  async function dispatchOrder(orderId: string): Promise<void> {
    if (dispatchingOrderId) return;
    setDispatchingOrderId(orderId);
    setMessage("מריץ שיבוץ הזמנה...");
    try {
      const response = await fetch("/api/orders/manual/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, city })
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(`שיבוץ נכשל: ${body.error ?? "unknown error"}`);
        return;
      }
      setMessage("השיבוץ בוצע בהצלחה.");
      setOrders((current) => current.map((row) => (row.id === orderId ? { ...row, status: "assigned" } : row)));
    } catch {
      setMessage("שיבוץ נכשל עקב שגיאת רשת.");
    } finally {
      setDispatchingOrderId(null);
    }
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
    try {
      const response = await fetch("/api/maps/route-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originAddress: form.restaurantAddressFull,
          destinationAddress: form.customerAddressFull
        })
      });
      const body = (await response.json()) as RouteEstimateResponse;
      setRouteInfo(body);
    } catch {
      setRouteInfo({
        validated: false,
        warnings: ["בדיקת מסלול נכשלה. יש לנסות שוב."],
        routeEstimate: null
      });
    } finally {
      setRouteLoading(false);
    }
  }

  return (
    <section className="stack">
      <h1>{t.orders_title}</h1>
      <article className="card">
        <h3>הזנת הזמנה ידנית</h3>
        <div className="form-row">
          <label>עיר שיבוץ</label>
          <select className="select" value={city} onChange={(event) => setCity(event.target.value)}>
            <option value="beer_sheva">באר שבע</option>
            <option value="ashdod">אשדוד</option>
            <option value="tlv">תל אביב</option>
          </select>
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
          <a className="button" href={buildMapLink(restaurantMapAddress)} target="_blank" rel="noreferrer">
            פתח כתובת מסעדה בגוגל מפות
          </a>
          <iframe title="מפת מיקום מסעדה" src={buildMapEmbedUrl(restaurantMapAddress)} className="map-embed order" loading="lazy" />
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
          <a className="button" href={buildMapLink(customerMapAddress)} target="_blank" rel="noreferrer">
            פתח כתובת לקוח בגוגל מפות
          </a>
          <iframe title="מפת מיקום לקוח" src={buildMapEmbedUrl(customerMapAddress)} className="map-embed order" loading="lazy" />
          <textarea
            className="textarea"
            placeholder="הערות נוספות"
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
          />
          <button className="button" onClick={submitOrder} disabled={submitting}>
            {submitting ? "שולח..." : "שליחה לתור שיבוץ"}
          </button>
          <button className="button" onClick={validateAndEstimateRoute} disabled={routeLoading}>
            {routeLoading ? "בודק מסלול..." : "בדיקת כתובות (אופציונלי)"}
          </button>
          {message ? <p>{message}</p> : null}
          {routeInfo?.warning ? <p className="status-warning">{routeInfo.warning}</p> : null}
          {routeInfo?.warnings?.length ? (
            <div className="alert-item status-warning">
              {routeInfo.warnings.map((warning) => (
                <div key={warning}>אזהרה: {warning}</div>
              ))}
            </div>
          ) : null}
          {routeInfo?.routeEstimate ? (
            <div className="alert-item">
              <div>מרחק: {routeInfo.routeEstimate.distanceText}</div>
              <div>זמן הגעה משוער: {routeInfo.routeEstimate.durationText}</div>
              {routeInfo.normalizedAddresses ? (
                <div className="muted-text">
                  מסלול: {routeInfo.normalizedAddresses.origin} -&gt; {routeInfo.normalizedAddresses.destination}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </article>
      <article className="card">
        <h3>תור הזמנות ידניות</h3>
        {ordersLoading ? <p>טוען הזמנות...</p> : null}
        {!ordersLoading && orders.length === 0 ? <p>עדיין לא נשלחו הזמנות ידניות.</p> : null}
        {orders.map((order) => (
          <div key={order.id} className="alert-item">
            <strong>{order.restaurantName}</strong> - {order.customerName} ({order.customerPhone})
            <div className="muted-text">
              {order.restaurantAddressFull} | {order.customerAddressFull} | סטטוס: {order.status}
            </div>
            <div className="inline-actions">
              <a href={buildMapLink(order.restaurantAddressFull)} target="_blank" rel="noreferrer">
                מפת מסעדה
              </a>
              <a href={buildMapLink(order.customerAddressFull)} target="_blank" rel="noreferrer">
                מפת לקוח
              </a>
            </div>
            {order.status === "pending_dispatch" ? (
              <button
                className="button"
                onClick={() => dispatchOrder(order.id)}
                disabled={dispatchingOrderId === order.id}
              >
                {dispatchingOrderId === order.id ? "משבץ..." : "שיבוץ עכשיו"}
              </button>
            ) : null}
            {order.notes ? <div className="muted-text">הערות: {order.notes}</div> : null}
          </div>
        ))}
      </article>
    </section>
  );
}
