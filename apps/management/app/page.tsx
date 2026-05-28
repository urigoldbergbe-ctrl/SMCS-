"use client";

import { useEffect, useState } from "react";

interface DashboardSnapshot {
  pendingAssignment: number;
  couriersOnRun: number;
  highPtodOrders: Array<{ orderId: string; ptodMinutes: number }>;
  noProgressOrders: Array<{ orderId: string; minutesWithoutProgress: number }>;
}

const defaultSnapshot: DashboardSnapshot = {
  pendingAssignment: 0,
  couriersOnRun: 0,
  highPtodOrders: [],
  noProgressOrders: []
};

export default function DashboardPage() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(defaultSnapshot);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/dashboard");
      if (!response.ok) return;
      const body = (await response.json()) as DashboardSnapshot;
      setSnapshot(body);
    })();
  }, []);

  return (
    <>
      <div className="banner">מצב אינטגרטיבי פעיל - העברת מיקום כפולה פעילה</div>

      <section className="grid">
        <article className="card kpi">
          <h3>שליחים פעילים</h3>
          <p>37</p>
        </article>
        <article className="card kpi">
          <h3>הזמנות בביצוע</h3>
          <p>24</p>
        </article>
        <article className="card kpi">
          <h3>AAJL נוכחי</h3>
          <p>3.4</p>
        </article>
        <article className="card kpi">
          <h3>ניצול צי אסטרטגי</h3>
          <p>61%</p>
        </article>
        <article className="card kpi">
          <h3>ממתינות לשיוך</h3>
          <p>{snapshot.pendingAssignment}</p>
        </article>
        <article className="card kpi">
          <h3>שליחים בנסיעה</h3>
          <p>{snapshot.couriersOnRun}</p>
        </article>

        <article className="card wide">
          <h3>מפת צי בזמן אמת</h3>
          <p style={{ color: "var(--muted)" }}>
            תצוגת מפה חיה (Google Maps). כאן יופיעו סמני שליחים ושכבות סטטוס.
          </p>
          <div className="tag success">מנוע השיבוץ תקין</div>
          <iframe
            title="מפת צי בזמן אמת"
            src="https://www.google.com/maps?q=Beer+Sheva&output=embed"
            style={{ width: "100%", height: "280px", border: "1px solid var(--border)", borderRadius: "10px", marginTop: "10px" }}
            loading="lazy"
          />
          <div style={{ marginTop: "12px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a
              className="button"
              href="/simulation?city=beer_sheva&fleetSize=12&datasetType=what_if"
              style={{ display: "inline-block" }}
            >
              הרץ סימולציה עכשיו (באר שבע)
            </a>
            <a className="button" href="/c">
              פתח את אפליקציית השליחים
            </a>
          </div>
        </article>

        <article className="card feed">
          <h3>התראות</h3>
          <div className="alert-list">
            {snapshot.highPtodOrders.length === 0 && snapshot.noProgressOrders.length === 0 ? (
              <div className="alert-item">אין חריגות כרגע.</div>
            ) : null}
            {snapshot.highPtodOrders.map((item) => (
              <div key={item.orderId} className="alert-item" style={{ borderColor: "var(--danger)", color: "#8f1f1f" }}>
                הזמנה {item.orderId} מסומנת PToD גבוה: {Math.round(item.ptodMinutes)} דקות
              </div>
            ))}
            {snapshot.noProgressOrders.map((item) => (
              <div key={item.orderId} className="alert-item" style={{ borderColor: "var(--danger)", color: "#8f1f1f" }}>
                הזמנה {item.orderId} ללא התקדמות כבר {item.minutesWithoutProgress} דקות
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
