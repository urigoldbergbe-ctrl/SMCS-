const alerts = [
  "שליח C-102 לא מחובר במהלך משלוח כבר 64 שניות (אשדוד)",
  "המסעדה 'Campus Grill' הגיעה ל-82% מתקרת OV",
  "מוכנות לסיום מודל בבאר שבע: 11 מתוך 14 ימים עומדים ביעד"
];

export default function DashboardPage() {
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

        <article className="card wide">
          <h3>מפת צי בזמן אמת</h3>
          <p style={{ color: "var(--muted)" }}>
            תצוגת מפה חיה (Google Maps). כאן יופיעו סמני שליחים ושכבות סטטוס.
          </p>
          <div className="tag success">מנוע השיבוץ תקין</div>
          <div style={{ marginTop: "12px" }}>
            <a
              className="button"
              href="/simulation?city=beer_sheva&fleetSize=12&datasetType=what_if"
              style={{ display: "inline-block" }}
            >
              הרץ סימולציה עכשיו (באר שבע)
            </a>
          </div>
        </article>

        <article className="card feed">
          <h3>התראות</h3>
          <div className="alert-list">
            {alerts.map((alert) => (
              <div key={alert} className="alert-item">
                {alert}
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
