export default function AdminRegisterPage() {
  return (
    <section className="stack">
      <h1>רישום אדמין</h1>
      <article className="card">
        <div className="form-row">
          <input className="input" placeholder="טוקן הזמנה" />
          <input className="input" placeholder="אימייל" />
          <input className="input" placeholder="סיסמה" type="password" />
          <button className="button">יצירת חשבון אדמין</button>
        </div>
      </article>
    </section>
  );
}
