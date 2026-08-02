"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCard } from "@/components/AlertCard";
import { NoProfileState, useActiveProfile } from "@/hooks/useActiveProfile";

type Med = {
  id: string;
  displayName: string;
  genericName: string | null;
  dose: string | null;
  strength: string | null;
  frequency: string | null;
  status: string;
  needsReview: boolean;
  drugKey: string | null;
  indication: string | null;
  scheduleTimes: string;
};

type Drug = {
  drugKey: string;
  displayName: string;
  genericName: string;
  rxnorm: string | null;
  isOtc: boolean;
};

type Alert = {
  id: string;
  severity: string;
  title: string;
  whatText: string;
  soWhatText: string;
  nowWhatText: string;
  status: string;
};

export default function MedicationsPage() {
  const { profileId, status } = useActiveProfile();
  const [meds, setMeds] = useState<Med[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [q, setQ] = useState("");
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [selected, setSelected] = useState<Drug | null>(null);
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [schedule, setSchedule] = useState("08:00");
  const [otcDone, setOtcDone] = useState(true);
  const [blocking, setBlocking] = useState<Alert | null>(null);
  const [error, setError] = useState("");

  async function load() {
    if (!profileId) return;
    const [medRes, alertRes, profRes] = await Promise.all([
      fetch(`/api/profiles/${profileId}/medications`),
      fetch(`/api/profiles/${profileId}/alerts?refresh=1`),
      fetch(`/api/profiles/${profileId}`),
    ]);
    if (medRes.ok) {
      const data = await medRes.json();
      setMeds(data.medications);
    }
    if (alertRes.ok) {
      const data = await alertRes.json();
      setAlerts(data.alerts);
    }
    if (profRes.ok) {
      const data = await profRes.json();
      setOtcDone(data.profile.otcPromptCompleted);
    }
  }

  useEffect(() => {
    if (status !== "ready" || !profileId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, status]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch(`/api/drugs/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setDrugs(data.drugs);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const active = useMemo(() => meds.filter((m) => m.status === "active"), [meds]);

  async function addMed() {
    if (!profileId || !selected) return;
    setError("");
    const res = await fetch(`/api/profiles/${profileId}/medications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: selected.displayName,
        genericName: selected.genericName,
        drugKey: selected.drugKey,
        rxnorm: selected.rxnorm,
        dose: dose || undefined,
        strength: dose || undefined,
        frequency,
        scheduleTimes: schedule.split(",").map((s) => s.trim()).filter(Boolean),
        needsReview: false,
        source: "manual",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to add");
      return;
    }
    setAlerts(data.alerts || []);
    const serious = (data.alerts || []).find(
      (a: Alert) => a.severity === "Serious" && a.status === "open",
    );
    if (serious) setBlocking(serious);
    setSelected(null);
    setDose("");
    setQ("");
    await load();
  }

  async function stopMed(id: string) {
    if (!profileId) return;
    await fetch(`/api/profiles/${profileId}/medications/${id}`, { method: "DELETE" });
    await load();
  }

  async function completeOtc() {
    if (!profileId) return;
    await fetch(`/api/profiles/${profileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otcPromptCompleted: true }),
    });
    setOtcDone(true);
  }

  async function ack(id: string) {
    if (!profileId) return;
    await fetch(`/api/profiles/${profileId}/alerts`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertId: id, action: "acknowledge", discussedWithClinician: false }),
    });
    setBlocking(null);
    await load();
  }

  if (status === "loading") return <div className="card muted">Loading…</div>;
  if (status === "empty" || !profileId) return <NoProfileState />;

  return (
    <div className="stack">
      <div>
        <h1 style={{ marginBottom: 0 }}>Medications</h1>
        <p className="muted">Rx, OTC, vitamins, and supplements — the household source of truth.</p>
      </div>

      {!otcDone && (
        <div className="card severity-caution">
          <strong>OTC & supplement check</strong>
          <p>
            Interaction risk often hides in pain relievers, sleep aids, antacids, and herbals. Add
            them above, then confirm you&apos;ve reviewed OTCs/supplements.
          </p>
          <button className="btn btn-primary" type="button" onClick={completeOtc}>
            Mark OTC / supplement review complete
          </button>
        </div>
      )}

      <div className="grid-2">
        <section className="card stack">
          <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Add medicine</h2>
          <div>
            <label className="label">Search catalog</label>
            <input
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="warfarin, ibuprofen, melatonin…"
            />
          </div>
          <div className="stack">
            {drugs.map((d) => (
              <button
                key={d.drugKey}
                type="button"
                className="btn btn-secondary"
                style={{
                  justifyContent: "space-between",
                  borderColor: selected?.drugKey === d.drugKey ? "var(--brand)" : undefined,
                }}
                onClick={() => setSelected(d)}
              >
                <span>
                  {d.displayName}{" "}
                  <span className="muted">({d.genericName})</span>
                </span>
                {d.isOtc && <span className="badge badge-info">OTC</span>}
              </button>
            ))}
          </div>
          {selected && (
            <>
              <div>
                <label className="label">Dose / strength</label>
                <input
                  className="input"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  placeholder="5 mg"
                />
              </div>
              <div>
                <label className="label">Frequency</label>
                <select
                  className="select"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="twice daily">Twice daily</option>
                  <option value="daily at bedtime">Daily at bedtime</option>
                  <option value="as needed">As needed</option>
                </select>
              </div>
              <div>
                <label className="label">Schedule times (comma-separated HH:mm)</label>
                <input
                  className="input"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="08:00, 20:00"
                />
              </div>
              {error && <p style={{ color: "var(--serious)" }}>{error}</p>}
              <button className="btn btn-primary" type="button" onClick={addMed}>
                Save {selected.displayName}
              </button>
            </>
          )}
        </section>

        <section className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.15rem" }}>Active list ({active.length})</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Schedule</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {active.map((m) => (
                <tr key={m.id}>
                  <td>
                    <strong>{m.displayName}</strong>
                    <div className="muted" style={{ fontSize: "0.85rem" }}>
                      {m.genericName}
                      {m.dose ? ` · ${m.dose}` : ""}
                      {m.frequency ? ` · ${m.frequency}` : ""}
                      {m.needsReview ? " · needs review" : ""}
                    </div>
                  </td>
                  <td className="muted" style={{ fontSize: "0.85rem" }}>
                    {JSON.parse(m.scheduleTimes || "[]").join(", ") || "—"}
                  </td>
                  <td>
                    <button className="btn btn-secondary" type="button" onClick={() => stopMed(m.id)}>
                      Stop
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {alerts.filter((a) => a.status === "open").length > 0 && (
        <section className="stack">
          <h2 style={{ marginBottom: 0 }}>Open safety alerts</h2>
          {alerts
            .filter((a) => a.status === "open")
            .map((a) => (
              <AlertCard key={a.id} alert={a} onAcknowledge={ack} />
            ))}
        </section>
      )}

      {blocking && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(16,42,54,0.55)",
            display: "grid",
            placeItems: "center",
            padding: "1rem",
            zIndex: 50,
          }}
        >
          <div className="card severity-serious" style={{ maxWidth: 520 }}>
            <h2 style={{ marginTop: 0 }}>Serious safety alert</h2>
            <p>
              <strong>What:</strong> {blocking.whatText}
            </p>
            <p>
              <strong>So what:</strong> {blocking.soWhatText}
            </p>
            <p>
              <strong>Now what:</strong> {blocking.nowWhatText}
            </p>
            <p className="muted">
              Do not stop medicines on your own. Contact a pharmacist or clinician.
            </p>
            <button className="btn btn-primary" type="button" onClick={() => ack(blocking.id)}>
              I understand — acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
