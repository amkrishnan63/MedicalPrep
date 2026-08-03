import { prisma } from "./prisma";

export type Severity = "Serious" | "Caution" | "Informational";

type AlertDraft = {
  severity: Severity;
  title: string;
  whatText: string;
  soWhatText: string;
  nowWhatText: string;
  memberKeys: string[];
  vendorCode?: string;
};

function pairKey(a: string, b: string) {
  return [a, b].sort().join("::");
}

export async function findDrugByQuery(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const all = await prisma.drugCatalog.findMany();
  return (
    all.find(
      (d) =>
        d.drugKey === q ||
        d.genericName.toLowerCase() === q ||
        d.displayName.toLowerCase() === q ||
        d.genericName.toLowerCase().includes(q) ||
        d.displayName.toLowerCase().includes(q),
    ) ?? null
  );
}

export async function searchDrugs(query: string, limit = 200) {
  const q = query.trim().toLowerCase();
  if (!q) {
    return prisma.drugCatalog.findMany({ take: limit, orderBy: { displayName: "asc" } });
  }
  const all = await prisma.drugCatalog.findMany({ orderBy: { displayName: "asc" } });
  return all
    .filter(
      (d) =>
        d.displayName.toLowerCase().includes(q) ||
        d.genericName.toLowerCase().includes(q) ||
        d.drugKey.includes(q) ||
        (d.drugClass?.toLowerCase().includes(q) ?? false),
    )
    .slice(0, limit);
}

