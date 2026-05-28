"use client";

import { useEffect, useMemo, useState } from "react";
import { useMessages } from "../lib/i18n";

type VipStatus = "half_time" | "one_full" | "two_full";

interface VipCustomer {
  id: string;
  name: string;
  city: string;
  code: string;
  street: string;
  streetNumber: string;
  specialDirections: string;
  zone: string;
  vipStatus: VipStatus;
  contactName: string;
  contactPhone: string;
  assignedCourierIds: string[];
}

interface NamedEntity {
  id: string;
  name: string;
}

type AssignmentsMap = Record<string, string[]>;

const requiredCouriersByStatus: Record<VipStatus, number> = {
  half_time: 1,
  one_full: 1,
  two_full: 2
};

const emptyForm = {
  name: "",
  code: "",
  city: "",
  street: "",
  streetNumber: "",
  specialDirections: "",
  zone: "",
  vipStatus: "one_full" as VipStatus,
  contactName: "",
  contactPhone: ""
};

export default function VipCustomersPage() {
  const { language, t } = useMessages();
  const [vipCustomers, setVipCustomers] = useState<VipCustomer[]>([]);
  const [couriers, setCouriers] = useState<NamedEntity[]>([]);
  const [assignments, setAssignments] = useState<AssignmentsMap>({});
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  function vipStatusLabel(status: VipStatus): string {
    if (status === "half_time") return t.vip_half;
    if (status === "two_full") return t.vip_two;
    return t.vip_one;
  }

  async function loadData(): Promise<void> {
    try {
      setLoading(true);
      const [vipRes, assignmentsRes, couriersRes] = await Promise.all([
        fetch("/api/vip-customers"),
        fetch("/api/assignments"),
        fetch("/api/couriers")
      ]);
      const vipData = (await vipRes.json()) as { vipCustomers?: VipCustomer[] };
      const assignmentsData = (await assignmentsRes.json()) as {
        assignments?: { vip?: AssignmentsMap };
        dictionaries?: { couriers?: NamedEntity[] };
      };
      const couriersData = (await couriersRes.json()) as { couriers?: NamedEntity[] };
      const list = vipData.vipCustomers ?? [];
      setVipCustomers(list);
      const fromList: AssignmentsMap = {};
      for (const vip of list) fromList[vip.id] = vip.assignedCourierIds ?? [];
      setAssignments({ ...fromList, ...(assignmentsData.assignments?.vip ?? {}) });
      setCouriers(assignmentsData.dictionaries?.couriers ?? couriersData.couriers ?? []);
      setLastRefreshed(new Date().toLocaleString());
    } catch {
      setMessage(language === "he" ? "טעינת הנתונים נכשלה." : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function toggle(vipId: string, courierId: string): void {
    setAssignments((current) => {
      const assigned = current[vipId] ?? [];
      const next = assigned.includes(courierId)
        ? assigned.filter((entry) => entry !== courierId)
        : [...assigned, courierId];
      return { ...current, [vipId]: next };
    });
  }

  async function save(): Promise<void> {
    if (saving) return;
    setSaving(true);
    setMessage(t.saving);
    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments: { vip: assignments } })
      });
      if (!response.ok) {
        setMessage(language === "he" ? "שמירת שיוכים נכשלה." : "Failed to save assignments.");
        return;
      }
      setMessage(language === "he" ? "השיוכים נשמרו." : "Assignments saved.");
      await loadData();
    } catch {
      setMessage(language === "he" ? "שמירת שיוכים נכשלה." : "Failed to save assignments.");
    } finally {
      setSaving(false);
    }
  }

  async function addVip(): Promise<void> {
    if (!form.name.trim() || !form.city.trim() || !form.street.trim() || !form.streetNumber.trim()) {
      setMessage(language === "he" ? "יש למלא שם, עיר, רחוב ומספר." : "Name, city, street and number are required.");
      return;
    }
    if (adding) return;
    setAdding(true);
    setMessage(t.saving);
    try {
      const response = await fetch("/api/vip-customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setMessage(`${language === "he" ? "יצירת לקוח VIP נכשלה" : "Failed to create VIP"}: ${body.error ?? ""}`);
        return;
      }
      setForm(emptyForm);
      setMessage(language === "he" ? "לקוח VIP נוסף." : "VIP customer added.");
      await loadData();
    } catch {
      setMessage(language === "he" ? "יצירת לקוח VIP נכשלה." : "Failed to create VIP customer.");
    } finally {
      setAdding(false);
    }
  }

  const complianceRows = useMemo(
    () =>
      vipCustomers.map((vip) => {
        const assignedCount = (assignments[vip.id] ?? []).length;
        const required = requiredCouriersByStatus[vip.vipStatus];
        return { vip, assignedCount, required, compliant: assignedCount >= required };
      }),
    [vipCustomers, assignments]
  );

  return (
    <section className="stack">
      <h1>{t.vip_title}</h1>

      <article className="card">
        <h3 className="section-title">{t.vip_add}</h3>
        <div className="form-grid">
          <input className="input" placeholder={t.vip_name} value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} />
          <input className="input" placeholder={t.restaurants_code} value={form.code} onChange={(e) => setForm((c) => ({ ...c, code: e.target.value }))} />
          <input className="input" placeholder={t.city} value={form.city} onChange={(e) => setForm((c) => ({ ...c, city: e.target.value }))} />
          <input className="input" placeholder={t.restaurants_street} value={form.street} onChange={(e) => setForm((c) => ({ ...c, street: e.target.value }))} />
          <input className="input" placeholder={t.restaurants_number} value={form.streetNumber} onChange={(e) => setForm((c) => ({ ...c, streetNumber: e.target.value }))} />
          <input className="input" placeholder={t.restaurants_zone} value={form.zone} onChange={(e) => setForm((c) => ({ ...c, zone: e.target.value }))} />
          <select className="select" value={form.vipStatus} onChange={(e) => setForm((c) => ({ ...c, vipStatus: e.target.value as VipStatus }))}>
            <option value="half_time">{t.vip_half}</option>
            <option value="one_full">{t.vip_one}</option>
            <option value="two_full">{t.vip_two}</option>
          </select>
          <input className="input" placeholder={t.vip_contact} value={form.contactName} onChange={(e) => setForm((c) => ({ ...c, contactName: e.target.value }))} />
          <input className="input" placeholder={t.vip_contact_phone} value={form.contactPhone} onChange={(e) => setForm((c) => ({ ...c, contactPhone: e.target.value }))} />
          <input className="input" placeholder={t.restaurants_directions} value={form.specialDirections} onChange={(e) => setForm((c) => ({ ...c, specialDirections: e.target.value }))} />
        </div>
        <button className="button" style={{ marginTop: "10px" }} onClick={addVip} disabled={adding}>
          {adding ? t.saving : t.add}
        </button>
      </article>

      <article className="card">
        <h3 className="section-title">{t.restaurants_compliance}</h3>
        <p className="muted-text">
          {language === "he" ? "מתעדכן אוטומטית" : "Auto-updated"}
          {lastRefreshed ? ` · ${lastRefreshed}` : ""}
        </p>
        <div className="alert-list">
          {loading ? <div className="alert-item">{t.loading}</div> : null}
          {!loading && complianceRows.length === 0 ? <div className="alert-item">—</div> : null}
          {complianceRows.map(({ vip, assignedCount, required, compliant }) => (
            <div key={vip.id} className={`alert-item ${compliant ? "" : "row-alert"}`}>
              <div>
                {compliant ? "" : <span className="alert-icon">⚠ </span>}
                <strong>{vip.name}</strong>
                {vip.code ? ` · ${vip.code}` : ""} · {vip.city}
              </div>
              <div className="muted-text">
                {t.restaurants_vip_status}: {vipStatusLabel(vip.vipStatus)} · {t.restaurants_required}: {required} · {t.restaurants_assigned}: {assignedCount}
                {compliant ? "" : ` · ${t.restaurants_alert}`}
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="card">
        <h3 className="section-title">{t.restaurants_matrix}</h3>
        <div className="alert-list">
          {vipCustomers.map((vip) => (
            <div className="alert-item" key={vip.id}>
              <strong>{vip.name}</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "6px" }}>
                {couriers.length === 0 ? <span className="muted-text">—</span> : null}
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
          {saving ? t.saving : t.save}
        </button>
        {message ? <p>{message}</p> : null}
      </article>
    </section>
  );
}
