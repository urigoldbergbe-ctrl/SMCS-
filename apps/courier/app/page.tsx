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
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [eventMessages, setEventMessages] = useState<string[]>([]);
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
  const statusMessageByLanguage: Record<Language, Record<"accept" | "arrived" | "onway" | "delivered", string>> = {
    he: {
      accept: "התקבלה משימה חדשה - אשר ונווט למסעדה.",
      arrived: "הגעת לנקודת האיסוף. אמת איסוף והמשך ללקוח.",
      onway: "בדרך ללקוח. עקוב אחר המסלול בזמן אמת.",
      delivered: "המשלוח הושלם. המתן למשימה הבאה."
    },
    en: {
      accept: "New trip request received. Confirm and head to pickup.",
      arrived: "You arrived at pickup. Confirm pickup and continue to customer.",
      onway: "Heading to customer. Follow live route guidance.",
      delivered: "Delivery complete. Waiting for the next job."
    },
    ru: {
      accept: "Получен новый заказ. Подтвердите и направляйтесь к ресторану.",
      arrived: "Вы прибыли в точку забора. Подтвердите получение и выезжайте к клиенту.",
      onway: "Вы в пути к клиенту. Следуйте маршруту в реальном времени.",
      delivered: "Доставка завершена. Ожидание следующего заказа."
    },
    ar: {
      accept: "تم استلام مهمة جديدة. أكد الطلب وتوجه إلى المطعم.",
      arrived: "وصلت إلى نقطة الاستلام. أكد الاستلام وتابع إلى العميل.",
      onway: "أنت في الطريق إلى العميل. اتبع المسار المباشر.",
      delivered: "اكتمل التسليم. بانتظار المهمة التالية."
    }
  };
  const etaByLanguage: Record<Language, Record<"accept" | "arrived" | "onway" | "delivered", string>> = {
    he: { accept: "ETA למסעדה: 6 דק׳", arrived: "ביצוע איסוף", onway: "ETA ללקוח: 11 דק׳", delivered: "הושלם" },
    en: { accept: "ETA to pickup: 6 min", arrived: "Pickup in progress", onway: "ETA to dropoff: 11 min", delivered: "Completed" },
    ru: { accept: "ETA до ресторана: 6 мин", arrived: "Получение заказа", onway: "ETA до клиента: 11 мин", delivered: "Завершено" },
    ar: { accept: "وقت الوصول للمطعم: 6 د", arrived: "جاري الاستلام", onway: "وقت الوصول للعميل: 11 د", delivered: "مكتمل" }
  };
  const statusMessageByStep = statusMessageByLanguage[language];
  const etaByStep = etaByLanguage[language];

  useEffect(() => {
    const raw = localStorage.getItem(settingsKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { language?: Language };
      const nextLanguage: Language =
        parsed.language === "he" || parsed.language === "en" || parsed.language === "ru" || parsed.language === "ar"
          ? parsed.language
          : "he";
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
    setEventMessages((current) => [
      language === "he" ? "דווחה תקלה לתמיכה." : "Issue was reported to support.",
      ...current
    ]);
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
    window.location.reload();
  }

  function updateStatus(next: "accept" | "arrived" | "onway" | "delivered"): void {
    setStatusStep(next);
    setEventMessages((current) => [statusMessageByStep[next], ...current].slice(0, 5));
  }

  function enqueueOperationalIssue(issue: string): void {
    enqueueOfflineAction({
      id: crypto.randomUUID(),
      type: "problem",
      payload: { issue },
      createdAt: new Date().toISOString()
    });
    setEventMessages((current) => [issue, ...current].slice(0, 5));
  }

  return (
    <main className="courier-shell">
      <iframe title="Pickup and dropoff route map" src={mapEmbed} className="courier-map" loading="lazy" />

      <div className="courier-overlay">
        <div className={`lang-toggle-row ${language === "he" ? "align-left" : "align-right"}`}>
          <button className="lang-toggle-mobile" onClick={toggleDashboardLanguage} aria-label="Toggle courier language">
            {language === "he" ? "EN" : "HE"}
          </button>
        </div>

        <section className="top-card">
          <div className="online-chip">{shiftOnline ? t.shiftActive : t.shiftOff}</div>
          <p className="delivery-code">{deliveryCode}</p>
          <h1 className="customer-name">{customerName}</h1>
          <div className="eta-chip">{etaByStep[statusStep]}</div>
          <div className="status-row">
            <button className={`status-btn ${statusStep === "accept" ? "active" : ""}`} onClick={() => updateStatus("accept")}>
              {t.accept}
            </button>
            <button className={`status-btn ${statusStep === "arrived" ? "active" : ""}`} onClick={() => updateStatus("arrived")}>
              {t.arrived}
            </button>
            <button className={`status-btn ${statusStep === "onway" ? "active" : ""}`} onClick={() => updateStatus("onway")}>
              {t.onWay}
            </button>
            <button className={`status-btn ${statusStep === "delivered" ? "active" : ""}`} onClick={() => updateStatus("delivered")}>
              {t.delivered}
            </button>
          </div>
        </section>
      </div>

      <section className={`bottom-sheet ${sheetExpanded ? "expanded" : "collapsed"}`}>
        <button className="sheet-handle" onClick={() => setSheetExpanded((current) => !current)} aria-label="Toggle details sheet">
          <span />
        </button>
        <button className="primary" onClick={startShift}>
          {shiftOnline ? t.onShift : t.startShift}
        </button>

        <a className="nav-cta" href={wazeUrl} target="_blank" rel="noreferrer">
          {t.navigate}
        </a>

        <div className="trip-info">
          <div className="trip-row">
            <span className="dot pickup-dot" />
            <div>
              <div className="trip-label">{t.pickup}</div>
              <div className="trip-value">{pickupAddress}</div>
            </div>
          </div>
          <div className="trip-row">
            <span className="dot dropoff-dot" />
            <div>
              <div className="trip-label">{t.dropoff}</div>
              <div className="trip-value">{dropoffAddress}</div>
            </div>
          </div>
          <div className="trip-row">
            <span className="dot next-dot" />
            <div>
              <div className="trip-label">{t.nextJob}</div>
              <div className="trip-value">{nextJob}</div>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <a className="secondary" href="tel:+972501234567">
            {t.callCustomer}
          </a>
          <button className="secondary" onClick={reportProblem}>
            {t.supportChat}
          </button>
          <a className="secondary" href="/settings">
            {t.settings}
          </a>
          <button
            className="secondary"
            onClick={() =>
              enqueueOperationalIssue(language === "he" ? "לקוח לא עונה - נדרש עדכון דיספאץ׳" : "Customer not answering - dispatch update needed")
            }
          >
            {language === "he" ? "לקוח לא עונה" : "Customer Not Answering"}
          </button>
          <button
            className="secondary"
            onClick={() =>
              enqueueOperationalIssue(language === "he" ? "בעיה באיסוף מהמסעדה" : "Pickup issue at restaurant")
            }
          >
            {language === "he" ? "בעיה באיסוף" : "Pickup Issue"}
          </button>
        </div>

        <p className="muted queue-text">
          {t.offlineQueue}: {queuedCount}
        </p>
        <p className="muted queue-text">{statusMessageByStep[statusStep]}</p>
        {eventMessages.length > 0 ? (
          <div className="event-list">
            {eventMessages.map((message) => (
              <div key={message} className="event-item">
                {message}
              </div>
            ))}
          </div>
        ) : null}
        {status ? <p className="muted queue-text">{status}</p> : null}
      </section>
    </main>
  );
}
