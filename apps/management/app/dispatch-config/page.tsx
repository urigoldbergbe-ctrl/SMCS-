"use client";

import { useEffect, useState } from "react";

export default function DispatchConfigPage() {
  const [city, setCity] = useState("beer_sheva");
  const [aajlThreshold, setAajlThreshold] = useState(3);
  const [workloadMaxActiveOrders, setWorkloadMaxActiveOrders] = useState(2);
  const [workloadMaxEtaMinutes, setWorkloadMaxEtaMinutes] = useState(25);
  const [proximityMaxEtaMinutes, setProximityMaxEtaMinutes] = useState(15);
  const [safeguardTimeoutSeconds, setSafeguardTimeoutSeconds] = useState(60);
  const [maxPulledOrders, setMaxPulledOrders] = useState(2);
  const [maxPtodMinutes, setMaxPtodMinutes] = useState(60);
  const [noProgressAlertMinutes, setNoProgressAlertMinutes] = useState(20);
  const [proximityWeight, setProximityWeight] = useState(0.5);
  const [workloadWeight, setWorkloadWeight] = useState(0.35);
  const [priorityWeight, setPriorityWeight] = useState(0.15);
  const [historyWeight, setHistoryWeight] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  async function loadConfig(targetCity: string): Promise<void> {
    const response = await fetch(`/api/config?city=${encodeURIComponent(targetCity)}`);
    const body = (await response.json()) as {
      config?: {
        weights: { proximity: number; workload: number; priority: number; history: number };
        thresholds: {
          aajlThreshold: number;
          workloadMaxActiveOrders: number;
          workloadMaxEtaMinutes: number;
          proximityMaxEtaMinutes: number;
          safeguardTimeoutSeconds: number;
          maxPulledOrders: number;
          maxPtodMinutes: number;
          noProgressAlertMinutes: number;
        };
      };
    };
    if (!body.config) return;
    setAajlThreshold(body.config.thresholds.aajlThreshold);
    setWorkloadMaxActiveOrders(body.config.thresholds.workloadMaxActiveOrders);
    setWorkloadMaxEtaMinutes(body.config.thresholds.workloadMaxEtaMinutes);
    setProximityMaxEtaMinutes(body.config.thresholds.proximityMaxEtaMinutes);
    setSafeguardTimeoutSeconds(body.config.thresholds.safeguardTimeoutSeconds);
    setMaxPulledOrders(body.config.thresholds.maxPulledOrders);
    setMaxPtodMinutes(body.config.thresholds.maxPtodMinutes);
    setNoProgressAlertMinutes(body.config.thresholds.noProgressAlertMinutes);
    setProximityWeight(body.config.weights.proximity);
    setWorkloadWeight(body.config.weights.workload);
    setPriorityWeight(body.config.weights.priority);
    setHistoryWeight(body.config.weights.history);
  }

  useEffect(() => {
    void loadConfig(city);
  }, [city]);

  async function save(): Promise<void> {
    const weightSum = proximityWeight + workloadWeight + priorityWeight + historyWeight;
    if (Math.abs(weightSum - 1) > 0.0001) {
      setMessage("סכום המשקולות חייב להיות 1.0 בדיוק.");
      return;
    }

    setMessage("שומר...");
    const response = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city,
        changedBy: "operator-demo",
        changeNote: "Manual save from config UI",
        config: {
          city,
          strategicTracks: ["A1", "A2", "B"],
          checks: { checkTrackEligibility: true, checkPartnerActive: true, checkAajlThreshold: true },
          weights: {
            proximity: proximityWeight,
            workload: workloadWeight,
            priority: priorityWeight,
            history: historyWeight
          },
          thresholds: {
            aajlThreshold,
            workloadMaxActiveOrders,
            workloadMaxEtaMinutes,
            proximityMaxEtaMinutes,
            safeguardTimeoutSeconds,
            maxPulledOrders,
            maxPtodMinutes,
            noProgressAlertMinutes
          }
        }
      })
    });
    setMessage(response.ok ? "התצורה נשמרה." : "שמירת התצורה נכשלה.");
  }

  return (
    <section className="stack">
      <h1>הגדרות דיספאץ'</h1>
      <article className="card">
        <div className="form-row">
          <label>עיר</label>
          <select className="select" value={city} onChange={(event) => setCity(event.target.value)}>
            <option value="beer_sheva">באר שבע</option>
            <option value="ashdod">אשדוד</option>
            <option value="tlv">תל אביב</option>
          </select>
          <label>AAJL Threshold</label>
          <input
            className="input"
            type="number"
            min={0}
            step="0.1"
            value={aajlThreshold}
            onChange={(event) => setAajlThreshold(Number(event.target.value))}
          />
          <label>מקסימום הזמנות פעילות לשליח</label>
          <input
            className="input"
            type="number"
            min={1}
            value={workloadMaxActiveOrders}
            onChange={(event) => setWorkloadMaxActiveOrders(Number(event.target.value))}
          />
          <label>מקסימום ETA עומס בדקות</label>
          <input
            className="input"
            type="number"
            min={1}
            value={workloadMaxEtaMinutes}
            onChange={(event) => setWorkloadMaxEtaMinutes(Number(event.target.value))}
          />
          <label>מקסימום ETA קרבה בדקות</label>
          <input
            className="input"
            type="number"
            min={1}
            value={proximityMaxEtaMinutes}
            onChange={(event) => setProximityMaxEtaMinutes(Number(event.target.value))}
          />
          <label>Timeout ל-Safeguard בשניות</label>
          <input
            className="input"
            type="number"
            min={1}
            value={safeguardTimeoutSeconds}
            onChange={(event) => setSafeguardTimeoutSeconds(Number(event.target.value))}
          />
          <label>מקסימום הזמנות משוכות לשליח</label>
          <input
            className="input"
            type="number"
            min={1}
            value={maxPulledOrders}
            onChange={(event) => setMaxPulledOrders(Number(event.target.value))}
          />
          <label>מקסימום PToD בדקות</label>
          <input
            className="input"
            type="number"
            min={10}
            value={maxPtodMinutes}
            onChange={(event) => setMaxPtodMinutes(Number(event.target.value))}
          />
          <label>התראת "ללא התקדמות" בדקות</label>
          <input
            className="input"
            type="number"
            min={5}
            value={noProgressAlertMinutes}
            onChange={(event) => setNoProgressAlertMinutes(Number(event.target.value))}
          />
          <label>משקל קרבה</label>
          <input
            className="input"
            type="number"
            min={0}
            max={1}
            step="0.01"
            value={proximityWeight}
            onChange={(event) => setProximityWeight(Number(event.target.value))}
          />
          <label>משקל עומס</label>
          <input
            className="input"
            type="number"
            min={0}
            max={1}
            step="0.01"
            value={workloadWeight}
            onChange={(event) => setWorkloadWeight(Number(event.target.value))}
          />
          <label>משקל עדיפות מסעדה</label>
          <input
            className="input"
            type="number"
            min={0}
            max={1}
            step="0.01"
            value={priorityWeight}
            onChange={(event) => setPriorityWeight(Number(event.target.value))}
          />
          <label>משקל היסטוריה</label>
          <input
            className="input"
            type="number"
            min={0}
            max={1}
            step="0.01"
            value={historyWeight}
            onChange={(event) => setHistoryWeight(Number(event.target.value))}
          />
          <button className="button" onClick={save}>
            שמירת תמונת תצורה
          </button>
          <a href="/simulation" className="button">
            פתיחת סימולציה
          </a>
        </div>
        {message ? <p>{message}</p> : null}
      </article>
    </section>
  );
}
