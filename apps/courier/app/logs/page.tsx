const deliveryLog = [
  "4821 | נמסר בהצלחה | PToD 34 דק׳",
  "4819 | לקוח לא ענה | הועבר לתמיכה",
  "4817 | נמסר בהצלחה | PToD 29 דק׳"
];

export default function DeliveryLogsPage() {
  return (
    <main className="mobile">
      <section className="card">
        <h1 className="page-title">יומן משלוחים</h1>
        <div className="alert-list">
          {deliveryLog.map((row) => (
            <div key={row} className="alert-item">
              {row}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
