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

type Language = "he" | "en";

const textByLanguage: Record<
  Language,
  {
    banner: string;
    activeCouriers: string;
    activeOrders: string;
    currentAajl: string;
    utilization: string;
    pending: string;
    onRun: string;
    realtimeMap: string;
    realtimeMapDesc: string;
    engineHealthy: string;
    runSimulation: string;
    openCourierApp: string;
    alerts: string;
    noAlerts: string;
    highPtodPrefix: string;
    noProgressPrefix: string;
  }
> = {
  he: {
    banner: "מצב אינטגרטיבי פעיל - העברת מיקום כפולה פעילה",
    activeCouriers: "שליחים פעילים",
    activeOrders: "הזמנות בביצוע",
    currentAajl: "AAJL נוכחי",
    utilization: "ניצול צי אסטרטגי",
    pending: "ממתינות לשיוך",
    onRun: "שליחים בנסיעה",
    realtimeMap: "מפת צי בזמן אמת",
    realtimeMapDesc: "תצוגת מפה חיה (Google Maps). כאן יופיעו סמני שליחים ושכבות סטטוס.",
    engineHealthy: "מנוע השיבוץ תקין",
    runSimulation: "הרץ סימולציה עכשיו (באר שבע)",
    openCourierApp: "פתח את אפליקציית השליחים",
    alerts: "התראות",
    noAlerts: "אין חריגות כרגע.",
    highPtodPrefix: "הזמנה",
    noProgressPrefix: "הזמנה"
  },
  en: {
    banner: "Integrated mode active - dual location broadcasting enabled",
    activeCouriers: "Active Couriers",
    activeOrders: "Orders In Progress",
    currentAajl: "Current AAJL",
    utilization: "Strategic Fleet Utilization",
    pending: "Waiting For Assignment",
    onRun: "Couriers On Run",
    realtimeMap: "Real-Time Fleet Map",
    realtimeMapDesc: "Live Google Maps view with courier markers and status layers.",
    engineHealthy: "Dispatch engine healthy",
    runSimulation: "Run Simulation Now (Beer Sheva)",
    openCourierApp: "Open Courier App",
    alerts: "Alerts",
    noAlerts: "No active exceptions.",
    highPtodPrefix: "Order",
    noProgressPrefix: "Order"
  }
};

export default function DashboardPage() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(defaultSnapshot);
  const [language, setLanguage] = useState<Language>("he");
  const t = textByLanguage[language];

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/dashboard");
      if (!response.ok) return;
      const body = (await response.json()) as DashboardSnapshot;
      setSnapshot(body);
    })();

    const raw = localStorage.getItem("management_ui_settings");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { language?: Language };
      setLanguage(parsed.language === "en" ? "en" : "he");
    } catch {
      // keep default
    }
  }, []);

  return (
    <>
      <div className="banner">{t.banner}</div>

      <section className="grid">
        <article className="card kpi">
          <h3>{t.activeCouriers}</h3>
          <p>37</p>
        </article>
        <article className="card kpi">
          <h3>{t.activeOrders}</h3>
          <p>24</p>
        </article>
        <article className="card kpi">
          <h3>{t.currentAajl}</h3>
          <p>3.4</p>
        </article>
        <article className="card kpi">
          <h3>{t.utilization}</h3>
          <p>61%</p>
        </article>
        <article className="card kpi">
          <h3>{t.pending}</h3>
          <p>{snapshot.pendingAssignment}</p>
        </article>
        <article className="card kpi">
          <h3>{t.onRun}</h3>
          <p>{snapshot.couriersOnRun}</p>
        </article>

        <article className="card wide">
          <h3>{t.realtimeMap}</h3>
          <p style={{ color: "var(--muted)" }}>{t.realtimeMapDesc}</p>
          <div className="tag success">{t.engineHealthy}</div>
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
              {t.runSimulation}
            </a>
            <a className="button" href="/c">
              {t.openCourierApp}
            </a>
          </div>
        </article>

        <article className="card feed">
          <h3>{t.alerts}</h3>
          <div className="alert-list">
            {snapshot.highPtodOrders.length === 0 && snapshot.noProgressOrders.length === 0 ? (
              <div className="alert-item">{t.noAlerts}</div>
            ) : null}
            {snapshot.highPtodOrders.map((item) => (
              <div key={item.orderId} className="alert-item" style={{ borderColor: "var(--danger)", color: "#8f1f1f" }}>
                {t.highPtodPrefix} {item.orderId} {language === "he" ? "מסומנת PToD גבוה:" : "flagged for high PToD:"}{" "}
                {Math.round(item.ptodMinutes)} {language === "he" ? "דקות" : "minutes"}
              </div>
            ))}
            {snapshot.noProgressOrders.map((item) => (
              <div key={item.orderId} className="alert-item" style={{ borderColor: "var(--danger)", color: "#8f1f1f" }}>
                {t.noProgressPrefix} {item.orderId}{" "}
                {language === "he" ? "ללא התקדמות כבר" : "has no progress for"} {item.minutesWithoutProgress}{" "}
                {language === "he" ? "דקות" : "minutes"}
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
