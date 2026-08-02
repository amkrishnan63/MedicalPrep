import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshProfileAlerts } from "@/lib/interactions";
import { audit } from "@/lib/audit";

/** Creates a sample “Grandma Eleanor” profile so new caregivers can explore the app immediately. */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.create({
    data: {
      displayName: "Grandma Eleanor",
      birthYear: 1948,
      ownerId: user.id,
      otcPromptCompleted: false,
      memberships: { create: { userId: user.id, role: "OWNER" } },
      allergies: {
        create: {
          substance: "penicillin",
          reaction: "rash",
          severity: "severe",
        },
      },
      medications: {
        create: [
          {
            displayName: "Coumadin",
            genericName: "warfarin",
            drugKey: "warfarin",
            rxnorm: "11289",
            strength: "5 mg",
            dose: "5 mg",
            frequency: "daily",
            scheduleTimes: JSON.stringify(["18:00"]),
            indication: "Atrial fibrillation",
            source: "manual",
          },
          {
            displayName: "Glucophage",
            genericName: "metformin",
            drugKey: "metformin",
            rxnorm: "6809",
            strength: "500 mg",
            dose: "500 mg",
            frequency: "twice daily",
            scheduleTimes: JSON.stringify(["08:00", "20:00"]),
            indication: "Type 2 diabetes",
            source: "manual",
          },
          {
            displayName: "Zestril",
            genericName: "lisinopril",
            drugKey: "lisinopril",
            rxnorm: "29046",
            strength: "10 mg",
            dose: "10 mg",
            frequency: "daily",
            scheduleTimes: JSON.stringify(["08:00"]),
            indication: "Hypertension",
            source: "manual",
          },
          {
            displayName: "Lipitor",
            genericName: "atorvastatin",
            drugKey: "atorvastatin",
            rxnorm: "83367",
            strength: "20 mg",
            dose: "20 mg",
            frequency: "daily at bedtime",
            scheduleTimes: JSON.stringify(["21:00"]),
            indication: "Cholesterol",
            source: "manual",
          },
        ],
      },
    },
  });

  await refreshProfileAlerts(profile.id);
  await audit({
    actorId: user.id,
    profileId: profile.id,
    action: "profile.demo_create",
    entityRef: profile.id,
  });

  return NextResponse.json({ profile });
}
