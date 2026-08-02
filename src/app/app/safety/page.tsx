"use client";

import { useEffect, useState } from "react";
import { AlertCard } from "@/components/AlertCard";
import { NoProfileState, useActiveProfile } from "@/hooks/useActiveProfile";

type Alert = {
  id: string;
  severity: string;
  title: string;
  whatText: string;
  soWhatText: string;
  nowWhatText: string;
  status: string;
  vendorCode?: string | null;
};

export default function SafetyPage() {
  const { profileId, status } = useActiveProfile();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  async function load() {
    if (!profileId) return;
    const res = await fetch(`/api/profiles/${profileId}/alerts?refresh=1`);
    if (res.ok) {
      const data = await res.json();
      setAlerts(data.alerts);
    }
  }

  useEffect(() => {
    if (status !== "ready" || !profileId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, status]);

  async function acknowledge(id: string) {
    await fetch(`/api/profiles/${profileId}/alerts`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertId: id, action: "acknowledge" }),
    });
    await load();
  }

  async function dismiss(id: string) {
    await fetch(`/api/profiles/${profileId}/alerts`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertId: id, action: "dismiss", reason: "user_dismissed" }),
    });
    await load();
  }

  if (status === "loading") return <div className="card muted">Loading…</div>;
  if (status === "empty" || !profileId) return <NoProfileState />;

  return (
    <div className="stack">
      <div>
        <h1 style={{ marginBottom: 0 }}>Safety</h1>
        <p className="muted">
          Interaction, duplicate-therapy, allergy, and monitoring awareness alerts — grounded in the
          demo safety engine.
        </p>
      </div>
      {alerts.length === 0 ? (
        <div className="card muted">No open alerts. Keep the list complete, including OTCs.</div>
      ) : (
        alerts.map((a) => (
          <AlertCard
            key={a.id}
            alert={a}
            onAcknowledge={acknowledge}
            onDismiss={dismiss}
          />
        ))
      )}
    </div>
  );
}
