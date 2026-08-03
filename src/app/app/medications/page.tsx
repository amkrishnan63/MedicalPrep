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
  drugClass?: string | null;
  ntiFlag?: boolean;
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
  const [saving, setSaving] = useState(false);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [customName, setCustomName] = useState("");

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
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, status]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch(
        `/api/drugs/search?q=${encodeURIComponent(q)}&limit=200`,
      );
      if (res.ok) {
        const data = await res.json();
        setDrugs(data.drugs);
        setCatalogTotal(data.total ?? data.drugs?.length ?? 0);
      }
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  const active = useMemo(() => meds.filter((m) => m.status === "active"), [meds]);
  const canSave = Boolean(selected) || Boolean(customName.trim());

  function pickDrug(d: Drug) {
    setSelected(d);
    setCustomName("");
    setError("");
  }

  async function addMed() {
    if (!profileId || !canSave || saving) return;
    const fromCatalog = Boolean(selected) && !customName.trim();
    if (fromCatalog && !selected) return;
    if (!fromCatalog && !customName.trim()) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/profiles/${profileId}/medications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: fromCatalog ? selected!.displayName : customName.trim(),
          genericName: fromCatalog ? selected!.genericName : undefined,
          drugKey: fromCatalog ? selected!.drugKey : undefined,
          rxnorm: fromCatalog ? selected!.rxnorm : undefined,
          dose: dose || undefined,
          strength: dose || undefined,
          frequency,
          scheduleTimes: schedule.split(",").map((s) => s.trim()).filter(Boolean),
          needsReview: !fromCatalog,
          source: "manual",
        }),
      });
      const data = await res.json().catch(() => ({}));
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
      setCustomName("");
      setDose("");
      setQ("");
      await load();
    } catch {
      setError("Network error — try again");
    } finally {
      setSaving(false);
    }
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
    setBlocking(null);
    await fetch(`/api/profiles/${profileId}/alerts`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertId: id, action: "acknowledge", discussedWithClinician: false }),
    });
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

      {blocking && (
        <div className="card severity-serious stack" role="alert">
          <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Serious safety alert</h2>
          <p style={{ margin: 0 }}>
            <strong>What:</strong> {blocking.whatText}
          </p>
          <p style={{ margin: 0 }}>
            <strong>So what:</strong> {blocking.soWhatText}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Now what:</strong> {blocking.nowWhatText}
          </p>
          <p className="muted" style={{ margin: 0 }}>
            Do not stop medicines on your own. Contact a pharmacist or clinician.
          </p>
          <div className="row">
            <button className="btn btn-primary" type="button" onClick={() => void ack(blocking.id)}>
              I understand — acknowledge
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => setBlocking(null)}>
              Continue editing list
            </button>
          </div>
        </div>
      )}

      {!otcDone && (
        <div className="card severity-caution">
          <strong>OTC & supplement check</strong>
          <p>
            Interaction risk often hides in pain relievers, sleep aids, antacids, and herbals. Add
            them above, then confirm you&apos;ve reviewed OTCs/supplements.
          </p>
          <button className="btn btn-primary" type="button" onClick={() => void completeOtc()}>
            Mark OTC / supplement review complete
          </button>
        </div>
      )}

      <div className="grid-2">
        <section className="card stack">
          <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Add medicine</h2>
          <div>
            <label className="label" htmlFor="drugSearch">
              Search catalog
            </label>
            <input
              id="drugSearch"
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by brand, generic, or class…"
            />
            <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.85rem" }}>
              Showing {catalogTotal} medicine{catalogTotal === 1 ? "" : "s"}
              {q.trim() ? ` matching “${q.trim()}”` : " (full catalog)"}
            </p>
          </div>

          <div
            style={{
              maxHeight: 320,
              overflow: "auto",
              border: "1px solid var(--line)",
              borderRadius: 10,
            }}
          >
            <table className="table" style={{ margin: 0 }}>
              <thead
                style={{
                  position: "sticky",
                  top: 0,
                  background: "var(--bg-elevated)",
                  zIndex: 2,
                }}
              >
                <tr>
                  <th>Brand</th>
                  <th>Generic</th>
                  <th>Class</th>
                  <th>Type</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {drugs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted">
                      No catalog matches. Use “Not in catalog” below to add a free-text medicine.
                    </td>
                  </tr>
                ) : (
                  drugs.map((d) => {
                    const activeRow = selected?.drugKey === d.drugKey;
                    return (
                      <tr
                        key={d.drugKey}
                        style={{
                          background: activeRow ? "rgba(11, 79, 108, 0.08)" : undefined,
                        }}
                      >
                        <td>
                          <strong>{d.displayName}</strong>
                        </td>
                        <td className="muted">{d.genericName}</td>
                        <td className="muted" style={{ fontSize: "0.85rem" }}>
                          {(d.drugClass || "—").replaceAll("_", " ")}
                        </td>
                        <td>
                          {d.isOtc ? (
                            <span className="badge badge-info">OTC</span>
                          ) : (
                            <span className="muted" style={{ fontSize: "0.8rem" }}>
                              Rx
                            </span>
                          )}
                          {d.ntiFlag ? (
                            <span className="badge badge-caution" style={{ marginLeft: 6 }}>
                              NTI
                            </span>
                          ) : null}
                        </td>
                        <td>
                          <button
                            className={`btn ${activeRow ? "btn-primary" : "btn-secondary"}`}
                            type="button"
                            style={{ padding: "0.4rem 0.7rem", fontSize: "0.85rem" }}
                            onClick={() => pickDrug(d)}
                          >
                            {activeRow ? "Selected" : "Select"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div>
            <label className="label" htmlFor="customMed">
              Not in catalog? Add free-text name
            </label>
            <input
              id="customMed"
              className="input"
              value={customName}
              onChange={(e) => {
                setCustomName(e.target.value);
                if (e.target.value) setSelected(null);
              }}
              placeholder="e.g. brand or generic not listed"
            />
            <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.8rem" }}>
              Free-text meds are marked needs review (no coded interaction key).
            </p>
          </div>

          <div>
            <label className="label" htmlFor="medDose">
              Dose / strength
            </label>
            <input
              id="medDose"
              className="input"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder="5 mg"
            />
          </div>
          <div>
            <label className="label" htmlFor="medFreq">
              Frequency
            </label>
            <select
              id="medFreq"
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
            <label className="label" htmlFor="medSchedule">
              Schedule times (comma-separated HH:mm)
            </label>
            <input
              id="medSchedule"
              className="input"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="08:00, 20:00"
            />
          </div>
          {error && (
            <p style={{ color: "var(--serious)", margin: 0 }} role="alert">
              {error}
            </p>
          )}
          {selected && (
            <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
              Selected: <strong>{selected.displayName}</strong> ({selected.genericName})
            </p>
          )}
          <button
            className="btn btn-primary"
            type="button"
            disabled={!canSave || saving}
            onClick={() => void addMed()}
          >
            {saving
              ? "Saving…"
              : canSave
                ? `Save ${selected?.displayName || customName.trim()}`
                : "Select a medicine to save"}
          </button>
        </section>

        <section className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.15rem" }}>Active list ({active.length})</h2>
          {active.length === 0 ? (
            <p className="muted">No active medicines yet.</p>
          ) : (
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
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => void stopMed(m.id)}
                      >
                        Stop
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
    </div>
  );
}
