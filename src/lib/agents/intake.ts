import { chatCompletion, isOpenAIConfigured } from "../openai";
import { findDrugByQuery, searchDrugs } from "../interactions";
import { prisma } from "../prisma";

export type MedOp = {
  op: "add" | "change" | "stop";
  displayName: string;
  genericName?: string;
  drugKey?: string;
  rxnorm?: string | null;
  strength?: string;
  dose?: string;
  frequency?: string;
  scheduleTimes?: string[];
  indication?: string;
  confidence: "high" | "medium" | "low";
  evidence: string;
  needsReview: boolean;
  existingMedicationId?: string;
};

type DraftOp = {
  op: "add" | "change" | "stop";
  rawName: string;
  strength?: string;
  dose?: string;
  frequency?: string;
  evidence: string;
};

const LINE_PATTERNS = [
  /(?:start|start(?:ed|ing)?|begin|new|add(?:ed)?)\s+(.+)/i,
  /(?:stop|discontinue|dc|hold)\s+(.+)/i,
  /(?:change|increase|decrease|adjust)\s+(.+)/i,
  /^[-*•]?\s*(.+)$/i,
];

function extractStrength(text: string) {
  const m = text.match(/(\d+(?:\.\d+)?\s*mg)/i);
  return m?.[1];
}

function extractFrequency(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("twice") || lower.includes("bid") || lower.includes("2x"))
    return "twice daily";
  if (lower.includes("three times") || lower.includes("tid")) return "three times daily";
  if (lower.includes("bedtime") || lower.includes("qhs") || lower.includes("night"))
    return "daily at bedtime";
  if (lower.includes("daily") || lower.includes("once") || lower.includes("qd"))
    return "daily";
  if (lower.includes("prn") || lower.includes("as needed")) return "as needed";
  return undefined;
}

function scheduleFromFrequency(frequency?: string) {
  if (frequency === "twice daily") return ["08:00", "20:00"];
  if (frequency === "daily at bedtime") return ["21:00"];
  if (frequency === "daily") return ["08:00"];
  return [] as string[];
}

