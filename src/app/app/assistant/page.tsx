"use client";

import { useState } from "react";
import { NoProfileState, useActiveProfile } from "@/hooks/useActiveProfile";

type MedOp = {
  op: "add" | "change" | "stop";
  displayName: string;
  dose?: string;
  strength?: string;
  frequency?: string;
  confidence: string;
  evidence: string;
  needsReview: boolean;
};

type Decision = { index: number; decision: "accept" | "reject" | "edit" };

const SAMPLE_DISCHARGE = `Discharge Summary — Mercy General
Patient: Eleanor
Medications on discharge:
- Continue warfarin 5 mg daily
- Start ibuprofen 200 mg as needed for pain
- Start melatonin 3 mg at bedtime
- Continue metformin 500 mg twice daily
- Stop diphenhydramine if previously used for sleep
`;

export default function AssistantPage() {
  const { profileId, status } = useActiveProfile();
  const [tab, setTab] = useState<"Intake" | "Explain" | "Prepare">("Intake");
  const [input, setInput] = useState(SAMPLE_DISCHARGE);
  const [question, setQuestion] = useState("Is ibuprofen safe with her blood thinner?");
  const [hint, setHint] = useState("PCP follow-up");
  const [loading, setLoading] = useState(false);
  const [ops, setOps] = useState<MedOp[]>([]);
  const [proposalId, setProposalId] = useState("");
  const [confirmToken, setConfirmToken] = useState("");
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [explain, setExplain] = useState<{
    narrative?: string;
    alerts?: { alertId: string; severity: string; title: string; what: string; soWhat: string; nowWhat: string; pharmacistScript: string }[];
    refusedInvention?: boolean;
  } | null>(null);
  const [packet, setPacket] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState("");

  function setDecision(index: number, decision: Decision["decision"]) {
    setDecisions((prev) => {
      const next = prev.filter((d) => d.index !== index);
      next.push({ index, decision });
      return next;
    });
  }

  async function runIntake() {
    if (!profileId || loading) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/profiles/${profileId}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: "Intake", inputText: input }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || "Intake failed");
        return;
      }
      setOps(data.ops || []);
      setProposalId(data.proposalId);
      setConfirmToken(data.confirmToken);
      setDecisions(
        (data.ops || []).map((_: MedOp, index: number) => ({
          index,
          decision: "accept" as const,
        })),
      );
      setMessage(data.message);
    } catch {
      setMessage("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  async function commitIntake() {
    if (!profileId || loading || !confirmToken) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/profiles/${profileId}/agents`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId, confirmToken, decisions }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || "Commit failed");
        return;
      }
      setMessage(`${data.message} Accepted ${data.accepted}, rejected ${data.rejected}.`);
      setOps([]);
      setProposalId("");
      setConfirmToken("");
    } catch {
      setMessage("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  async function runExplain() {
    if (!profileId || loading) return;
    setLoading(true);
    setExplain(null);
    setMessage("");
    try {
      const res = await fetch(`/api/profiles/${profileId}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: "Explain", inputText: question }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || "Explain failed");
        return;
      }
      setExplain(data);
    } catch {
      setMessage("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  async function runPrepare() {
    if (!profileId || loading) return;
    setLoading(true);
    setPacket(null);
    setMessage("");
    try {
      const res = await fetch(`/api/profiles/${profileId}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: "Prepare", appointmentHint: hint }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || "Prepare failed");
        return;
      }
      setPacket(data.packet);
    } catch {
      setMessage("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") return <div className="card muted">Loading…</div>;
  if (status === "empty" || !profileId) return <NoProfileState />;

  return (
    <div className="stack">
      <div>
        <h1 style={{ marginBottom: 0 }}>Assistant</h1>
        <p className="muted">
          Agentic co-pilot: Intake proposes, Explain grounds alerts, Prepare drafts the Visit Packet.
          Humans confirm every regimen write.
        </p>
      </div>

      <div className="row">
        {(["Intake", "Explain", "Prepare"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`btn ${tab === t ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {message && <div className="card">{message}</div>}

      {tab === "Intake" && (
        <section className="grid-2">
          <div className="card stack">
            <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Paste discharge / note</h2>
            <textarea className="textarea" value={input} onChange={(e) => setInput(e.target.value)} />
            <button className="btn btn-primary" type="button" disabled={loading} onClick={runIntake}>
              {loading ? "Working…" : "Run Intake agent"}
            </button>
          </div>
          <div className="card stack">
            <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Proposed changes</h2>
            {ops.length === 0 && (
              <p className="muted">Nothing proposed yet. Run Intake on a note or the sample discharge.</p>
            )}
            {ops.map((op, index) => {
              const decision = decisions.find((d) => d.index === index)?.decision ?? "accept";
              return (
                <div key={`${op.op}-${op.displayName}-${index}`} className="card">
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <strong>
                      {op.op.toUpperCase()} · {op.displayName}
                    </strong>
                    <span className="badge badge-info">{op.confidence}</span>
                  </div>
                  <p className="muted" style={{ fontSize: "0.9rem" }}>
                    {op.dose || op.strength || ""} {op.frequency || ""}
                    {op.needsReview ? " · needs review" : ""}
                  </p>
                  <p style={{ fontSize: "0.9rem" }}>
                    <em>Evidence:</em> {op.evidence}
                  </p>
                  <div className="row">
                    <button
                      type="button"
                      className={`btn ${decision === "accept" ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => setDecision(index, "accept")}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className={`btn ${decision === "reject" ? "btn-danger" : "btn-secondary"}`}
                      onClick={() => setDecision(index, "reject")}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
            {ops.length > 0 && (
              <button className="btn btn-primary" type="button" disabled={loading || !confirmToken} onClick={commitIntake}>
                Confirm selected changes
              </button>
            )}
          </div>
        </section>
      )}

      {tab === "Explain" && (
        <section className="grid-2">
          <div className="card stack">
            <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Ask about safety</h2>
            <textarea className="textarea" value={question} onChange={(e) => setQuestion(e.target.value)} />
            <button className="btn btn-primary" type="button" disabled={loading} onClick={runExplain}>
              {loading ? "Working…" : "Run Explain agent"}
            </button>
          </div>
          <div className="card stack">
            <h2 style={{ margin: 0, fontSize: "1.15rem" }}>AI answer</h2>
            {explain ? (
              <>
                <p style={{ whiteSpace: "pre-wrap" }}>{explain.narrative}</p>
                {(explain.alerts || []).map((a) => (
                  <div key={a.alertId} className="card">
                    <strong>
                      {a.severity}: {a.title}
                    </strong>
                    <p>
                      <strong>What:</strong> {a.what}
                    </p>
                    <p>
                      <strong>So what:</strong> {a.soWhat}
                    </p>
                    <p>
                      <strong>Now what:</strong> {a.nowWhat}
                    </p>
                    <p className="muted" style={{ fontSize: "0.85rem" }}>
                      Pharmacist script: {a.pharmacistScript}
                    </p>
                  </div>
                ))}
              </>
            ) : (
              <p className="muted">Run Explain to summarize alerts with citations.</p>
            )}
          </div>
        </section>
      )}

      {tab === "Prepare" && (
        <section className="grid-2">
          <div className="card stack">
            <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Appointment context</h2>
            <input className="input" value={hint} onChange={(e) => setHint(e.target.value)} />
            <button className="btn btn-primary" type="button" disabled={loading} onClick={runPrepare}>
              {loading ? "Working…" : "Run Prepare agent"}
            </button>
          </div>
          <div className="card stack">
            <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Draft Visit Packet</h2>
            {packet ? (
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  fontSize: "0.85rem",
                  margin: 0,
                  fontFamily: "var(--font-figtree), sans-serif",
                }}
              >
                {JSON.stringify(packet, null, 2)}
              </pre>
            ) : (
              <p className="muted">Prepare builds an editable packet for the pharmacist or clinician.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
