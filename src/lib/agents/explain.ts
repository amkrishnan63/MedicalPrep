import { prisma } from "../prisma";
import { refreshProfileAlerts } from "../interactions";
import { chatCompletion, isOpenAIConfigured } from "../openai";

export async function runExplainAgent(profileId: string) {
  const alerts = await refreshProfileAlerts(profileId);
  const open = alerts.filter((a) => a.status === "open" || a.status === "acknowledged");

  const toolCalls: unknown[] = [
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

  let narrative =
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

  let model = "rule-based-v1";

  if (isOpenAIConfigured()) {
    try {
      const llm = await chatCompletion({
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are MedicalPrep's Explain agent for family caregivers. Summarize the provided alerts if any. Keep a calm caregiver tone. End by reminding the user this is not medical advice.",
          },
          {
            role: "user",
            content: `Write a short safety summary using this alerts JSON (may be empty):\n${JSON.stringify(summaries, null, 2)}`,
          },
        ],
      });
      narrative = llm.text;
      model = llm.model;
      toolCalls.push({ tool: "openai_chat", model: llm.model });
    } catch (e) {
      toolCalls.push({
        tool: "openai_chat_failed",
        error: e instanceof Error ? e.message : "unknown",
      });
    }
  }

  return {
    narrative,
    alerts: summaries,
    toolCalls,
    grounded: true,
    model,
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
  const [result, meds, allergies] = await Promise.all([
    runExplainAgent(profileId),
    prisma.medication.findMany({
      where: { profileId, status: "active" },
      orderBy: { displayName: "asc" },
    }),
    prisma.allergy.findMany({ where: { profileId, status: "active" } }),
  ]);

  const q = question.toLowerCase();
  const mentioned = result.alerts.filter((a) => {
    const blob = `${a.what} ${a.title}`.toLowerCase();
    const tokens = q.split(/[^a-z0-9]+/).filter((t) => t.length > 3);
    return tokens.some((t) => blob.includes(t));
  });
  const focused = mentioned.length ? mentioned : result.alerts;

  const medSummary = meds.map((m) => ({
    name: m.displayName,
    generic: m.genericName,
    dose: m.dose,
    frequency: m.frequency,
    drugKey: m.drugKey,
  }));
  const allergySummary = allergies.map((a) => ({
    substance: a.substance,
    reaction: a.reaction,
    severity: a.severity,
  }));

  let narrative = result.narrative;
  let model = result.model;

  if (!isOpenAIConfigured()) {
    return {
      ...result,
      narrative:
        narrative +
        " (Set OPENAI_API_KEY to get a full AI-written Explain answer.)",
      focusedAlerts: focused,
      refusedInvention: false,
      model,
    };
  }

  try {
    const llm = await chatCompletion({
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: [
            "You are MedicalPrep's Explain assistant for family caregivers.",
            "Answer the user's question helpfully in natural language (2–5 short paragraphs).",
            "You HAVE two knowledge sources:",
            "1) Profile data: activeMedications, allergies, and safetyAlerts from MedicalPrep's demo engine — treat these as the household source of truth when present.",
            "2) Your general pharmaceutical knowledge — you MAY use this to explain possible interactions, monitoring tips, and what to ask a pharmacist, even when no matching safetyAlerts exist.",
            "When using general knowledge (not from safetyAlerts), clearly label it as general educational information, not a MedicalPrep coded alert.",
            "When safetyAlerts match the question, lead with those and quote their severity/title.",
            "Never instruct the user to start, stop, or change a medicine on your own authority — suggest discussing with a pharmacist or clinician.",
            "Be practical, calm, and specific to their listed meds when possible.",
            "End with a brief reminder that this is educational only, not a diagnosis or prescription.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              question,
              activeMedications: medSummary,
              allergies: allergySummary,
              safetyAlerts: result.alerts,
              matchingAlerts: focused,
            },
            null,
            2,
          ),
        },
      ],
    });
    narrative = llm.text;
    model = llm.model;
    result.toolCalls.push({ tool: "openai_explain_question", model: llm.model });
  } catch (e) {
    result.toolCalls.push({
      tool: "openai_explain_question_failed",
      error: e instanceof Error ? e.message : "unknown",
    });
  }

  return {
    ...result,
    narrative,
    focusedAlerts: focused,
    refusedInvention: false,
    model,
  };
}

export async function getProfileMedSummary(profileId: string) {
  return prisma.medication.findMany({
    where: { profileId, status: "active" },
    orderBy: { displayName: "asc" },
  });
}
