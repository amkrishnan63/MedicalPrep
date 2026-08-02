import { NextResponse } from "next/server";
import { z } from "zod";
import { canEdit, getSessionUser, requireProfileAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runIntakeAgent } from "@/lib/agents/intake";
import { explainWithoutInventing, runExplainAgent } from "@/lib/agents/explain";
import { runPrepareAgent } from "@/lib/agents/prepare";
import { refreshProfileAlerts } from "@/lib/interactions";
import { audit } from "@/lib/audit";
import type { MedOp } from "@/lib/agents/intake";

const schema = z.object({
  agent: z.enum(["Intake", "Explain", "Prepare"]),
  inputText: z.string().optional(),
  appointmentHint: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { profileId } = await params;
  const role = await requireProfileAccess(profileId, user.id, "VIEWER");
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (parsed.data.agent === "Intake" && !canEdit(role)) {
    return NextResponse.json(
      { error: "Viewers cannot run Intake proposals" },
      { status: 403 },
    );
  }

  if (parsed.data.agent === "Intake") {
    const inputText = parsed.data.inputText?.trim();
    if (!inputText) {
      return NextResponse.json({ error: "inputText required for Intake" }, { status: 400 });
    }
    const { ops, toolCalls } = await runIntakeAgent(inputText, profileId);
    const run = await prisma.agentRun.create({
      data: {
        profileId,
        userId: user.id,
        agentType: "Intake",
        inputText,
        outputJson: JSON.stringify({ ops }),
        toolCalls: JSON.stringify(toolCalls),
        model: "rule-based-v1",
      },
    });
    const proposal = await prisma.medChangeProposal.create({
      data: {
        profileId,
        agentRunId: run.id,
        opsJson: JSON.stringify(ops),
        status: "pending",
      },
    });
    await audit({
      actorId: user.id,
      profileId,
      action: "agent.intake",
      entityRef: proposal.id,
    });
    return NextResponse.json({
      agent: "Intake",
      agentRunId: run.id,
      proposalId: proposal.id,
      confirmToken: proposal.confirmToken,
      ops,
      message:
        "Proposed changes only. Nothing was saved. Accept or reject each item to commit.",
    });
  }

  if (parsed.data.agent === "Explain") {
    const result = parsed.data.inputText
      ? await explainWithoutInventing(profileId, parsed.data.inputText)
      : await runExplainAgent(profileId);
    const run = await prisma.agentRun.create({
      data: {
        profileId,
        userId: user.id,
        agentType: "Explain",
        inputText: parsed.data.inputText,
        outputJson: JSON.stringify(result),
        toolCalls: JSON.stringify(result.toolCalls),
        model: "rule-based-v1",
      },
    });
    await audit({
      actorId: user.id,
      profileId,
      action: "agent.explain",
      entityRef: run.id,
    });
    return NextResponse.json({ agent: "Explain", agentRunId: run.id, ...result });
  }

  // Prepare
  const result = await runPrepareAgent(profileId, parsed.data.appointmentHint);
  const run = await prisma.agentRun.create({
    data: {
      profileId,
      userId: user.id,
      agentType: "Prepare",
      inputText: parsed.data.appointmentHint,
      outputJson: JSON.stringify(result.packet),
      toolCalls: JSON.stringify(result.toolCalls),
      model: "rule-based-v1",
    },
  });
  await audit({
    actorId: user.id,
    profileId,
    action: "agent.prepare",
    entityRef: run.id,
  });
  return NextResponse.json({
    agent: "Prepare",
    agentRunId: run.id,
    packet: result.packet,
  });
}

const commitSchema = z.object({
  proposalId: z.string(),
  confirmToken: z.string(),
  decisions: z.array(
    z.object({
      index: z.number().int().nonnegative(),
      decision: z.enum(["accept", "reject", "edit"]),
      edits: z
        .object({
          displayName: z.string().optional(),
          dose: z.string().optional(),
          strength: z.string().optional(),
          frequency: z.string().optional(),
        })
        .optional(),
    }),
  ),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { profileId } = await params;
  const role = await requireProfileAccess(profileId, user.id, "CAREGIVER");
  if (!role || !canEdit(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = commitSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const proposal = await prisma.medChangeProposal.findFirst({
    where: {
      id: parsed.data.proposalId,
      profileId,
      confirmToken: parsed.data.confirmToken,
      status: "pending",
    },
  });
  if (!proposal) {
    return NextResponse.json(
      { error: "Invalid or already used confirmation token" },
      { status: 400 },
    );
  }

  const ops = JSON.parse(proposal.opsJson) as MedOp[];
  let accepted = 0;
  let rejected = 0;

  for (const d of parsed.data.decisions) {
    const op = ops[d.index];
    if (!op) continue;
    if (d.decision === "reject") {
      rejected++;
      continue;
    }
    const displayName = d.edits?.displayName ?? op.displayName;
    const dose = d.edits?.dose ?? op.dose;
    const strength = d.edits?.strength ?? op.strength;
    const frequency = d.edits?.frequency ?? op.frequency;

    if (op.op === "stop" && op.existingMedicationId) {
      await prisma.medication.update({
        where: { id: op.existingMedicationId },
        data: { status: "stopped", stopAt: new Date() },
      });
      accepted++;
      continue;
    }

    if (op.op === "change" && op.existingMedicationId) {
      await prisma.medication.update({
        where: { id: op.existingMedicationId },
        data: {
          displayName,
          dose,
          strength,
          frequency,
          scheduleTimes: JSON.stringify(op.scheduleTimes ?? []),
          needsReview: op.needsReview,
          source: "agent_intake",
          lastConfirmedAt: new Date(),
        },
      });
      accepted++;
      continue;
    }

    if (op.op === "add") {
      await prisma.medication.create({
        data: {
          profileId,
          displayName,
          genericName: op.genericName,
          drugKey: op.drugKey,
          rxnorm: op.rxnorm ?? undefined,
          dose,
          strength,
          frequency,
          scheduleTimes: JSON.stringify(op.scheduleTimes ?? []),
          indication: op.indication,
          status: "active",
          source: "agent_intake",
          needsReview: op.needsReview || !op.drugKey,
          startAt: new Date(),
        },
      });
      accepted++;
    }
  }

  await prisma.medChangeProposal.update({
    where: { id: proposal.id },
    data: {
      status: accepted && rejected ? "partial" : accepted ? "accepted" : "rejected",
      resolvedAt: new Date(),
      // Invalidate token by rotating
      confirmToken: crypto.randomUUID(),
    },
  });

  const alerts = await refreshProfileAlerts(profileId);
  await audit({
    actorId: user.id,
    profileId,
    action: "agent.intake.commit",
    entityRef: proposal.id,
    payload: { accepted, rejected },
  });

  return NextResponse.json({
    ok: true,
    accepted,
    rejected,
    alerts,
    message: "Human-confirmed changes committed. Interaction check refreshed.",
  });
}
