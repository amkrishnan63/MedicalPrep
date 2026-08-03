"use client";

import { FormEvent, useEffect, useState } from "react";
import { NoProfileState, useActiveProfile } from "@/hooks/useActiveProfile";

type Member = {
  id: string;
  role: string;
  user: { id: string; name: string; email: string };
};

export default function PeoplePage() {
  const { profileId, status } = useActiveProfile();
  const [members, setMembers] = useState<Member[]>([]);
  const [role, setRole] = useState<"CAREGIVER" | "VIEWER">("CAREGIVER");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    if (!profileId) return;
    const res = await fetch(`/api/profiles/${profileId}/share`);
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members);
    }
  }

  useEffect(() => {
    if (status !== "ready" || !profileId) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, status]);

  async function invite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profileId || submitting) return;
    const formEl = e.currentTarget;
    const email = String(new FormData(formEl).get("email") || "").trim();
    setMessage("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/profiles/${profileId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || "Invite failed");
        return;
      }
      setMessage("Invite granted.");
      formEl.reset();
      await load();
    } catch {
      setMessage("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") return <div className="card muted">Loading…</div>;
  if (status === "empty" || !profileId) return <NoProfileState />;

  return (
    <div className="stack">
      <div>
        <h1 style={{ marginBottom: 0 }}>People</h1>
        <p className="muted">Household sharing with Owner / Caregiver / Viewer roles.</p>
      </div>

      <div className="grid-2">
        <form className="card stack" onSubmit={invite}>
          <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Invite trusted contact</h2>
          <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
            They must already have a MedicalPrep account. Owners only.
          </p>
          <div>
            <label className="label">Email</label>
            <input className="input" name="email" type="email" required />
          </div>
          <div>
            <label className="label">Role</label>
            <select
              className="select"
              value={role}
              onChange={(e) => setRole(e.target.value as "CAREGIVER" | "VIEWER")}
            >
              <option value="CAREGIVER">Caregiver (can edit)</option>
              <option value="VIEWER">Viewer (read-only)</option>
            </select>
          </div>
          {message && <p style={{ margin: 0 }}>{message}</p>}
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Granting…" : "Grant access"}
          </button>
        </form>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.15rem" }}>Members</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.user.name}</td>
                  <td>{m.user.email}</td>
                  <td>{m.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
