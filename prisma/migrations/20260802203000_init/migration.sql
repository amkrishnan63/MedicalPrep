-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL DEFAULT '',
    "firebaseUid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles',
    "birthYear" INTEGER,
    "otcPromptCompleted" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allergy" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "substance" TEXT NOT NULL,
    "reaction" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'moderate',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Allergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medication" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "genericName" TEXT,
    "rxnorm" TEXT,
    "drugKey" TEXT,
    "strength" TEXT,
    "form" TEXT,
    "dose" TEXT,
    "route" TEXT DEFAULT 'oral',
    "frequency" TEXT,
    "scheduleTimes" TEXT NOT NULL DEFAULT '[]',
    "prn" BOOLEAN NOT NULL DEFAULT false,
    "indication" TEXT,
    "prescriber" TEXT,
    "pharmacy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "startAt" TIMESTAMP(3),
    "stopAt" TIMESTAMP(3),
    "lastConfirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InteractionAlert" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "whatText" TEXT NOT NULL,
    "soWhatText" TEXT NOT NULL,
    "nowWhatText" TEXT NOT NULL,
    "memberKeys" TEXT NOT NULL,
    "vendorCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "ackedAt" TIMESTAMP(3),
    "dismissReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InteractionAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoseEvent" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "actorUserId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedChangeProposal" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "agentRunId" TEXT,
    "opsJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "confirmToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "MedChangeProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "inputText" TEXT,
    "outputJson" TEXT,
    "toolCalls" TEXT NOT NULL DEFAULT '[]',
    "model" TEXT NOT NULL DEFAULT 'rule-based-v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "profileId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityRef" TEXT,
    "payload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyEnrollment" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "siteId" TEXT,
    "participantId" TEXT,
    "rulesetId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "StudyEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugCatalog" (
    "id" TEXT NOT NULL,
    "drugKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "genericName" TEXT NOT NULL,
    "rxnorm" TEXT,
    "drugClass" TEXT,
    "isOtc" BOOLEAN NOT NULL DEFAULT false,
    "ntiFlag" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DrugCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InteractionRule" (
    "id" TEXT NOT NULL,
    "leftKey" TEXT NOT NULL,
    "rightKey" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "whatText" TEXT NOT NULL,
    "soWhatText" TEXT NOT NULL,
    "nowWhatText" TEXT NOT NULL,
    "vendorCode" TEXT,

    CONSTRAINT "InteractionRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_profileId_userId_key" ON "Membership"("profileId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MedChangeProposal_confirmToken_key" ON "MedChangeProposal"("confirmToken");

-- CreateIndex
CREATE UNIQUE INDEX "StudyEnrollment_profileId_key" ON "StudyEnrollment"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "DrugCatalog_drugKey_key" ON "DrugCatalog"("drugKey");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allergy" ADD CONSTRAINT "Allergy_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteractionAlert" ADD CONSTRAINT "InteractionAlert_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoseEvent" ADD CONSTRAINT "DoseEvent_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoseEvent" ADD CONSTRAINT "DoseEvent_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoseEvent" ADD CONSTRAINT "DoseEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedChangeProposal" ADD CONSTRAINT "MedChangeProposal_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedChangeProposal" ADD CONSTRAINT "MedChangeProposal_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "AgentRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyEnrollment" ADD CONSTRAINT "StudyEnrollment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