async function resolveDrugName(raw: string) {
  const cleaned = raw
    .replace(/\b\d+(?:\.\d+)?\s*mg\b/gi, "")
    .replace(/\b(daily|twice|bid|tid|qhs|prn|tablet|capsule|oral|po|at bedtime|once|nightly)\b/gi, "")
    .replace(/[(),]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const direct = await findDrugByQuery(cleaned);
  if (direct) return { drug: direct, confidence: "high" as const, needsReview: false };

  const hits = await searchDrugs(cleaned.split(" ")[0] ?? cleaned, 5);
  if (hits[0]) {
    return {
      drug: hits[0],
      confidence: "medium" as const,
      needsReview: true,
    };
  }
  return {
    drug: null,
    confidence: "low" as const,
    needsReview: true,
    displayName: cleaned || raw.trim(),
  };
}

async function draftsToOps(
  drafts: DraftOp[],
  existing: Awaited<ReturnType<typeof prisma.medication.findMany>>,
  toolCalls: unknown[],
) {
  const ops: MedOp[] = [];

  for (const draft of drafts) {
    const resolved = await resolveDrugName(draft.rawName);
    toolCalls.push({
      tool: "resolve_drug",
      line: draft.evidence,
      resolved: resolved.drug?.drugKey ?? null,
    });

    const displayName =
      resolved.drug?.displayName ??
      ("displayName" in resolved ? resolved.displayName : draft.rawName.slice(0, 80));
    const genericName = resolved.drug?.genericName;
    const drugKey = resolved.drug?.drugKey;
    const strength = draft.strength ?? extractStrength(draft.evidence);
    const frequency = draft.frequency ?? extractFrequency(draft.evidence);
    const scheduleTimes = scheduleFromFrequency(frequency);

    const existingMed = drugKey
      ? existing.find((m) => m.drugKey === drugKey)
      : existing.find(
          (m) =>
            m.displayName.toLowerCase() === String(displayName).toLowerCase() ||
            m.genericName?.toLowerCase() === genericName?.toLowerCase(),
        );

    if (draft.op === "stop") {
      if (!existingMed) continue;
      ops.push({
        op: "stop",
        displayName: existingMed.displayName,
        genericName: existingMed.genericName ?? undefined,
        drugKey: existingMed.drugKey ?? undefined,
        existingMedicationId: existingMed.id,
        confidence: "high",
        evidence: draft.evidence,
        needsReview: false,
      });
      continue;
    }

    if ((draft.op === "change" || draft.op === "add") && existingMed) {
      ops.push({
        op: "change",
        displayName: existingMed.displayName,
        genericName: genericName ?? existingMed.genericName ?? undefined,
        drugKey: drugKey ?? existingMed.drugKey ?? undefined,
        rxnorm: resolved.drug?.rxnorm,
        strength: strength ?? existingMed.strength ?? undefined,
        dose: draft.dose ?? strength ?? existingMed.dose ?? undefined,
        frequency: frequency ?? existingMed.frequency ?? undefined,
        scheduleTimes: scheduleTimes.length
          ? scheduleTimes
          : JSON.parse(existingMed.scheduleTimes),
        existingMedicationId: existingMed.id,
        confidence: resolved.confidence,
        evidence: draft.evidence,
        needsReview: resolved.needsReview,
      });
      continue;
    }

    ops.push({
      op: "add",
      displayName: String(displayName),
      genericName,
      drugKey,
      rxnorm: resolved.drug?.rxnorm,
      strength,
      dose: draft.dose ?? strength,
      frequency,
      scheduleTimes,
      confidence: resolved.confidence,
      evidence: draft.evidence,
      needsReview: resolved.needsReview || !drugKey,
    });
  }

  const deduped: MedOp[] = [];
  const seen = new Set<string>();
  for (const op of ops) {
    const k = `${op.op}:${op.drugKey ?? op.displayName.toLowerCase()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(op);
  }
  return deduped;
}

async function extractDraftsWithOpenAI(inputText: string, toolCalls: unknown[]) {
  const llm = await chatCompletion({
    temperature: 0,
    json: true,
    messages: [
      {
        role: "system",
        content: [
          "Extract medication change operations from a clinical/discharge note for a caregiver app.",
          'Return JSON: {"ops":[{"op":"add"|"change"|"stop","rawName":"string","strength":"optional","dose":"optional","frequency":"optional","evidence":"source snippet"}]}',
          "Only include medicines clearly mentioned. Prefer short drug names. Do not invent meds.",
        ].join(" "),
      },
      { role: "user", content: inputText },
    ],
  });
  toolCalls.push({ tool: "openai_intake_extract", model: llm.model });
  const parsed = JSON.parse(llm.text) as { ops?: DraftOp[] };
  const ops = Array.isArray(parsed.ops) ? parsed.ops : [];
  return {
    drafts: ops.filter(
      (o) =>
        o &&
        (o.op === "add" || o.op === "change" || o.op === "stop") &&
        typeof o.rawName === "string" &&
        o.rawName.trim(),
    ),
    model: llm.model,
  };
}

function extractDraftsRuleBased(inputText: string, toolCalls: unknown[]) {
  const lines = inputText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && !/^discharge|^patient|^mrn|^dob|^date/i.test(l));

  toolCalls.push({ tool: "parse_document_lines", count: lines.length });
  const drafts: DraftOp[] = [];

  for (const line of lines) {
    const stopMatch = line.match(/\b(stop|discontinue|dc|hold)\b/i);
    const changeMatch = line.match(/\b(change|increase|decrease|adjust)\b/i);
    const startMatch = line.match(/\b(start|started|starting|begin|new|add|added)\b/i);

    let op: MedOp["op"] = "add";
    if (stopMatch) op = "stop";
    else if (changeMatch) op = "change";
    else if (startMatch) op = "add";
    else if (!LINE_PATTERNS.some((p) => p.test(line))) continue;

    if (
      !/\b(mg|tablet|capsule|daily|bid|tid|qhs|prn|warfarin|metformin|lisinopril|ibuprofen|aspirin|omeprazole|amoxicillin|melatonin|sertraline|diphenhydramine|oxybutynin|atorvastatin|metoprolol|digoxin|furosemide|gabapentin|potassium|coumadin|lipitor|zestril|glucophage|st\.?\s*john)/i.test(
        line,
      )
    ) {
      continue;
    }

    drafts.push({
      op,
      rawName: line,
      strength: extractStrength(line),
      dose: extractStrength(line),
      frequency: extractFrequency(line),
      evidence: line,
    });
  }

  return drafts;
}

export async function runIntakeAgent(inputText: string, profileId: string) {
  const existing = await prisma.medication.findMany({
    where: { profileId, status: "active" },
  });
  const toolCalls: unknown[] = [];
  let model = "rule-based-v1";
  let drafts: DraftOp[] = [];

  if (isOpenAIConfigured()) {
    try {
      const extracted = await extractDraftsWithOpenAI(inputText, toolCalls);
      drafts = extracted.drafts;
      model = extracted.model;
    } catch (e) {
      toolCalls.push({
        tool: "openai_intake_failed",
        error: e instanceof Error ? e.message : "unknown",
      });
      drafts = extractDraftsRuleBased(inputText, toolCalls);
      model = "rule-based-v1";
    }
  } else {
    drafts = extractDraftsRuleBased(inputText, toolCalls);
  }

  if (drafts.length === 0) {
    drafts = extractDraftsRuleBased(inputText, toolCalls);
  }

  const ops = await draftsToOps(drafts, existing, toolCalls);
  return { ops, toolCalls, model };
}
