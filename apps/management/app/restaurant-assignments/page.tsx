"use client";

import { useEffect, useState } from "react";

interface NamedEntity {
  id: string;
  name: string;
}

type RestaurantAssignmentsMap = Record<string, string[]>;

export default function RestaurantAssignmentsPage() {
  const [restaurants, setRestaurants] = useState<NamedEntity[]>([]);
  const [couriers, setCouriers] = useState<NamedEntity[]>([]);
  const [assignments, setAssignments] = useState<RestaurantAssignmentsMap>({});
  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    address: "",
    city: "באר שבע",
    priority: 2,
    ovCapPercent: 30
  });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingRestaurant, setAddingRestaurant] = useState(false);

  async function loadData(): Promise<void> {
    try {
      setLoading(true);
      const [assignmentsRes, restaurantsRes, couriersRes] = await Promise.all([
        fetch("/api/assignments"),
        fetch("/api/restaurants"),
        fetch("/api/couriers")
      ]);
      const assignmentsData = (await assignmentsRes.json()) as {
        assignments?: { restaurants?: RestaurantAssignmentsMap };
        dictionaries?: { restaurants?: NamedEntity[]; couriers?: NamedEntity[] };
      };
      const restaurantsData = (await restaurantsRes.json()) as { restaurants?: Array<NamedEntity & { address: string }> };
      const couriersData = (await couriersRes.json()) as { couriers?: Array<NamedEntity> };

      setAssignments(assignmentsData.assignments?.restaurants ?? {});
      setRestaurants(assignmentsData.dictionaries?.restaurants ?? restaurantsData.restaurants ?? []);
      setCouriers(assignmentsData.dictionaries?.couriers ?? couriersData.couriers ?? []);
    } catch {
      setMessage("טעינת נתוני שיוכים נכשלה.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

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
    if (saving) return;
    setSaving(true);
    setMessage("שומר...");
    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments: { restaurants: assignments } })
      });
      if (!response.ok) {
        setMessage("שמירת שיוכים נכשלה.");
        return;
      }
      setMessage("שיוכי המסעדות נשמרו.");
      await loadData();
    } catch {
      setMessage("שמירת שיוכים נכשלה עקב שגיאת רשת.");
    } finally {
      setSaving(false);
    }
  }

  async function addRestaurant(): Promise<void> {
    if (!restaurantForm.name.trim() || !restaurantForm.address.trim() || !restaurantForm.city.trim()) {
      setMessage("יש להשלים שם מסעדה, כתובת ועיר.");
      return;
    }
    if (addingRestaurant) return;
    setAddingRestaurant(true);
    setMessage("שומר מסעדה...");
    try {
      const response = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...restaurantForm,
          eligibleTracks: ["A1", "A2", "B"]
        })
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string; issues?: unknown };
        setMessage(`יצירת מסעדה נכשלה: ${body.error ?? "נתונים לא תקינים"}`);
        return;
      }
      setRestaurantForm({
        name: "",
        address: "",
        city: "באר שבע",
        priority: 2,
        ovCapPercent: 30
      });
      setMessage("מסעדה נוספה בהצלחה.");
      await loadData();
    } catch {
      setMessage("יצירת מסעדה נכשלה עקב שגיאת רשת.");
    } finally {
      setAddingRestaurant(false);
    }
  }

  return (
    <section className="stack">
      <h1>שיוך מסעדות</h1>
      <article className="card">
        <h3>הוספת מסעדה חדשה</h3>
        <div className="form-row">
          <input
            className="input"
            placeholder="שם מסעדה"
            value={restaurantForm.name}
            onChange={(event) => setRestaurantForm((current) => ({ ...current, name: event.target.value }))}
          />
          <input
            className="input"
            placeholder="כתובת מלאה"
            value={restaurantForm.address}
            onChange={(event) => setRestaurantForm((current) => ({ ...current, address: event.target.value }))}
          />
          <select
            className="select"
            value={restaurantForm.city}
            onChange={(event) => setRestaurantForm((current) => ({ ...current, city: event.target.value }))}
          >
            <option>באר שבע</option>
            <option>אשדוד</option>
            <option>תל אביב</option>
          </select>
          <button className="button" onClick={addRestaurant} disabled={addingRestaurant}>
            {addingRestaurant ? "מוסיף מסעדה..." : "הוספת מסעדה"}
          </button>
        </div>
      </article>
      <article className="card">
        <h3>מטריצת שיוכים</h3>
        <p>שיוך שליחים למסעדות (שליח יכול להיות משויך למספר מסעדות).</p>
        <a className="button" href="/vip-customers" style={{ display: "inline-block", marginTop: "8px" }}>
          מעבר לטאב לקוחות VIP
        </a>
        <div className="alert-list" style={{ marginTop: "8px" }}>
          {loading ? <div className="alert-item">טוען מסעדות ושיוכים...</div> : null}
          {!loading && restaurants.length === 0 ? <div className="alert-item">אין מסעדות פעילות. הוסף מסעדה כדי להתחיל.</div> : null}
          {!loading && restaurants.length > 0 && couriers.length === 0 ? (
            <div className="alert-item">אין שליחים זמינים לשיוך. יש ליצור שליחים קודם.</div>
          ) : null}
          {restaurants.map((restaurant) => (
            <div className="alert-item" key={restaurant.id}>
              <strong>{restaurant.name}</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "6px" }}>
                {couriers.map((courier) => (
                  <label
                    key={`${restaurant.id}-${courier.id}`}
                    style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}
                  >
                    <input
                      type="checkbox"
                      checked={(assignments[restaurant.id] ?? []).includes(courier.id)}
                      onChange={() => toggle(restaurant.id, courier.id)}
                    />
                    {courier.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button className="button" style={{ marginTop: "10px" }} onClick={save} disabled={saving || loading}>
          {saving ? "שומר שיוכים..." : "שמירת שיוכים"}
        </button>
        {message ? <p>{message}</p> : null}
      </article>
    </section>
  );
}
