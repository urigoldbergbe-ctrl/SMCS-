export default function CouriersPage() {
  return (
    <section className="stack">
      <h1>שליחים</h1>
      <article className="card">
        <h3>הוספת שליח</h3>
        <div className="form-row">
          <input className="input" placeholder="שם מלא" />
          <input className="input" placeholder="מספר טלפון" />
          <select className="select">
            <option>באר שבע</option>
            <option>אשדוד</option>
            <option>תל אביב</option>
          </select>
          <button className="button">יצירת שליח ושליחת קישור התחברות</button>
        </div>
      </article>
      <article className="card">
        <h3>רשימת שליחים</h3>
        <p>סינון, פעולות מרובות, ניהול משמרת וניתוח ביצועים דינמי זמינים במודול זה.</p>
        <div className="alert-list" style={{ marginTop: "10px" }}>
          <div className="alert-item">
            <strong>דניאל לוי</strong> | משלוחים: 42 | בעיות: לקוח לא קיבל הזמנה (1), PToD גבוה ב-18% (3)
          </div>
          <div className="alert-item">
            <strong>מוחמד חטיב</strong> | משלוחים: 37 | בעיות: לקוח לא ענה (2), PToD גבוה ב-11% (2)
          </div>
          <div className="alert-item">
            <strong>סרגיי פטרוב</strong> | משלוחים: 31 | בעיות: איסוף התעכב במסעדה (4)
          </div>
        </div>
      </article>
    </section>
  );
}
