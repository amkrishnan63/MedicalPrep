"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { NoProfileState, useActiveProfile } from "@/hooks/useActiveProfile";

type Item = {
  medicationId: string;
  medicationName: string;
  scheduledAt: string;
  status: string;
  doseEventId?: string;
};

export default function TodayPage() {
  const { profileId, status } = useActiveProfile();
  const [schedule, setSchedule] = useState<Item[]>([]);
  const date = format(new Date(), "yyyy-MM-dd");

  async function load() {
    if (!profileId) return;
    const res = await fetch(`/api/profiles/${profileId}/doses?date=${date}`);
    if (res.ok) {
      const data = await res.json();
      setSchedule(data.schedule);
    }
  }

  useEffect(() => {
    if (status !== "ready" || !profileId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, status]);

  async function mark(item: Item, nextStatus: "taken" | "skipped" | "snoozed") {
    await fetch(`/api/profiles/${profileId}/doses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medicationId: item.medicationId,
        scheduledAt: item.scheduledAt,
        status: nextStatus,
      }),
    });
    await load();
  }

  if (status === "loading") return <div className="card muted">Loading…</div>;
  if (status === "empty" || !profileId) return <NoProfileState />;

  return (
    <div className="stack">
      <div>
        <h1 style={{ marginBottom: 0 }}>Today</h1>
        <p className="muted">{format(new Date(), "EEEE, MMM d")} · dose timeline</p>
      </div>
      {schedule.length === 0 ? (
        <div className="card muted">No scheduled doses. Add schedule times on Medications.</div>
      ) : (
        schedule.map((item) => (
          <div
            key={`${item.medicationId}-${item.scheduledAt}`}
            className="card row"
            style={{ justifyContent: "space-between" }}
          >
            <div>
              <strong>{item.medicationName}</strong>
              <div className="muted">
                {format(new Date(item.scheduledAt), "h:mm a")} · {item.status}
              </div>
            </div>
            <div className="row">
              <button className="btn btn-primary" type="button" onClick={() => mark(item, "taken")}>
                Taken
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => mark(item, "skipped")}
              >
                Skipped
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => mark(item, "snoozed")}
              >
                Snooze
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
