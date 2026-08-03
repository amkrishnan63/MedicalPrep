import { prisma } from "../prisma";
import { runExplainAgent } from "./explain";
import { chatCompletion, isOpenAIConfigured } from "../openai";
import { subDays } from "date-fns";

export async function runPrepareAgent(profileId: string, appointmentHint?: string) {
  const profile = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });
  const [meds, allergies, explain, recentStopped] = await Promise.all([
    prisma.medication.findMany({
      where: { profileId, status: "active" },
      orderBy: { displayName: "asc" },
    }),
    prisma.allergy.findMany({ where: { profileId, status: "active" } }),
    runExplainAgent(profileId),
    prisma.medication.findMany({
      where: {
        profileId,
        status: "stopped",
        stopAt: { gte: subDays(new Date(), 30) },
      },
      orderBy: { stopAt: "desc" },
    }),
  ]);

  const serious = explain.alerts.filter((a) => a.severity === "Serious");
  const caution = explain.alerts.filter((a) => a.severity === "Caution");

  let questions = [
    serious[0]
      ? `Can you review this Serious alert with us: ${serious[0].title}?`
      : "Can you review our full home medication list including OTCs and supplements?",
    caution[0]
      ? `Is this Caution still appropriate: ${caution[0].title}?`
      : "Are any of these medicines duplicative or no longer needed?",
    "What should we watch for at home, and when should we call you or seek urgent care?",
    appointmentHint
      ? `For this ${appointmentHint}: any medicines we should hold, time differently, or bring labs for?`
      : "Any timing changes around meals, labs, or procedures?",
    "Please confirm we are not missing OTCs, vitamins, or herbals that matter for interactions.",
  ].slice(0, 5);

  let narrative = [
    `Visit Packet for ${profile.displayName}`,
    appointmentHint ? `Appointment context: ${appointmentHint}` : null,
    "",
    "This list is caregiver-reported and should be verified with the patient.",
    `${meds.length} active medication(s); ${allergies.length} allergy/intolerance item(s).`,
    `${serious.length} Serious and ${caution.length} Caution alert(s) currently on file.`,
    "Do not start, stop, or change medicines based only on this packet—confirm with a pharmacist or clinician.",
  ]
    .filter((x) => x !== null)
    .join("\n");

  const toolCalls: unknown[] = [
    { tool: "get_profile_meds" },
    { tool: "get_allergies" },
    { tool: "get_alerts" },
    { tool: "draft_visit_packet" },
  ];
  let model = explain.model || "rule-based-v1";

  if (isOpenAIConfigured()) {
    try {
      const llm = await chatCompletion({
        temperature: 0.3,
        json: true,
        messages: [
          {
            role: "system",
            content: [
              "You help family caregivers prepare for a clinic or pharmacy visit.",
              'Return JSON: {"narrative":"short caregiver-facing intro","questions":["up to 5 practical questions"]}',
              "Use ONLY the provided meds, allergies, and alerts. Do not invent clinical facts.",
              "Remind that this is not medical advice.",
            ].join(" "),
          },
          {
            role: "user",
            content: JSON.stringify({
              profileName: profile.displayName,
              appointmentHint: appointmentHint || null,
              meds: meds.map((m) => ({
                name: m.displayName,
                dose: m.dose,
                frequency: m.frequency,
              })),
              allergies: allergies.map((a) => a.substance),
              alerts: explain.alerts,
              seedQuestions: questions,
            }),
          },
        ],
      });
      const parsed = JSON.parse(llm.text) as {
        narrative?: string;
        questions?: string[];
      };
      if (parsed.narrative?.trim()) narrative = parsed.narrative.trim();
      if (Array.isArray(parsed.questions) && parsed.questions.length) {
        questions = parsed.questions.map(String).slice(0, 5);
      }
      model = llm.model;
      toolCalls.push({ tool: "openai_prepare", model: llm.model });
    } catch (e) {
      toolCalls.push({
        tool: "openai_prepare_failed",
        error: e instanceof Error ? e.message : "unknown",
      });
    }
  }

  const packet = {
    profileName: profile.displayName,
    generatedAt: new Date().toISOString(),
    disclaimer:
      "Educational/informational only. Not a substitute for professional medical advice. Caregiver-reported; verify with patient.",
    allergies: allergies.map((a) => ({
      substance: a.substance,
      reaction: a.reaction,
      severity: a.severity,
    })),
    activeMedications: meds.map((m) => ({
      name: m.displayName,
      generic: m.genericName,
      dose: m.dose,
      strength: m.strength,
      frequency: m.frequency,
      indication: m.indication,
      scheduleTimes: JSON.parse(m.scheduleTimes || "[]"),
      needsReview: m.needsReview,
    })),
    recentlyStopped: recentStopped.map((m) => ({
      name: m.displayName,
      stoppedAt: m.stopAt,
    })),
    alerts: explain.alerts.map((a) => ({
      severity: a.severity,
      title: a.title,
      what: a.what,
      soWhat: a.soWhat,
      nowWhat: a.nowWhat,
      alertId: a.alertId,
    })),
    questions,
    narrative,
  };

  return { packet, toolCalls, model };
}
