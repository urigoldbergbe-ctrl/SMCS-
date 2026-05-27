"use client";

import { useEffect, useMemo, useState } from "react";

const couriers = ["דניאל לוי", "מוחמד חטיב", "סרגיי פטרוב", "רון כהן"];
const restaurants = ["Campus Grill", "Burger Hub", "Pizza Station"];

type RestaurantAssignments = Record<string, string[]>;

export default function RestaurantAssignmentsPage() {
  const [assignments, setAssignments] = useState<RestaurantAssignments>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/assignments");
      const data = (await response.json()) as {
        assignments?: { restaurants?: RestaurantAssignments };
      };
      setAssignments(data.assignments?.restaurants ?? {});
    })();
  }, []);

  const hasData = useMemo(() => Object.keys(assignments).length > 0, [assignments]);

  function toggle(restaurant: string, courier: string): void {
    setAssignments((current) => {
      const assigned = current[restaurant] ?? [];
      const next = assigned.includes(courier)
        ? assigned.filter((entry) => entry !== courier)
        : [...assigned, courier];
      return { ...current, [restaurant]: next };
    });
  }

  async function save(): Promise<void> {
    setMessage("שומר...");
    const response = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignments: { restaurants: assignments } })
    });
    setMessage(response.ok ? "שיוכי המסעדות נשמרו." : "שמירת שיוכים נכשלה.");
  }

  return (
    <section className="stack">
      <h1>שיוך מסעדות</h1>
      <article className="card">
        <h3>מטריצת שיוכים</h3>
        <p>שיוך שליחים למסעדות (שליח יכול להיות משויך למספר מסעדות).</p>
        <a className="button" href="/vip-customers" style={{ display: "inline-block", marginTop: "8px" }}>
          מעבר לטאב לקוחות VIP
        </a>
        <div className="alert-list" style={{ marginTop: "8px" }}>
          {restaurants.map((restaurant) => (
            <div className="alert-item" key={restaurant}>
              <strong>{restaurant}</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "6px" }}>
                {couriers.map((courier) => (
                  <label key={`${restaurant}-${courier}`} style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={(assignments[restaurant] ?? []).includes(courier)}
                      onChange={() => toggle(restaurant, courier)}
                    />
                    {courier}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button className="button" style={{ marginTop: "10px" }} onClick={save}>
          שמירת שיוכים
        </button>
        {message ? <p>{message}</p> : null}
        {!hasData ? <p style={{ color: "var(--muted)" }}>טוען נתוני שיוך...</p> : null}
      </article>
    </section>
  );
}
