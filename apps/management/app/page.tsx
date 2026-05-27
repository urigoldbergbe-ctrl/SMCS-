const alerts = [
  "שליח C-102 לא מחובר במהלך משלוח כבר 64 שניות (אשדוד)",
  "המסעדה 'Campus Grill' הגיעה ל-82% מתקרת OV",
  "מוכנות לסיום מודל בבאר שבע: 11 מתוך 14 ימים עומדים ביעד"
];

const stalledOrders = [
  "הזמנה 4812 - התקבלה לפני 22 דקות ללא התקדמות (שליח: עומר)",
  "הזמנה 4829 - PToD צפוי מעל 60 דקות (שליח: דניאל)"
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
        <article className="card kpi">
          <h3>ממתינות לשיוך</h3>
          <p>9</p>
        </article>
        <article className="card kpi">
          <h3>שליחים בנסיעה</h3>
          <p>18</p>
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
            {alerts.map((alert) => (
              <div key={alert} className="alert-item">
                {alert}
              </div>
            ))}
            {stalledOrders.map((flag) => (
              <div key={flag} className="alert-item" style={{ borderColor: "var(--danger)", color: "#8f1f1f" }}>
                {flag}
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
