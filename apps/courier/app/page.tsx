"use client";

import { useMemo, useState } from "react";
import { enqueueOfflineAction, getOfflineQueue } from "./lib/offline-queue";

export default function CourierHomePage() {
  const [shiftOnline, setShiftOnline] = useState(false);
  const [statusStep, setStatusStep] = useState<"accept" | "arrived" | "onway" | "delivered">("accept");
  const [status, setStatus] = useState<string | null>(null);
  const queuedCount = useMemo(() => getOfflineQueue().length, [status]);
  const deliveryCode = "4821";
  const customerName = "נועה כהן";
  const pickupAddress = "דרך חברון 12, באר שבע";
  const dropoffAddress = "רחוב ירושלים 54, באר שבע";
  const nextJob = "משלוח 4833 - Burger Hub -> רגר 7";
  const wazeUrl = "https://waze.com/ul?ll=31.252973,34.791462&navigate=yes";
  const mapEmbed = `https://www.google.com/maps?q=${encodeURIComponent(
    `${pickupAddress} to ${dropoffAddress}`
  )}&output=embed`;

  function startShift(): void {
    setShiftOnline(true);
    setStatus("Shift started. Location broadcast every 30s while idle.");
  }

  function reportProblem(): void {
    enqueueOfflineAction({
      id: crypto.randomUUID(),
      type: "problem",
      payload: { issue: "restaurant_not_ready" },
      createdAt: new Date().toISOString()
    });
    setStatus("Problem queued for sync (offline safe).");
  }

  return (
    <main className="mobile">
      <section className="sticky-top card">
        <p className="delivery-code">{deliveryCode}</p>
        <h1 style={{ margin: "0 0 8px" }}>{customerName}</h1>
        <div className="status-row">
          <button className={`status-btn ${statusStep === "accept" ? "active" : ""}`} onClick={() => setStatusStep("accept")}>
            קבלת הזמנה
          </button>
          <button className={`status-btn ${statusStep === "arrived" ? "active" : ""}`} onClick={() => setStatusStep("arrived")}>
            הגעתי למסעדה
          </button>
          <button className={`status-btn ${statusStep === "onway" ? "active" : ""}`} onClick={() => setStatusStep("onway")}>
            בדרך ללקוח
          </button>
          <button className={`status-btn ${statusStep === "delivered" ? "active" : ""}`} onClick={() => setStatusStep("delivered")}>
            נמסר
          </button>
        </div>
      </section>

      <section className="card">
        <div className="status">{shiftOnline ? "משמרת פעילה" : "משמרת כבויה"}</div>
        <button className="primary" onClick={startShift} style={{ marginTop: "8px" }}>
          {shiftOnline ? "במשמרת" : "התחל משמרת"}
        </button>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>מסלול איסוף ומסירה</h2>
        <iframe title="Pickup and dropoff route map" src={mapEmbed} className="map-frame" loading="lazy" />
        <div className="action-row" style={{ marginTop: "10px" }}>
          <a className="primary" href={wazeUrl} target="_blank" rel="noreferrer" style={{ textAlign: "center" }}>
            ניווט ב-Waze
          </a>
          <div className="alert-item">
            <strong>נקודת איסוף:</strong> {pickupAddress}
          </div>
          <div className="alert-item">
            <strong>נקודת מסירה:</strong> {dropoffAddress}
          </div>
          <div className="alert-item">
            <strong>העבודה הבאה:</strong> {nextJob}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="action-row">
          <a className="secondary" href="tel:+972501234567" style={{ textAlign: "center" }}>
            התקשר ללקוח
          </a>
          <button className="secondary" onClick={reportProblem}>
            צ׳אט עם התמיכה
          </button>
          <a className="secondary" href="/settings" style={{ textAlign: "center" }}>
            הגדרות אפליקציה
          </a>
          <p className="muted">פעולות אופליין בתור: {queuedCount}</p>
        </div>
      </section>

      {status ? <section className="card">{status}</section> : null}
    </main>
  );
}
