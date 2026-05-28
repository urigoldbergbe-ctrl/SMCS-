"use client";

import { useState } from "react";
import { useMessages } from "../lib/i18n";

interface Trip {
  orderId: string;
  orderSource: string;
  track: string;
  assignedVia: string;
  courier: string;
  restaurant: string;
  dispatchTime: string;
  pickupTime: string | null;
  deliveryTime: string | null;
  ptodMinutes: number | null;
  cancelled: boolean;
  cancellationReason: string;
}

type Mode = "specific" | "range";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function TripLogPage() {
  const { language, t } = useMessages();
  const [mode, setMode] = useState<Mode>("range");
  const [specificDate, setSpecificDate] = useState(todayIso());
  const [fromDate, setFromDate] = useState(todayIso());
  const [toDate, setToDate] = useState(todayIso());
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  function resolveRange(): { from: string; to: string } {
    if (mode === "specific") {
      return { from: `${specificDate}T00:00:00.000Z`, to: `${specificDate}T23:59:59.999Z` };
    }
    return { from: `${fromDate}T00:00:00.000Z`, to: `${toDate}T23:59:59.999Z` };
  }

  async function load(): Promise<void> {
    setLoading(true);
    try {
      const { from, to } = resolveRange();
      const response = await fetch(`/api/trip-log?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      const body = (await response.json()) as { trips?: Trip[] };
      setTrips(body.trips ?? []);
      setLoaded(true);
    } catch {
      setTrips([]);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  function exportCsv(): void {
    const headers = [
      "order_id",
      "order_source",
      "courier",
      "restaurant",
      "track",
      "assigned_via",
      "dispatch_time",
      "pickup_time",
      "delivery_time",
      "ptod_minutes",
      "cancelled",
      "cancellation_reason"
    ];
    const escape = (value: string | number | boolean | null): string => {
      const text = value === null || value === undefined ? "" : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };
    const rows = trips.map((trip) =>
      [
        trip.orderId,
        trip.orderSource,
        trip.courier,
        trip.restaurant,
        trip.track,
        trip.assignedVia,
        trip.dispatchTime,
        trip.pickupTime,
        trip.deliveryTime,
        trip.ptodMinutes,
        trip.cancelled,
        trip.cancellationReason
      ]
        .map(escape)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trip-log-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="stack">
      <h1>{t.triplog_title}</h1>

      <article className="card">
        <div className="form-grid">
          <select className="select" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            <option value="specific">{t.triplog_mode_specific}</option>
            <option value="range">{t.triplog_mode_range}</option>
          </select>
          {mode === "specific" ? (
            <input className="input" type="date" value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} />
          ) : (
            <>
              <input className="input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} aria-label={t.triplog_from} />
              <input className="input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} aria-label={t.triplog_to} />
            </>
          )}
        </div>
        <div className="inline-actions">
          <button className="button" onClick={load} disabled={loading}>
            {loading ? t.loading : t.triplog_apply}
          </button>
          <button className="button" onClick={exportCsv} disabled={trips.length === 0}>
            {t.triplog_export_csv}
          </button>
        </div>
      </article>

      <article className="card">
        {loading ? <p>{t.loading}</p> : null}
        {!loading && loaded && trips.length === 0 ? <p>{t.triplog_empty}</p> : null}
        {trips.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.dashboard_col_courier}</th>
                  <th>{t.dashboard_col_restaurant}</th>
                  <th>{language === "he" ? "שיבוץ" : "Dispatch"}</th>
                  <th>{language === "he" ? "איסוף" : "Pickup"}</th>
                  <th>{language === "he" ? "מסירה" : "Delivery"}</th>
                  <th>PToD</th>
                  <th>{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => (
                  <tr key={`${trip.orderId}-${trip.dispatchTime}`} className={trip.cancelled ? "status-danger" : ""}>
                    <td>{trip.courier}</td>
                    <td>{trip.restaurant}</td>
                    <td>{formatTime(trip.dispatchTime)}</td>
                    <td>{formatTime(trip.pickupTime)}</td>
                    <td>{formatTime(trip.deliveryTime)}</td>
                    <td>{trip.ptodMinutes ?? "—"}</td>
                    <td>{trip.cancelled ? (language === "he" ? "בוטל" : "Cancelled") : trip.deliveryTime ? (language === "he" ? "נמסר" : "Delivered") : language === "he" ? "פעיל" : "Active"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </article>
    </section>
  );
}
