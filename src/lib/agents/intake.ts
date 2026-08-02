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

export async function runIntakeAgent(inputText: string, profileId: string) {
  const lines = inputText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && !/^discharge|^patient|^mrn|^dob|^date/i.test(l));

  const existing = await prisma.medication.findMany({
    where: { profileId, status: "active" },
  });

  const ops: MedOp[] = [];
  const toolCalls: unknown[] = [{ tool: "parse_document_lines", count: lines.length }];

  for (const line of lines) {
    const stopMatch = line.match(/\b(stop|discontinue|dc|hold)\b/i);
    const changeMatch = line.match(/\b(change|increase|decrease|adjust)\b/i);
    const startMatch = line.match(/\b(start|started|starting|begin|new|add|added)\b/i);

    let op: MedOp["op"] = "add";
    if (stopMatch) op = "stop";
    else if (changeMatch) op = "change";
    else if (startMatch) op = "add";
    else if (!LINE_PATTERNS.some((p) => p.test(line))) continue;

    // Skip headers / narrative without med-like tokens
    if (
      !/\b(mg|tablet|capsule|daily|bid|tid|qhs|prn|warfarin|metformin|lisinopril|ibuprofen|aspirin|omeprazole|amoxicillin|melatonin|sertraline|diphenhydramine|oxybutynin|atorvastatin|metoprolol|digoxin|furosemide|gabapentin|potassium|coumadin|lipitor|zestril|glucophage|st\.?\s*john)/i.test(
        line,
      )
    ) {
      continue;
    }

    const resolved = await resolveDrugName(line);
    toolCalls.push({ tool: "resolve_drug", line, resolved: resolved.drug?.drugKey ?? null });

    const displayName =
      resolved.drug?.displayName ??
      ("displayName" in resolved ? resolved.displayName : line.slice(0, 80));
    const genericName = resolved.drug?.genericName;
    const drugKey = resolved.drug?.drugKey;
    const strength = extractStrength(line);
    const frequency = extractFrequency(line);
    const scheduleTimes =
      frequency === "twice daily"
        ? ["08:00", "20:00"]
        : frequency === "daily at bedtime"
          ? ["21:00"]
          : frequency === "daily"
            ? ["08:00"]
            : [];

    const existingMed = drugKey
      ? existing.find((m) => m.drugKey === drugKey)
      : existing.find(
          (m) =>
            m.displayName.toLowerCase() === String(displayName).toLowerCase() ||
            m.genericName?.toLowerCase() === genericName?.toLowerCase(),
        );

    if (op === "stop") {
      if (!existingMed) continue;
      ops.push({
        op: "stop",
        displayName: existingMed.displayName,
        genericName: existingMed.genericName ?? undefined,
        drugKey: existingMed.drugKey ?? undefined,
        existingMedicationId: existingMed.id,
        confidence: "high",
        evidence: line,
        needsReview: false,
      });
      continue;
    }

    if (op === "change" && existingMed) {
      ops.push({
        op: "change",
        displayName: existingMed.displayName,
        genericName: genericName ?? existingMed.genericName ?? undefined,
        drugKey: drugKey ?? existingMed.drugKey ?? undefined,
        rxnorm: resolved.drug?.rxnorm,
        strength: strength ?? existingMed.strength ?? undefined,
        dose: strength ?? existingMed.dose ?? undefined,
        frequency: frequency ?? existingMed.frequency ?? undefined,
        scheduleTimes: scheduleTimes.length ? scheduleTimes : JSON.parse(existingMed.scheduleTimes),
        existingMedicationId: existingMed.id,
        confidence: resolved.confidence,
        evidence: line,
        needsReview: resolved.needsReview,
      });
      continue;
    }

    // Default add — skip if already on list with same key
    if (existingMed && op === "add") {
      ops.push({
        op: "change",
        displayName: existingMed.displayName,
        genericName: genericName ?? existingMed.genericName ?? undefined,
        drugKey: drugKey ?? existingMed.drugKey ?? undefined,
        rxnorm: resolved.drug?.rxnorm,
        strength: strength ?? existingMed.strength ?? undefined,
        dose: strength ?? existingMed.dose ?? undefined,
        frequency: frequency ?? existingMed.frequency ?? undefined,
        scheduleTimes: scheduleTimes.length ? scheduleTimes : JSON.parse(existingMed.scheduleTimes),
        existingMedicationId: existingMed.id,
        confidence: resolved.confidence,
        evidence: line,
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
      dose: strength,
      frequency,
      scheduleTimes,
      confidence: resolved.confidence,
      evidence: line,
      needsReview: resolved.needsReview || !drugKey,
    });
  }

  // Deduplicate by drugKey/displayName + op
  const deduped: MedOp[] = [];
  const seen = new Set<string>();
  for (const op of ops) {
    const k = `${op.op}:${op.drugKey ?? op.displayName.toLowerCase()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(op);
  }

  return { ops: deduped, toolCalls };
}
