"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  displayName: string;
  role: string;
  activeMedCount: number;
  openSeriousCount: number;
};

export function ProfilePicker({
  profiles,
  selectedId,
}: {
  profiles: Profile[];
  selectedId?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createProfile(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not create profile");
        return;
      }
      setName("");
      router.push(`/app?profileId=${data.profile.id}`);
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  async function createDemo() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profiles/demo", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not create demo profile");
        return;
      }
      router.push(`/app?profileId=${data.profile.id}`);
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card stack">
      <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Household profiles</h2>

      {profiles.length === 0 && (
        <div className="stack">
          <p className="muted" style={{ margin: 0 }}>
            Start by adding who you care for — a parent, grandparent, or yourself.
          </p>
          <form className="stack" onSubmit={createProfile}>
            <div>
              <label className="label" htmlFor="profileName">
                Their name
              </label>
              <input
                className="input"
                id="profileName"
                placeholder="e.g. Grandma Eleanor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create profile"}
            </button>
          </form>
          <button className="btn btn-secondary" type="button" disabled={loading} onClick={createDemo}>
            Try sample profile (Grandma Eleanor)
          </button>
          <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
            Sample includes warfarin, metformin, lisinopril, atorvastatin + penicillin allergy — useful
            for testing interactions and the Assistant.
          </p>
        </div>
      )}

      {profiles.length > 0 && (
        <>
          <div className="stack">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                className="card"
                style={{
                  textAlign: "left",
                  cursor: "pointer",
                  borderColor: selectedId === p.id ? "var(--brand)" : "var(--line)",
                  background: selectedId === p.id ? "rgba(11,79,108,0.06)" : "white",
                }}
                onClick={() => router.push(`/app?profileId=${p.id}`)}
              >
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <strong>{p.displayName}</strong>
                  <span className="muted">{p.role}</span>
                </div>
                <div className="muted" style={{ marginTop: "0.35rem", fontSize: "0.9rem" }}>
                  {p.activeMedCount} active meds
                  {p.openSeriousCount > 0
                    ? ` · ${p.openSeriousCount} open Serious alert(s)`
                    : ""}
                </div>
              </button>
            ))}
          </div>
          <form className="row" onSubmit={createProfile} style={{ alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label className="label" htmlFor="anotherProfile">
                Add another
              </label>
              <input
                className="input"
                id="anotherProfile"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-secondary" type="submit" disabled={loading}>
              Add
            </button>
          </form>
        </>
      )}

      {error && <p style={{ color: "var(--serious)", margin: 0 }}>{error}</p>}
    </div>
  );
}
