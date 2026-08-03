"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { NoProfileState, useActiveProfile } from "@/hooks/useActiveProfile";

type DoseStatus = "pending" | "taken" | "skipped" | "snoozed" | "late" | string;

type Item = {
  medicationId: string;
  medicationName: string;
  scheduledAt: string;
  status: DoseStatus;
  doseEventId?: string;
};

const ACTIONS = [
  { status: "taken" as const, label: "Taken" },
  { status: "skipped" as const, label: "Skipped" },
  { status: "snoozed" as const, label: "Snooze" },
];

function itemKey(item: Item) {
  return `${item.medicationId}-${item.scheduledAt}`;
}

export default function TodayPage() {
  const { profileId, status } = useActiveProfile();
  const [schedule, setSchedule] = useState<Item[]>([]);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
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
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, status]);

  async function mark(item: Item, nextStatus: "taken" | "skipped" | "snoozed") {
    if (!profileId) return;
    const key = itemKey(item);
    // Optimistic highlight so the selected mode colors immediately
    setSchedule((prev) =>
      prev.map((row) => (itemKey(row) === key ? { ...row, status: nextStatus } : row)),
    );
    setPendingKey(key);
    try {
      const res = await fetch(`/api/profiles/${profileId}/doses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicationId: item.medicationId,
          scheduledAt: item.scheduledAt,
          status: nextStatus,
        }),
      });
      if (!res.ok) {
        await load();
        return;
      }
      await load();
    } catch {
      await load();
    } finally {
      setPendingKey(null);
    }
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
        schedule.map((item) => {
          const key = itemKey(item);
          const current = String(item.status || "pending").toLowerCase();
          return (
            <div
              key={key}
              className="card row"
              style={{ justifyContent: "space-between" }}
            >
              <div>
                <strong>{item.medicationName}</strong>
                <div className="muted">
                  {format(new Date(item.scheduledAt), "h:mm a")} · {current}
                </div>
              </div>
              <div className="row" role="group" aria-label={`Mark ${item.medicationName}`}>
                {ACTIONS.map((action) => {
                  const selected = current === action.status;
                  return (
                    <button
                      key={action.status}
                      className={`btn ${selected ? "btn-primary" : "btn-secondary"}`}
                      type="button"
                      aria-pressed={selected}
                      disabled={pendingKey === key}
                      onClick={() => void mark(item, action.status)}
                    >
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
