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
      </article>
    </section>
  );
}
