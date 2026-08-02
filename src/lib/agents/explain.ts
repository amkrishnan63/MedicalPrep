import { prisma } from "../prisma";
import { refreshProfileAlerts } from "../interactions";

export async function runExplainAgent(profileId: string) {
  const alerts = await refreshProfileAlerts(profileId);
  const open = alerts.filter((a) => a.status === "open" || a.status === "acknowledged");

  const toolCalls = [
    { tool: "run_interaction_check", profileId },
    { tool: "get_alerts", count: open.length },
  ];

  const summaries = open.map((alert) => ({
    alertId: alert.id,
    severity: alert.severity,
    title: alert.title,
    what: alert.whatText,
    soWhat: alert.soWhatText,
    nowWhat: alert.nowWhatText,
    vendorCode: alert.vendorCode,
    pharmacistScript: buildPharmacistScript(alert),
  }));

  const serious = summaries.filter((s) => s.severity === "Serious");
  const caution = summaries.filter((s) => s.severity === "Caution");
  const info = summaries.filter((s) => s.severity === "Informational");

  const narrative =
    summaries.length === 0
      ? "No open interaction, duplicate-therapy, or allergy alerts are on file for the current active list. This is not a guarantee of safety—lists can be incomplete (especially OTCs and supplements)."
      : [
          `Safety review found ${serious.length} Serious, ${caution.length} Caution, and ${info.length} Informational alert(s).`,
          serious.length
            ? `Prioritize Serious items with your pharmacist or clinician before adding or continuing the implicated OTC/supplement when possible.`
            : null,
          "MedicalPrep does not replace professional medical advice. Do not start, stop, or change medicines based only on this summary.",
        ]
          .filter(Boolean)
          .join(" ");

  return {
    narrative,
    alerts: summaries,
    toolCalls,
    grounded: true,
  };
}

function buildPharmacistScript(alert: {
  severity: string;
  whatText: string;
  soWhatText: string;
  nowWhatText: string;
  vendorCode: string | null;
}) {
  return [
    `I manage a family member's medications in MedicalPrep.`,
    `We have a ${alert.severity.toLowerCase()} alert: ${alert.whatText}.`,
    `${alert.soWhatText}`,
    `Can you help us decide what to do? ${alert.nowWhatText}`,
    alert.vendorCode ? `(Internal alert code: ${alert.vendorCode})` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function explainWithoutInventing(profileId: string, question: string) {
  const result = await runExplainAgent(profileId);
  const q = question.toLowerCase();

  // Only discuss alerts that exist — never invent pairs
  const mentioned = result.alerts.filter((a) => {
    const blob = `${a.what} ${a.title}`.toLowerCase();
    const tokens = q.split(/[^a-z0-9]+/).filter((t) => t.length > 3);
    return tokens.some((t) => blob.includes(t));
  });

  if (/interact|safe|together|okay|ok\b/.test(q) && mentioned.length === 0) {
    return {
      ...result,
      narrative:
        "I don't have a matching interaction alert on file from our safety database for that question with the current coded medication list. That does not prove safety—especially if a medicine is missing, uncoded, or an OTC/supplement wasn't added. Please ask a pharmacist or clinician, and make sure the full list (including OTCs) is complete.",
      focusedAlerts: [],
      refusedInvention: true,
    };
  }

  return {
    ...result,
    focusedAlerts: mentioned.length ? mentioned : result.alerts,
    refusedInvention: false,
  };
}

export async function getProfileMedSummary(profileId: string) {
  return prisma.medication.findMany({
    where: { profileId, status: "active" },
    orderBy: { displayName: "asc" },
  });
}
