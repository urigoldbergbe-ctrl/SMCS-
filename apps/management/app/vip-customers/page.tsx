"use client";

import { useEffect, useMemo, useState } from "react";

const vipCustomers = [
  { name: "חברת אינטל", city: "באר שבע", monthlyOrders: 120 },
  { name: "Global Tech HQ", city: "תל אביב", monthlyOrders: 88 },
  { name: "משרד עורכי דין לוין", city: "אשדוד", monthlyOrders: 54 }
];

const couriers = ["דניאל לוי", "מוחמד חטיב", "סרגיי פטרוב", "רון כהן"];

type VipAssignments = Record<string, string[]>;

export default function VipCustomersPage() {
  const [assignments, setAssignments] = useState<VipAssignments>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/assignments");
      const data = (await response.json()) as {
        assignments?: { vip?: VipAssignments };
      };
      setAssignments(data.assignments?.vip ?? {});
    })();
  }, []);

  const hasData = useMemo(() => Object.keys(assignments).length > 0, [assignments]);

  function toggle(vipName: string, courier: string): void {
    setAssignments((current) => {
      const assigned = current[vipName] ?? [];
      const next = assigned.includes(courier)
        ? assigned.filter((entry) => entry !== courier)
        : [...assigned, courier];
      return { ...current, [vipName]: next };
    });
  }

  async function save(): Promise<void> {
    setMessage("שומר...");
    const response = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignments: { vip: assignments } })
    });
    setMessage(response.ok ? "שיוכי לקוחות VIP נשמרו." : "שמירת שיוכי VIP נכשלה.");
  }

  return (
    <section className="stack">
      <h1>לקוחות VIP</h1>
      <article className="card">
        <h3>שיוך שליחים ללקוחות VIP</h3>
        <p>כל לקוח VIP יכול לקבל שליחים ייעודיים עם SLA מחמיר.</p>
        <div className="alert-list" style={{ marginTop: "8px" }}>
          {vipCustomers.map((vip) => (
            <div key={vip.name} className="alert-item">
              <div>
                <strong>{vip.name}</strong> | עיר: {vip.city} | הזמנות חודשיות: {vip.monthlyOrders}
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "6px" }}>
                {couriers.map((courier) => (
                  <label key={`${vip.name}-${courier}`} style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={(assignments[vip.name] ?? []).includes(courier)}
                      onChange={() => toggle(vip.name, courier)}
                    />
                    {courier}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button className="button" style={{ marginTop: "10px" }} onClick={save}>
          שמירת שיוכים ל-VIP
        </button>
        {message ? <p>{message}</p> : null}
        {!hasData ? <p style={{ color: "var(--muted)" }}>טוען נתוני שיוך...</p> : null}
      </article>
    </section>
  );
}
