"use client";

import { useEffect, useState } from "react";

interface NamedEntity {
  id: string;
  name: string;
}

interface VipEntity extends NamedEntity {
  city: string;
  contactName: string;
  contactPhone: string;
}

type VipAssignmentsMap = Record<string, string[]>;

export default function VipCustomersPage() {
  const [vipCustomers, setVipCustomers] = useState<VipEntity[]>([]);
  const [couriers, setCouriers] = useState<NamedEntity[]>([]);
  const [assignments, setAssignments] = useState<VipAssignmentsMap>({});
  const [form, setForm] = useState({ name: "", city: "באר שבע", contactName: "", contactPhone: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingVip, setAddingVip] = useState(false);

  async function loadData(): Promise<void> {
    try {
      setLoading(true);
      const [assignmentsRes, vipRes, couriersRes] = await Promise.all([
        fetch("/api/assignments"),
        fetch("/api/vip-customers"),
        fetch("/api/couriers")
      ]);
      const assignmentsData = (await assignmentsRes.json()) as {
        assignments?: { vip?: VipAssignmentsMap };
        dictionaries?: { couriers?: NamedEntity[] };
      };
      const vipData = (await vipRes.json()) as { vipCustomers?: VipEntity[] };
      const couriersData = (await couriersRes.json()) as { couriers?: NamedEntity[] };
      setAssignments(assignmentsData.assignments?.vip ?? {});
      setVipCustomers(vipData.vipCustomers ?? []);
      setCouriers(assignmentsData.dictionaries?.couriers ?? couriersData.couriers ?? []);
    } catch {
      setMessage("טעינת נתוני VIP נכשלה.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

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
    if (saving) return;
    setSaving(true);
    setMessage("שומר...");
    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments: { vip: assignments } })
      });
      if (!response.ok) {
        setMessage("שמירת שיוכי VIP נכשלה.");
        return;
      }
      setMessage("שיוכי לקוחות VIP נשמרו.");
      await loadData();
    } catch {
      setMessage("שמירת שיוכי VIP נכשלה עקב שגיאת רשת.");
    } finally {
      setSaving(false);
    }
  }

  async function addVip(): Promise<void> {
    if (!form.name.trim() || !form.contactName.trim() || !form.contactPhone.trim()) {
      setMessage("יש למלא שם לקוח, איש קשר וטלפון.");
      return;
    }
    if (addingVip) return;
    setAddingVip(true);
    setMessage("שומר לקוח VIP...");
    try {
      const response = await fetch("/api/vip-customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setMessage(`יצירת לקוח VIP נכשלה: ${body.error ?? "נתונים לא תקינים"}`);
        return;
      }
      setForm({ name: "", city: "באר שבע", contactName: "", contactPhone: "" });
      setMessage("לקוח VIP נוסף בהצלחה.");
      await loadData();
    } catch {
      setMessage("יצירת לקוח VIP נכשלה עקב שגיאת רשת.");
    } finally {
      setAddingVip(false);
    }
  }

  return (
    <section className="stack">
      <h1>לקוחות VIP</h1>
      <article className="card">
        <h3>הוספת לקוח VIP</h3>
        <div className="form-row">
          <input
            className="input"
            placeholder="שם לקוח"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          <select
            className="select"
            value={form.city}
            onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
          >
            <option>באר שבע</option>
            <option>אשדוד</option>
            <option>תל אביב</option>
          </select>
          <input
            className="input"
            placeholder="איש קשר"
            value={form.contactName}
            onChange={(event) => setForm((current) => ({ ...current, contactName: event.target.value }))}
          />
          <input
            className="input"
            placeholder="טלפון איש קשר"
            value={form.contactPhone}
            onChange={(event) => setForm((current) => ({ ...current, contactPhone: event.target.value }))}
          />
          <button className="button" onClick={addVip} disabled={addingVip}>
            {addingVip ? "מוסיף לקוח VIP..." : "הוספת לקוח VIP"}
          </button>
        </div>
      </article>
      <article className="card">
        <h3>שיוך שליחים ללקוחות VIP</h3>
        <p>כל לקוח VIP יכול לקבל שליחים ייעודיים עם SLA מחמיר.</p>
        <div className="alert-list" style={{ marginTop: "8px" }}>
          {loading ? <div className="alert-item">טוען לקוחות VIP...</div> : null}
          {!loading && vipCustomers.length === 0 ? <div className="alert-item">אין לקוחות VIP. הוסף לקוח חדש כדי להתחיל.</div> : null}
          {!loading && vipCustomers.length > 0 && couriers.length === 0 ? (
            <div className="alert-item">אין שליחים זמינים לשיוך VIP. יש ליצור שליחים קודם.</div>
          ) : null}
          {vipCustomers.map((vip) => (
            <div key={vip.id} className="alert-item">
              <div>
                <strong>{vip.name}</strong> | עיר: {vip.city} | איש קשר: {vip.contactName || "לא הוגדר"}
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "6px" }}>
                {couriers.map((courier) => (
                  <label key={`${vip.id}-${courier.id}`} style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={(assignments[vip.id] ?? []).includes(courier.id)}
                      onChange={() => toggle(vip.id, courier.id)}
                    />
                    {courier.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button className="button" style={{ marginTop: "10px" }} onClick={save} disabled={saving || loading}>
          {saving ? "שומר שיוכי VIP..." : "שמירת שיוכים ל-VIP"}
        </button>
        {message ? <p>{message}</p> : null}
      </article>
    </section>
  );
}
