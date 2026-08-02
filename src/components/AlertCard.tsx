"use client";

import { severityClass } from "@/lib/format";

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

export function AlertCard({
  alert,
  onAcknowledge,
  onDismiss,
}: {
  alert: Alert;
  onAcknowledge?: (id: string) => void;
  onDismiss?: (id: string) => void;
}) {
  return (
    <article className={`card ${severityClass(alert.severity)}`}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <span
            className={`badge ${
              alert.severity === "Serious"
                ? "badge-serious"
                : alert.severity === "Caution"
                  ? "badge-caution"
                  : "badge-info"
            }`}
          >
            {alert.severity}
          </span>
          <h3 style={{ margin: "0.45rem 0 0.25rem", fontSize: "1.15rem" }}>{alert.title}</h3>
        </div>
        <span className="muted" style={{ fontSize: "0.8rem" }}>
          {alert.status}
        </span>
      </div>
      <p style={{ margin: "0.5rem 0 0.25rem" }}>
        <strong>What:</strong> {alert.whatText}
      </p>
      <p style={{ margin: "0.25rem 0" }}>
        <strong>So what:</strong> {alert.soWhatText}
      </p>
      <p style={{ margin: "0.25rem 0 0.75rem" }}>
        <strong>Now what:</strong> {alert.nowWhatText}
      </p>
      {alert.status === "open" && (
        <div className="row">
          {onAcknowledge && (
            <button className="btn btn-primary" type="button" onClick={() => onAcknowledge(alert.id)}>
              Acknowledge
            </button>
          )}
          {onDismiss && alert.severity !== "Serious" && (
            <button className="btn btn-secondary" type="button" onClick={() => onDismiss(alert.id)}>
              Dismiss
            </button>
          )}
        </div>
      )}
    </article>
  );
}
