"use client";

import { useEffect, useState } from "react";
import { useMessages } from "./lib/i18n";

interface Kpis {
  activeCouriers: number;
  inProgress: number;
  currentPtod: number;
  utilization: number;
  onRun: number;
  waiting: number;
}

interface Job {
  orderId: string;
  courier: string;
  restaurant: string;
  destination: string;
  minutesOnJob: number;
}

const defaultKpis: Kpis = {
  activeCouriers: 0,
  inProgress: 0,
  currentPtod: 0,
  utilization: 0,
  onRun: 0,
  waiting: 0
};

export default function DashboardPage() {
  const { language, t } = useMessages();
  const [kpis, setKpis] = useState<Kpis>(defaultKpis);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);
  const [mapVersion, setMapVersion] = useState(0);

  async function loadDashboard(): Promise<void> {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/dashboard");
      if (!response.ok) {
        setError(language === "he" ? "טעינת הדשבורד נכשלה." : "Failed to load dashboard data.");
        return;
      }
      const body = (await response.json()) as { kpis?: Kpis; jobs?: Job[] };
      setKpis(body.kpis ?? defaultKpis);
      setJobs(body.jobs ?? []);
      setMapError(false);
      setMapVersion((current) => current + 1);
    } catch {
      setError(language === "he" ? "טעינת הדשבורד נכשלה." : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const courierAppUrl = process.env.NEXT_PUBLIC_COURIER_APP_URL ?? "/c";
  const v = loading ? "-" : "";

  return (
    <section className="stack">
      <section className="grid">
        <article className="card kpi">
          <h3>{t.dashboard_active_couriers}</h3>
          <p>{v || kpis.activeCouriers}</p>
        </article>
        <article className="card kpi">
          <h3>{t.dashboard_in_progress}</h3>
          <p>{v || kpis.inProgress}</p>
        </article>
        <article className="card kpi">
          <h3>{t.dashboard_current_ptod}</h3>
          <p>{loading ? "-" : `${kpis.currentPtod} ${t.minutes}`}</p>
        </article>
        <article className="card kpi">
          <h3>{t.dashboard_utilization}</h3>
          <p>{loading ? "-" : `${kpis.utilization}%`}</p>
        </article>
        <article className="card kpi">
          <h3>{t.dashboard_on_run}</h3>
          <p>{v || kpis.onRun}</p>
        </article>
        <article className="card kpi">
          <h3>{t.dashboard_waiting}</h3>
          <p>{v || kpis.waiting}</p>
        </article>
      </section>

      <article className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <h3 className="section-title">{t.dashboard_map_title}</h3>
          <div className="inline-actions" style={{ marginTop: 0 }}>
            <button className="button" onClick={loadDashboard}>{t.refresh}</button>
            <a className="button" href={courierAppUrl} target="_blank" rel="noreferrer">{t.open_courier_app}</a>
          </div>
        </div>
        <div className="map-legend">
          <span className="legend-dot legend-courier" /> {t.dashboard_map_legend_courier}
          <span className="legend-dot legend-restaurant" /> {t.dashboard_map_legend_restaurant}
          <span className="legend-dot legend-vip" /> {t.dashboard_map_legend_vip}
        </div>
        {mapError ? (
          <iframe
            title={t.dashboard_map_title}
            src="https://www.google.com/maps?q=Israel&output=embed"
            className="map-embed dashboard"
            loading="lazy"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/dashboard/map?v=${mapVersion}`}
            alt={t.dashboard_map_title}
            className="map-embed dashboard"
            style={{ objectFit: "cover" }}
            onError={() => setMapError(true)}
          />
        )}
      </article>

      <article className="card">
        <h3 className="section-title">{t.dashboard_jobs_title}</h3>
        {error ? <div className="alert-item status-danger">{error}</div> : null}
        {loading ? <p>{t.loading}</p> : null}
        {!loading && jobs.length === 0 ? <p>{t.dashboard_jobs_empty}</p> : null}
        {jobs.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.dashboard_col_courier}</th>
                  <th>{t.dashboard_col_restaurant}</th>
                  <th>{t.dashboard_col_destination}</th>
                  <th>{t.dashboard_col_time}</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.orderId} className={job.minutesOnJob > 60 ? "status-danger" : ""}>
                    <td>{job.courier}</td>
                    <td>{job.restaurant}</td>
                    <td>{job.destination}</td>
                    <td>
                      {job.minutesOnJob} {t.minutes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </article>
    </section>
  );
}
