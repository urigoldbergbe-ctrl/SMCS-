"use client";

import { useMemo, useState } from "react";
import { enqueueOfflineAction, getOfflineQueue } from "./lib/offline-queue";

export default function CourierHomePage() {
  const [shiftOnline, setShiftOnline] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const queuedCount = useMemo(() => getOfflineQueue().length, [status]);

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
      <section className="card">
        <div className="status">{shiftOnline ? "Shift Online" : "Shift Offline"}</div>
        <h1>Good afternoon, Daniel</h1>
        <p className="muted">Assigned restaurants: Burger Hub, Campus Grill</p>
        <button className="primary" onClick={startShift}>
          {shiftOnline ? "On Shift" : "Start Shift"}
        </button>
      </section>

      <section className="card">
        <h2>Awaiting Assignment</h2>
        <p className="muted">
          New strategic orders will appear here. Keep location services and notifications enabled.
        </p>
        <button className="secondary" onClick={reportProblem}>
          I Have a Problem
        </button>
      </section>

      <section className="card">
        <h3>Quick Actions</h3>
        <p className="muted">Restaurant not ready / Can't find address / Customer not answering</p>
        <p className="muted">Queued offline actions: {queuedCount}</p>
      </section>
      {status ? <section className="card">{status}</section> : null}
    </main>
  );
}
