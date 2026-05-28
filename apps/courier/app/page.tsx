"use client";

import { useEffect, useMemo, useState } from "react";
import { enqueueOfflineAction, getOfflineQueue } from "./lib/offline-queue";

type Language = "he" | "en" | "ru" | "ar";

const settingsKey = "courier_app_settings";

const textByLanguage: Record<
  Language,
  {
    accept: string;
    arrived: string;
    onWay: string;
    delivered: string;
    shiftActive: string;
    shiftOff: string;
    onShift: string;
    startShift: string;
    routeTitle: string;
    navigate: string;
    pickup: string;
    dropoff: string;
    nextJob: string;
    callCustomer: string;
    supportChat: string;
    settings: string;
    offlineQueue: string;
  }
> = {
  he: {
    accept: "קבלת הזמנה",
    arrived: "הגעתי למסעדה",
    onWay: "בדרך ללקוח",
    delivered: "נמסר",
    shiftActive: "משמרת פעילה",
    shiftOff: "משמרת כבויה",
    onShift: "במשמרת",
    startShift: "התחל משמרת",
    routeTitle: "מסלול איסוף ומסירה",
    navigate: "ניווט ב-Waze",
    pickup: "נקודת איסוף",
    dropoff: "נקודת מסירה",
    nextJob: "העבודה הבאה",
    callCustomer: "התקשר ללקוח",
    supportChat: "צ׳אט עם התמיכה",
    settings: "הגדרות אפליקציה",
    offlineQueue: "פעולות אופליין בתור"
  },
  en: {
    accept: "Accept Order",
    arrived: "Arrived at Restaurant",
    onWay: "On the Way to Customer",
    delivered: "Delivered",
    shiftActive: "Shift Online",
    shiftOff: "Shift Offline",
    onShift: "On Shift",
    startShift: "Start Shift",
    routeTitle: "Pickup and Dropoff Route",
    navigate: "Navigate with Waze",
    pickup: "Pickup Location",
    dropoff: "Dropoff Location",
    nextJob: "Next Job",
    callCustomer: "Call Customer",
    supportChat: "Chat with Support",
    settings: "App Settings",
    offlineQueue: "Offline queued actions"
  },
  ru: {
    accept: "Принять заказ",
    arrived: "Прибыл в ресторан",
    onWay: "Еду к клиенту",
    delivered: "Доставлено",
    shiftActive: "Смена активна",
    shiftOff: "Смена выключена",
    onShift: "На смене",
    startShift: "Начать смену",
    routeTitle: "Маршрут доставки",
    navigate: "Навигация в Waze",
    pickup: "Точка забора",
    dropoff: "Точка доставки",
    nextJob: "Следующий заказ",
    callCustomer: "Позвонить клиенту",
    supportChat: "Чат с поддержкой",
    settings: "Настройки приложения",
    offlineQueue: "Действий офлайн в очереди"
  },
  ar: {
    accept: "قبول الطلب",
    arrived: "وصلت إلى المطعم",
    onWay: "في الطريق إلى العميل",
    delivered: "تم التسليم",
    shiftActive: "الوردية فعالة",
    shiftOff: "الوردية غير فعالة",
    onShift: "على الوردية",
    startShift: "ابدأ الوردية",
    routeTitle: "مسار الاستلام والتسليم",
    navigate: "تنقل عبر Waze",
    pickup: "موقع الاستلام",
    dropoff: "موقع التسليم",
    nextJob: "المهمة التالية",
    callCustomer: "اتصل بالعميل",
    supportChat: "دردشة مع الدعم",
    settings: "إعدادات التطبيق",
    offlineQueue: "إجراءات أوفلاين في الطابور"
  }
};

export default function CourierHomePage() {
  const [shiftOnline, setShiftOnline] = useState(false);
  const [statusStep, setStatusStep] = useState<"accept" | "arrived" | "onway" | "delivered">("accept");
  const [language, setLanguage] = useState<Language>("he");
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
  const t = textByLanguage[language];

  useEffect(() => {
    const raw = localStorage.getItem(settingsKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { language?: Language };
      const nextLanguage = parsed.language ?? "he";
      setLanguage(nextLanguage);
      document.documentElement.lang = nextLanguage;
      document.documentElement.dir = nextLanguage === "he" || nextLanguage === "ar" ? "rtl" : "ltr";
    } catch {
      // ignore malformed settings and keep defaults
    }
  }, []);

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

  function toggleDashboardLanguage(): void {
    const nextLanguage: Language = language === "he" ? "en" : "he";
    const raw = localStorage.getItem(settingsKey);
    let appearance = "light";
    try {
      const parsed = raw ? (JSON.parse(raw) as { appearance?: string }) : {};
      appearance = parsed.appearance ?? "light";
    } catch {
      appearance = "light";
    }
    localStorage.setItem(settingsKey, JSON.stringify({ language: nextLanguage, appearance }));
    setLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage;
    document.documentElement.dir = nextLanguage === "he" ? "rtl" : "ltr";
  }

  return (
    <main className="mobile">
      <div className={`lang-toggle-row ${language === "he" ? "align-left" : "align-right"}`}>
        <button className="lang-toggle-mobile" onClick={toggleDashboardLanguage} aria-label="Toggle courier language">
          {language === "he" ? "EN" : "HE"}
        </button>
      </div>
      <section className="sticky-top card">
        <p className="delivery-code">{deliveryCode}</p>
        <h1 style={{ margin: "0 0 8px" }}>{customerName}</h1>
        <div className="status-row">
          <button className={`status-btn ${statusStep === "accept" ? "active" : ""}`} onClick={() => setStatusStep("accept")}>
            {t.accept}
          </button>
          <button className={`status-btn ${statusStep === "arrived" ? "active" : ""}`} onClick={() => setStatusStep("arrived")}>
            {t.arrived}
          </button>
          <button className={`status-btn ${statusStep === "onway" ? "active" : ""}`} onClick={() => setStatusStep("onway")}>
            {t.onWay}
          </button>
          <button className={`status-btn ${statusStep === "delivered" ? "active" : ""}`} onClick={() => setStatusStep("delivered")}>
            {t.delivered}
          </button>
        </div>
      </section>

      <section className="card">
        <div className="status">{shiftOnline ? t.shiftActive : t.shiftOff}</div>
        <button className="primary" onClick={startShift} style={{ marginTop: "8px" }}>
          {shiftOnline ? t.onShift : t.startShift}
        </button>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>{t.routeTitle}</h2>
        <iframe title="Pickup and dropoff route map" src={mapEmbed} className="map-frame" loading="lazy" />
        <div className="action-row" style={{ marginTop: "10px" }}>
          <a className="primary" href={wazeUrl} target="_blank" rel="noreferrer" style={{ textAlign: "center" }}>
            {t.navigate}
          </a>
          <div className="alert-item">
            <strong>{t.pickup}:</strong> {pickupAddress}
          </div>
          <div className="alert-item">
            <strong>{t.dropoff}:</strong> {dropoffAddress}
          </div>
          <div className="alert-item">
            <strong>{t.nextJob}:</strong> {nextJob}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="action-row">
          <a className="secondary" href="tel:+972501234567" style={{ textAlign: "center" }}>
            {t.callCustomer}
          </a>
          <button className="secondary" onClick={reportProblem}>
            {t.supportChat}
          </button>
          <a className="secondary" href="/settings" style={{ textAlign: "center" }}>
            {t.settings}
          </a>
          <p className="muted">
            {t.offlineQueue}: {queuedCount}
          </p>
        </div>
      </section>

      {status ? <section className="card">{status}</section> : null}
    </main>
  );
}