export async function computeAlertsForProfile(profileId: string): Promise<AlertDraft[]> {
  const [meds, allergies, rules, catalog] = await Promise.all([
    prisma.medication.findMany({ where: { profileId, status: "active" } }),
    prisma.allergy.findMany({ where: { profileId, status: "active" } }),
    prisma.interactionRule.findMany(),
    prisma.drugCatalog.findMany(),
  ]);

  const drafts: AlertDraft[] = [];
  const seen = new Set<string>();
  const byKey = new Map(catalog.map((d) => [d.drugKey, d]));

  const activeKeys = meds
    .map((m) => m.drugKey)
    .filter((k): k is string => Boolean(k));

  for (let i = 0; i < activeKeys.length; i++) {
    for (let j = i + 1; j < activeKeys.length; j++) {
      const a = activeKeys[i];
      const b = activeKeys[j];
      const rule = rules.find(
        (r) =>
          (r.leftKey === a && r.rightKey === b) || (r.leftKey === b && r.rightKey === a),
      );
      if (!rule) continue;
      const key = `rule:${pairKey(a, b)}:${rule.vendorCode ?? rule.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      drafts.push({
        severity: rule.severity as Severity,
        title: rule.title,
        whatText: rule.whatText,
        soWhatText: rule.soWhatText,
        nowWhatText: rule.nowWhatText,
        memberKeys: [a, b],
        vendorCode: rule.vendorCode ?? undefined,
      });
    }
  }

  // Duplicate therapy by drug class (anticholinergic demo)
  const classCounts = new Map<string, string[]>();
  for (const key of activeKeys) {
    const drug = byKey.get(key);
    if (!drug?.drugClass) continue;
    const list = classCounts.get(drug.drugClass) ?? [];
    list.push(key);
    classCounts.set(drug.drugClass, list);
  }
  for (const [drugClass, keys] of classCounts) {
    if (keys.length < 2) continue;
    if (drugClass !== "anticholinergic" && drugClass !== "nsaid") continue;
    // Skip if a dedicated rule already covers the pair
    const already = drafts.some(
      (d) =>
        d.memberKeys.length === 2 &&
        keys.includes(d.memberKeys[0]) &&
        keys.includes(d.memberKeys[1]),
    );
    if (already) continue;
    const key = `dup:${drugClass}:${keys.sort().join(",")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    drafts.push({
      severity: "Caution",
      title: `Possible duplicate ${drugClass} therapy`,
      whatText: `More than one ${drugClass} medicine is on the active list (${keys.join(", ")})`,
      soWhatText:
        drugClass === "anticholinergic"
          ? "Overlapping anticholinergic effects can increase sedation, confusion, and fall risk in older adults."
          : "Overlapping NSAIDs can increase stomach bleeding and kidney risk.",
      nowWhatText:
        "Ask your pharmacist or clinician whether all of these are still needed. Do not stop prescription medicines on your own.",
      memberKeys: keys,
      vendorCode: `DUP-${drugClass.toUpperCase()}`,
    });
  }

  // Allergy conflicts
  for (const allergy of allergies) {
    const substance = allergy.substance.toLowerCase();
    for (const med of meds) {
      const drug = med.drugKey ? byKey.get(med.drugKey) : null;
      const hit =
        (substance.includes("penicillin") &&
          (med.drugKey === "amoxicillin" || drug?.drugClass === "penicillin")) ||
        (med.genericName && substance.includes(med.genericName.toLowerCase())) ||
        (med.displayName && substance.includes(med.displayName.toLowerCase()));
      if (!hit) continue;
      const key = `allergy:${allergy.id}:${med.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      drafts.push({
        severity: "Serious",
        title: `Allergy conflict: ${allergy.substance}`,
        whatText: `${med.displayName} may conflict with listed allergy to ${allergy.substance}`,
        soWhatText: `Reported reaction: ${allergy.reaction ?? "unspecified"} (${allergy.severity}). Allergy conflicts can be dangerous.`,
        nowWhatText:
          "Do not take this medicine until a pharmacist or clinician confirms it is safe. Seek urgent care for severe allergic symptoms.",
        memberKeys: [`allergy:${allergy.substance}`, med.drugKey ?? med.id],
        vendorCode: "ALLERGY-CONFLICT",
      });
    }
  }

  // NTI awareness (informational)
  for (const key of activeKeys) {
    const drug = byKey.get(key);
    if (!drug?.ntiFlag) continue;
    const k = `nti:${key}`;
    if (seen.has(k)) continue;
    seen.add(k);
    drafts.push({
      severity: "Informational",
      title: `${drug.displayName} needs clinician monitoring`,
      whatText: `${drug.displayName} (${drug.genericName}) is a narrow-therapeutic-index medicine`,
      soWhatText:
        "Small dose changes can matter. Lab or clinician monitoring is often required—MedicalPrep does not interpret lab results.",
      nowWhatText:
        "Keep this on your Visit Packet and confirm monitoring plans with the care team. Do not change the dose yourself.",
      memberKeys: [key],
      vendorCode: "NTI-AWARE",
    });
  }

  const order = { Serious: 0, Caution: 1, Informational: 2 };
  return drafts.sort((a, b) => order[a.severity] - order[b.severity]);
}

export async function refreshProfileAlerts(profileId: string) {
  const drafts = await computeAlertsForProfile(profileId);
  const existing = await prisma.interactionAlert.findMany({ where: { profileId } });

  const draftSignatures = new Set(
    drafts.map((d) => `${d.vendorCode ?? d.title}|${d.memberKeys.slice().sort().join(",")}`),
  );

  // Close alerts that no longer apply (unless acknowledged—keep history by marking dismissed)
  for (const alert of existing) {
    if (alert.status !== "open") continue;
    const sig = `${alert.vendorCode ?? alert.title}|${JSON.parse(alert.memberKeys).sort().join(",")}`;
    if (!draftSignatures.has(sig)) {
      await prisma.interactionAlert.update({
        where: { id: alert.id },
        data: { status: "dismissed", dismissReason: "no_longer_applicable" },
      });
    }
  }

  for (const draft of drafts) {
    const sigMembers = JSON.stringify(draft.memberKeys.slice().sort());
    const match = existing.find(
      (e) =>
        (e.vendorCode ?? e.title) === (draft.vendorCode ?? draft.title) &&
        JSON.stringify(JSON.parse(e.memberKeys).sort()) ===
          JSON.stringify(draft.memberKeys.slice().sort()) &&
        (e.status === "open" || e.status === "acknowledged"),
    );
    if (match) {
      if (match.status === "open") {
        await prisma.interactionAlert.update({
          where: { id: match.id },
          data: {
            severity: draft.severity,
            title: draft.title,
            whatText: draft.whatText,
            soWhatText: draft.soWhatText,
            nowWhatText: draft.nowWhatText,
            memberKeys: sigMembers,
          },
        });
      }
      continue;
    }
    await prisma.interactionAlert.create({
      data: {
        profileId,
        severity: draft.severity,
        title: draft.title,
        whatText: draft.whatText,
        soWhatText: draft.soWhatText,
        nowWhatText: draft.nowWhatText,
        memberKeys: sigMembers,
        vendorCode: draft.vendorCode,
        status: "open",
      },
    });
  }

  return prisma.interactionAlert.findMany({
    where: { profileId, status: { in: ["open", "acknowledged"] } },
    orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
  });
}
