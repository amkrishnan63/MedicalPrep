"use client";

import { useEffect, useState } from "react";
import { NoProfileState, useActiveProfile } from "@/hooks/useActiveProfile";

type Packet = {
  profileName: string;
  generatedAt: string;
  disclaimer: string;
  narrative: string;
  allergies: { substance: string; reaction: string | null; severity: string }[];
  activeMedications: {
    name: string;
    generic: string | null;
    dose: string | null;
    frequency: string | null;
    indication: string | null;
  }[];
  recentlyStopped: { name: string; stoppedAt: string | null }[];
  alerts: { severity: string; title: string; what: string; soWhat: string; nowWhat: string }[];
  questions: string[];
};

export default function VisitPacketPage() {
  const { profileId, status } = useActiveProfile();
  const [packet, setPacket] = useState<Packet | null>(null);

  useEffect(() => {
    if (status !== "ready" || !profileId) return;
    fetch(`/api/profiles/${profileId}/visit-packet?hint=Clinic%20visit`)
      .then((r) => r.json())
      .then((d) => setPacket(d.packet));
  }, [profileId, status]);

  if (status === "loading") return <div className="card muted">Loading…</div>;
  if (status === "empty" || !profileId) return <NoProfileState />;

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 style={{ marginBottom: 0 }}>Visit Packet</h1>
          <p className="muted">Appointment-ready snapshot for pharmacists and clinicians.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => window.print()}>
          Print / Save PDF
        </button>
      </div>

      {!packet ? (
        <div className="card muted">Generating…</div>
      ) : (
        <article className="card stack" id="visit-packet">
          <h2 style={{ margin: 0 }}>{packet.profileName}</h2>
          <p className="muted" style={{ margin: 0 }}>
            Generated {new Date(packet.generatedAt).toLocaleString()}
          </p>
          <p>{packet.narrative}</p>

          <section>
            <h3>Allergies</h3>
            {packet.allergies.length === 0 ? (
              <p className="muted">None recorded</p>
            ) : (
              <ul>
                {packet.allergies.map((a) => (
                  <li key={a.substance}>
                    {a.substance} — {a.severity}
                    {a.reaction ? ` (${a.reaction})` : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3>Active medications</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Dose</th>
                  <th>Frequency</th>
                  <th>Indication</th>
                </tr>
              </thead>
              <tbody>
                {packet.activeMedications.map((m) => (
                  <tr key={m.name + (m.dose || "")}>
                    <td>
                      {m.name}
                      {m.generic ? ` (${m.generic})` : ""}
                    </td>
                    <td>{m.dose || "—"}</td>
                    <td>{m.frequency || "—"}</td>
                    <td>{m.indication || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {packet.recentlyStopped.length > 0 && (
            <section>
              <h3>Recently stopped</h3>
              <ul>
                {packet.recentlyStopped.map((m) => (
                  <li key={m.name}>{m.name}</li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3>Open alerts</h3>
            {packet.alerts.length === 0 ? (
              <p className="muted">None</p>
            ) : (
              packet.alerts.map((a) => (
                <div key={a.title} className="card" style={{ marginBottom: "0.5rem" }}>
                  <strong>
                    {a.severity}: {a.title}
                  </strong>
                  <p style={{ marginBottom: 0 }}>{a.soWhat}</p>
                </div>
              ))
            )}
          </section>

          <section>
            <h3>Questions to ask</h3>
            <ol>
              {packet.questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          </section>

          <p className="muted" style={{ fontSize: "0.85rem" }}>
            {packet.disclaimer}
          </p>
        </article>
      )}
    </div>
  );
}
