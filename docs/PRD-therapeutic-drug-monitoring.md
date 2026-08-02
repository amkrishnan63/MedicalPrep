# Product Requirements Document  
## MedicalPrep — Consumer Therapeutic Drug Monitoring

| Field | Value |
| --- | --- |
| **Product** | MedicalPrep |
| **Document type** | Product Requirements Document (PRD) |
| **Version** | 1.1 |
| **Status** | Draft |
| **Date** | 2026-08-01 |
| **Owner** | Product |
| **Primary persona** | Family caregivers (adult children/grandchildren) + older adults on multiple medications |
| **Strategic bet** | Agentic AI for caregivers first; platform extensible to clinical trials |
| **Changelog (1.1)** | Added agentic AI product pillar; caregiver-as-builder persona; clinical trials expansion roadmap |
| **Elaborate PRD** | [MedicalPrep-Elaborate-PRD.md](./MedicalPrep-Elaborate-PRD.md) (v2.0 — full specification) |

---

## 1. Executive summary

MedicalPrep is a **consumer medication-safety platform** powered by **agentic AI**, built first for people like Ajay—adult family members who juggle grandparents’ (or parents’) complex regimens and want software that *does work for them*, not another static checklist.

The product helps households safely manage multi-drug regimens: a living medication list, **interaction and duplicate-therapy checks**, timing and adherence support, and clear guidance on when to involve a pharmacist or clinician. Agentic AI sits on top of that trusted record: agents that ingest discharge papers, reconcile lists, explain risks in plain language, draft pharmacist questions, and watch for changes—always with human confirmation on anything that alters the regimen.

Unlike hospital TDM (serum levels, PK/PD modeling for narrow-therapeutic-index drugs), MedicalPrep is **not** a lab or dosing engine. It is a **safety and coordination layer** for home polypharmacy. The same core—structured medication identity, interaction intelligence, audit trails, and agent workflows—is designed to **extend later into clinical trials** (protocol concomitant-med checks, adherence, AE narrative assistance) without rebuilding from scratch.

**One-line vision:** Agentic AI that family caregivers trust to keep multi-drug regimens safe—and a platform that grows from households to trial participants.

---

## 2. Problem statement

### 2.1 The problem

Older adults often take 5–15+ medications across multiple prescribers (primary care, specialists, hospital discharge, retail pharmacy). Families worry about:

1. **Drug–drug and drug–supplement interactions** that no single clinician sees end-to-end  
2. **Duplicate therapies** (e.g., two NSAIDs, overlapping anticholinergics)  
3. **Timing conflicts** (food restrictions, spacing, “take with food” vs. empty stomach)  
4. **Adherence drift** after regimen changes or cognitive load  
5. **Information fragmentation** across bottles, after-visit summaries, and pharmacy apps  

Clinical systems optimize for the provider’s chart. Consumer tools often stop at reminders. Families need a **shared, interaction-aware medication record** they control.

### 2.2 Why existing options fall short

| Option | Gap for families |
| --- | --- |
| Pharmacy interaction check at fill | Misses OTCs, supplements, meds from other pharmacies; one-time, not continuous |
| EHR patient portals | Per-health-system; incomplete across providers; dense clinical language |
| Generic reminder apps | Weak/no interaction engine; no caregiver model |
| Hospital/clinic TDM | Lab-centric; not designed for home polypharmacy or family oversight |

### 2.3 Opportunity

A consumer product that treats the **household medication list as the source of truth**, continuously rechecks interactions when anything changes, and supports **caregiver collaboration** without pretending to replace clinical judgment.

### 2.4 Why agentic AI (for users like Ajay)

Caregivers are not looking for another form to fill. They are looking for a **delegate**: something that can read a discharge summary, notice a new OTC, draft “what to ask the pharmacist,” and keep watching between visits. Static apps fail this job; **agents with tools** (drug DB, interaction engine, OCR, calendar, share/export) can do it—if every regimen-changing action stays **human-confirmed** and clinically grounded (licensed interaction content, not model guesswork).

### 2.5 Why clinical trials later

Trial participants are often older, on concomitant medications, and monitored for adherence and safety events. The same primitives—med identity, interaction checks, adherence logs, agent-assisted document intake, audit trails—map to **concomitant medication review**, **protocol conflict flags**, and **participant/caregiver support**. Consumer trust + structured data become the wedge into research use cases (Phase 4+), not a separate product fantasy at day one.

---

## 3. Goals and non-goals

### 3.1 Goals (MVP)

| ID | Goal | Success signal |
| --- | --- | --- |
| G1 | Capture a complete home medication list (Rx, OTC, vitamins, supplements) | ≥90% of active users have ≥1 complete profile with ≥3 meds |
| G2 | Surface clinically meaningful interaction and duplicate-therapy risks in plain language | Users can identify top risks without clinical training |
| G3 | Support a family caregiver viewing/editing with consent | ≥40% of profiles linked to a second trusted user within 60 days |
| G4 | Reduce “missed / wrong-time” doses via schedule + reminders | Measurable improvement in self-reported adherence or reminder engagement |
| G5 | Make “what to do next” obvious (pharmacist, clinician, emergency) | Clear escalation paths on every high-severity alert |
| G6 | Deliver agentic assistance caregivers actually use (intake, explain, prepare, watch) | ≥50% of activated caregivers complete ≥1 agent task/week by day 60 |
| G7 | Architect for multi-application expansion (trials) without blocking consumer MVP | Shared domain model + agent tool interface documented; no hard consumer-only coupling |

### 3.2 Non-goals (explicitly out of scope for v1)

- Replacing a physician, pharmacist, or licensed clinical decision support used for prescribing  
- Automated dose adjustment or serum-level interpretation (classic clinical TDM)  
- Diagnosing conditions or recommending new prescription drugs  
- Guaranteeing a complete interaction database for every global formulation  
- Controlled-substance dispensing, refill ordering as a pharmacy, or insurance adjudication  
- HIPAA-covered entity workflows as a *provider* EHR (consumer app + BAA partners as needed later)  
- **Autonomous** medication changes by AI (add/stop/change dose without explicit human confirm)  
- LLM as the sole source of interaction “truth” (models may *explain* vendor results; they must not invent interactions)  
- Full clinical trial EDC / CTMS / regulatory submission systems in MVP  
- Autonomous SAE reporting or protocol deviation adjudication

---

## 4. Target users and personas

### 4.1 Primary buyer / design target: “Ajay” — agentic caregiver

- Adult child/grandchild; technically comfortable; time-poor; manages grandparents’ meds across pharmacies and specialists  
- Wants software **used by others like him**: delegates grunt work to AI agents, stays in the loop for confirmations  
- Triggers: hospital discharge PDF, new specialist Rx, “Mom started melatonin,” upcoming PCP visit  

**Jobs to be done:** Offload list building and monitoring; understand risks fast; walk into the pharmacy/clinic prepared; trust that nothing silent slipped through.

### 4.2 Primary user (patient): “Eleanor” — older adult

- Age 70–90, 6–12 daily medications, some OTCs (pain, sleep, antacids)  
- May have mild cognitive or vision limitations  
- Wants simple language, large tap targets, and fewer scary false alarms  

**Jobs to be done:** Know what to take when; know if something new is unsafe; show the list at appointments.

### 4.3 Secondary: “Marcus” — involved pharmacist / clinician (read/export)

- Not a daily app user; receives a clean medication list or PDF at visits  
- Needs structured data (name, dose, frequency, indication if known, start date)

### 4.4 Future: “Dana” — clinical trial coordinator / participant support

- Needs concomitant med awareness, adherence visibility, and clear escalation—not a consumer reminder toy  
- Appears in Phase 4+; influences architecture now (audit, consent, export, agent tools)

### 4.5 Anti-personas

- Hospital TDM / PK specialists needing AUC/trough workflows  
- Users seeking recreational drug interaction “checkers” without a real regimen  
- Clinics wanting a full EHR replacement  
- Users wanting a fully autonomous “AI doctor” that changes meds without humans  

---

## 5. Product principles

1. **Safety over engagement** — Never gamify ignoring a serious alert.  
2. **Plain language first** — Clinical severity mapped to household actions.  
3. **Incomplete data is dangerous** — Prefer “list may be incomplete” over false confidence.  
4. **Caregiver is a first-class role** — Not bolted onto a solo tracker.  
5. **Escalate, don’t prescribe** — Guide to pharmacist/clinician; do not invent dosing advice.  
6. **Privacy by default** — Health data minimized, encrypted, shareable only with explicit consent.  
7. **Agents assist; humans decide** — AI proposes; users confirm any regimen mutation.  
8. **Deterministic clinical truth, generative explanation** — Interactions/allergies from licensed engines; LLMs explain and orchestrate only.  
9. **Platform primitives over feature islands** — Build med graph, alerts, agents, and audit so trials (and other apps) can reuse them.  

---

## 6. Scope and product pillars

```
┌─────────────────────────────────────────────────────────────┐
│  Pillar A — Medication identity & regimen                   │
│  Pillar B — Interaction & risk intelligence                 │
│  Pillar C — Schedule, adherence & daily use                 │
│  Pillar D — Care team & household sharing                   │
│  Pillar E — Appointments, export & continuity               │
│  Pillar F — Agentic AI (caregiver co-pilot)                 │
│  Pillar G — Platform expansion (clinical trials — later)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. User journeys (MVP)

### 7.1 First-week setup (caregiver-led)

1. Create account → create **Patient profile** (self or dependent)  
2. Add medications via search, **Intake agent** (PDF/photo), or manual entry—all human-confirmed  
3. Add OTCs and supplements (explicit prompt—often the missing risk)  
4. Run **baseline safety review** → Explain agent ranks alerts + “talk to pharmacist” summary  
5. Invite caregiver / co-manager with role permissions  

### 7.2 New prescription or OTC

1. User/caregiver adds or updates a med  
2. Engine re-runs interactions against the full list  
3. If severity ≥ threshold → blocking interstitial with explanation + recommended next step  
4. Optional: “Ask pharmacist” checklist (what to say, what changed)  

### 7.3 Daily adherence

1. Today’s schedule (morning / noon / evening / bedtime or custom)  
2. Mark taken / skipped / snoozed  
3. Notes for side effects or questions (for next clinical visit)  

### 7.4 Clinic visit

1. Generate **Visit Packet**: current meds, recent changes, open alerts  
2. Share PDF or secure link (time-limited)  

### 7.5 Agentic caregiver loop (Ajay)

1. Caregiver uploads discharge summary / photo of bottles / pastes a specialist note  
2. **Intake agent** proposes structured med diffs (add/change/stop) with source highlights  
3. Caregiver confirms or edits each proposed change  
4. Interaction engine runs; **Explain agent** turns Serious/Caution into plain language + pharmacist script  
5. **Watch agent** (background) notifies on due confirmations, missed doses (if enabled), or new unresolved Serious alerts  
6. Before visit: **Prepare agent** assembles Visit Packet + top 3 questions  

---

## 8. Functional requirements

Priority: **P0** = MVP must-have · **P1** = launch+ · **P2** = later

### 8.1 Medication list & regimen (Pillar A)

| ID | Requirement | Priority |
| --- | --- | --- |
| A1 | CRUD for medications: name (brand/generic), strength, form, dose, route, frequency, schedule times, PRN flag, indication (optional), prescriber (optional), pharmacy (optional), start/stop dates, active/inactive | P0 |
| A2 | Structured drug identity via recognized drug database (RxNorm / equivalent) with fallback free-text + review flag | P0 |
| A3 | Explicit capture of OTC, vitamins, herbals, and supplements | P0 |
| A4 | Allergy and intolerance list with severity and reaction type | P0 |
| A5 | Condition list (high-level: e.g., AF, CKD, diabetes) to support condition–drug warnings where data allows | P1 |
| A6 | Photo of label → OCR suggestions requiring user confirmation before save | P1 |
| A7 | Barcode / NDC scan where packaging supports it | P2 |
| A8 | Import from pharmacy or portal (FHIR / partner APIs) with reconcile UI | P2 |

### 8.2 Interaction & risk intelligence (Pillar B)

| ID | Requirement | Priority |
| --- | --- | --- |
| B1 | Drug–drug interaction check across entire active list on every add/edit/activate | P0 |
| B2 | Drug–supplement / drug–OTC checks for common high-risk pairs | P0 |
| B3 | Duplicate therapy / therapeutic class overlap detection | P0 |
| B4 | Allergy–drug conflict alerts | P0 |
| B5 | Severity model with ≥3 levels (e.g., Informational / Caution / Serious) mapped to plain-language actions | P0 |
| B6 | Alert content: what interacts, why it matters in everyday terms, what to do next (not dose changes) | P0 |
| B7 | User can snooze/dismiss **only** Informational/Caution with reason; Serious requires acknowledgment + optional “discussed with clinician” note | P0 |
| B8 | Food / alcohol / grapefruit-style timing and lifestyle flags when applicable | P1 |
| B9 | Age / organ-function sensitive warnings when user provides relevant profile data (e.g., reported CKD) | P1 |
| B10 | Narrow-therapeutic-index **awareness** flags (e.g., warfarin, digoxin, lithium)—educate to use clinician/lab monitoring, do not interpret labs | P1 |
| B11 | Continuously refreshed interaction content from licensed clinical data vendor | P0 |
| B12 | Audit log of alert shown, acknowledged, dismissed | P0 |

**Safety copy requirement:** Every interaction screen includes a persistent disclaimer that MedicalPrep does not replace professional medical advice and that users should consult a pharmacist or clinician before changing medications.

### 8.3 Schedule, adherence & daily use (Pillar C)

| ID | Requirement | Priority |
| --- | --- | --- |
| C1 | Daily timeline of doses with local timezone support | P0 |
| C2 | Push / local notifications for due doses (user-configurable quiet hours) | P0 |
| C3 | Mark dose: taken, skipped, late, snoozed | P0 |
| C4 | PRN logging with optional reason | P1 |
| C5 | Caregiver receives missed-dose alerts if patient opts in | P1 |
| C6 | Adherence summary (7/30 day) for patient and caregiver | P1 |
| C7 | Refill reminder based on remaining quantity / days’ supply | P2 |

### 8.4 Care team & household sharing (Pillar D)

| ID | Requirement | Priority |
| --- | --- | --- |
| D1 | Multi-profile: one account can manage self + dependents | P0 |
| D2 | Invite trusted contacts via email/SMS magic link | P0 |
| D3 | Roles: Owner, Caregiver (edit), Viewer (read-only) | P0 |
| D4 | Patient (or legal proxy) consent required before share | P0 |
| D5 | Activity feed: who added/changed/stopped a med | P0 |
| D6 | Emergency access card: allergies + critical meds (offline-capable) | P1 |
| D7 | Multiple caregivers with clear conflict resolution (last-write + history) | P1 |

### 8.5 Appointments, export & continuity (Pillar E)

| ID | Requirement | Priority |
| --- | --- | --- |
| E1 | Export medication list as PDF / printable | P0 |
| E2 | “Visit Packet”: meds + allergies + open Serious alerts + recent changes | P0 |
| E3 | Share time-limited read-only link | P1 |
| E4 | Structured export (FHIR MedicationRequest / MedicationStatement) | P2 |
| E5 | Appointment prep checklist (questions to ask pharmacist/clinician) | P1 |

### 8.6 Account, accessibility, platforms

| ID | Requirement | Priority |
| --- | --- | --- |
| F1 | iOS and Android apps (or high-quality responsive web + PWA for MVP if resource-constrained—decision in §12) | P0 |
| F2 | Large-text / dynamic type, high contrast, VoiceOver/TalkBack support for core flows | P0 |
| F3 | Auth: email + SSO options; optional biometric unlock | P0 |
| F4 | Offline read of today’s schedule + emergency card | P1 |
| F5 | Localization: US English MVP; Spanish P1 | P1 |

### 8.7 Agentic AI — caregiver co-pilot (Pillar F)

Agent jobs are **tool-using workflows** with explicit permissions. Models orchestrate and explain; clinical facts come from licensed systems and user-confirmed data.

| ID | Requirement | Priority |
| --- | --- | --- |
| AG1 | **Chat / task UI** for caregivers: natural-language requests scoped to a patient profile (“What changed after discharge?” / “Prep me for the pharmacist”) | P0 |
| AG2 | **Intake agent**: parse PDF/photo/text → proposed medication diffs; each diff requires explicit accept/reject/edit before write | P0 |
| AG3 | **Explain agent**: given vendor interaction/allergy results, produce plain-language summary + “what to say” script; cite underlying alert IDs | P0 |
| AG4 | **Prepare agent**: generate Visit Packet narrative (recent changes, open Serious/Caution, questions)—user can edit before export | P0 |
| AG5 | **Watch agent**: optional background monitoring—nudge on unconfirmed intake, open Serious alerts, missed doses (if enabled); no silent regimen edits | P1 |
| AG6 | **Tool firewall**: agents may call only allowlisted tools (med CRUD *proposal*, interaction check, export draft, notify caregiver); no open web browse for clinical claims in MVP | P0 |
| AG7 | **Grounding rule**: interaction/allergy assertions must come from licensed engine outputs or user-entered facts—not model parametric memory | P0 |
| AG8 | **Full agent audit trail**: prompts/tool calls/results/user decisions retained for safety review (with retention policy) | P0 |
| AG9 | **Hallucination controls**: refuse dose-change advice; show “insufficient data” when list incomplete; block save of uncoded free-text meds into interaction path without review flag | P0 |
| AG10 | **Multi-caregiver agent context**: agent actions attributed to acting user; respects Viewer vs Caregiver roles | P1 |
| AG11 | **Eval harness**: golden tasks (intake, explain, prepare) with pharmacist-reviewed expected behaviors before each model/prompt change | P1 |
| AG12 | Voice input for caregiver agent tasks | P2 |

### 8.8 Platform expansion — clinical trials (Pillar G, post-MVP)

Not in consumer launch scope; requirements shape architecture so expansion is real.

| ID | Requirement | Priority |
| --- | --- | --- |
| CT1 | Domain model supports **study enrollment** linkage on a profile (study ID, site, participant ID) without forking med graph | P2 |
| CT2 | **Concomitant medication** report export suitable for coordinator review | P2 |
| CT3 | Flag potential **protocol-prohibited** med classes when a sponsor-provided ruleset is attached (rules externalized, not hard-coded per trial) | P2 |
| CT4 | Adherence and AE-related **note capture** reusable as trial diary inputs (export; not full EDC) | P2 |
| CT5 | Agent variant: “Trial prep” — explain concomitant risks + what to tell the study team (still human-confirmed) | P2 |
| CT6 | Consent, audit, and data-processing terms compatible with research / BAA pathways | P2 |
| CT7 | Explicit product boundary: MedicalPrep assists participants/caregivers and exports; sponsors retain EDC, safety database, and medical monitoring | P2 |

---

## 9. Alert UX specification (critical)

### 9.1 Severity → household action

| Severity | Meaning | UX behavior |
| --- | --- | --- |
| **Serious** | Known major interaction or allergy conflict; harm plausible | Full-screen interrupt on save; cannot complete without acknowledgment; CTA: “Call pharmacist / clinician” + Visit Packet shortcut |
| **Caution** | Moderate risk or monitoring needed | Inline banner + detail sheet; suggested questions for pharmacist |
| **Informational** | Minor / theoretical / timing tip | Subtle notice; educative |

### 9.2 Plain-language pattern (required)

Each alert must answer:

1. **What** — Drug A + Drug B (or class)  
2. **So what** — Everyday consequence (bleeding risk, sedation, reduced effect, etc.)  
3. **Now what** — Do not stop meds on your own; contact pharmacist/clinician; optional “I already discussed this”  

Avoid unexplained codes, raw professional-only severity scores, or dose-change instructions.

---

## 10. Data model (conceptual)

**Profile** → Patient demographics (minimal), timezone, accessibility prefs; optional future `StudyEnrollment`  
**Allergy** → substance, reaction, severity  
**Medication** → coded identity + display name, dose, schedule, status, source  
**InteractionAlert** → pair/set, severity, narrative, evidence version, status (open/acked/dismissed)  
**DoseEvent** → scheduled_at, status, actor (patient/caregiver)  
**ShareGrant** → grantee, role, scope, expires_at  
**AuditEvent** — immutable log for clinical-adjacent actions  
**AgentRun** → agent type, user, profile, tool calls, model/version, proposals, user decisions  
**MedChangeProposal** → pending structured diff from Intake agent pending human confirm  

Design for **provenance**: every medication records how it was added (manual, OCR, agent proposal, import) and last confirmed date.

---

## 11. Non-functional requirements

| Area | Requirement |
| --- | --- |
| **Privacy** | Encrypt data in transit (TLS 1.2+) and at rest; least-privilege access; clear data retention & deletion; PHI-aware LLM logging (minimize/redact where possible) |
| **Security** | MFA available; session controls; penetration testing before public launch; agent tool allowlist enforced server-side |
| **Compliance posture** | Consumer health app: privacy policy, state privacy laws (e.g., CCPA/CPRA); evaluate FDA SaMD / clinical decision support guidance with counsel before marketing interaction *or AI* claims; not marketed as diagnosing or treating disease |
| **AI safety** | Human-in-the-loop for regimen writes; grounding to vendor engine; eval gate on prompt/model changes; rate limits and abuse controls |
| **Reliability** | Core list + alert path ≥ 99.5% monthly uptime; graceful degradation if interaction vendor *or* LLM is down (deterministic alerts still work without chat) |
| **Performance** | Interaction check < 2s p95 for lists ≤ 30 meds; agent intake proposal < 30s p95 for typical discharge PDF |
| **Content freshness** | Interaction DB update SLA with vendor (target ≤ 30 days for material updates; critical safety patches faster) |
| **Accessibility** | WCAG 2.2 AA for web; platform accessibility guidelines for mobile |
| **Auditability** | Retain alert acknowledgment + agent decision logs for product safety review |

---

## 12. Technical approach (high level)

### 12.1 Recommended MVP stack orientation

- **Clients:** Mobile-first (React Native or native) *or* responsive web for faster caregiver desktop use—recommend **responsive web + iOS/Android wrappers** if a single team; agent chat optimized for caregiver phone + desktop  
- **Backend:** Authenticated API, multi-tenant profiles, audit log, **agent orchestration service** (tool router + policy)  
- **Drug & interaction data:** Licensed clinical content API—do **not** scrape or invent interaction logic; LLMs never sole source of interaction truth  
- **Identity coding:** RxNorm (US) as primary code system for MVP geography  
- **LLM layer:** Hosted model API with zero/short retention where available; system prompts + structured outputs; retrieval only from user profile + vendor results  

### 12.2 Agentic architecture (MVP)

```
Caregiver message / upload
        │
        ▼
┌───────────────────┐
│ Orchestrator      │  intent → agent (Intake | Explain | Prepare | Watch)
└─────────┬─────────┘
          │ allowlisted tools only
          ▼
┌───────────────────┐     ┌─────────────────────┐
│ Med graph + CRUD  │────▶│ Licensed interaction│
│ proposals / reads │     │ + allergy engine    │
└───────────────────┘     └─────────────────────┘
          │
          ▼
   Human confirm UI ──▶ committed regimen + audit
```

**Hard rule:** Tool `commit_medication_change` requires a prior user confirmation token; agents may only `propose_*`.

### 12.3 Key architectural decisions

| Decision | Recommendation | Rationale |
| --- | --- | --- |
| Build vs. buy interaction engine | **Buy/license** | Liability, completeness, maintenance |
| LLM role | Orchestrate + explain; **not** clinical DB | Hallucination / liability |
| Who confirms OCR/import/agent intake | Always **human confirm** | Safety |
| Caregiver access | Explicit grant, revocable | Trust & privacy |
| Classic lab TDM | **Defer** | Different product; high clinical liability |
| Clinical trials | **Phase 4+** on shared primitives | Avoid diluting caregiver MVP |
| Open-ended web research by agents | **Off in MVP** | Uncontrolled clinical claims |

### 12.4 Analytics (privacy-preserving)

Track product metrics (activation, alert ack rates, agent task completion, export usage)—not raw medication names in third-party analytics without careful review. Prefer aggregated/event taxonomy.

---

## 13. Success metrics

### 13.1 Product / engagement

| Metric | MVP target (90 days post-launch) |
| --- | --- |
| Activated profiles (≥3 active meds + allergies reviewed) | Baseline then +MoM growth |
| Caregiver link rate | ≥40% of activated profiles |
| Weekly active use (dose log or list view) | ≥50% of activated |
| Visit Packet / PDF export | ≥25% of activated use ≥1× |
| Caregivers completing ≥1 agent task/week | ≥50% of activated caregivers by day 60 |
| Intake proposals accepted (with or without edit) | Track quality; target high usefulness, not blind accept rate |

### 13.2 Safety quality (leading indicators)

| Metric | Intent |
| --- | --- |
| Serious alerts acknowledged | Near-100% before regimen save completes |
| Agent regimen commits without confirm | **Must be zero** |
| Ungrounded interaction claims in Explain agent | **Must be zero** in eval suite |
| Time-to-pharmacist action after Serious alert (self-reported) | Qualitative research |
| False-alarm complaint rate | Drive content/UX tuning; target downward trend |
| List completeness prompts completed (OTC/supplement step) | ≥70% of new profiles |

### 13.3 Outcome (research / longitudinal)

- Reduction in caregiver-reported “surprise” interactions at pharmacy  
- Qualitative: confidence managing grandparents’ polypharmacy (“for people like Ajay”)  
- Optional IRB-friendly studies / trial pilots later; not required for MVP ship  

---

## 14. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Incomplete medication list → missed interactions | Forced OTC/supplement step; “last confirmed” nudges; import later |
| Alert fatigue | Severity tiers; suppress duplicates; plain language; tune thresholds with pharmacists |
| Regulatory / marketing overclaim (esp. AI) | Legal review; careful claims; disclaimer UX; no “AI doctor” positioning |
| LLM hallucination of interactions or doses | Grounding + tool firewall + eval harness; deterministic engine remains source of truth |
| Data vendor gaps | Vendor SLA; show confidence/coverage notes; escalate to pharmacist |
| Caregiver conflict / overreach | Clear roles; patient/proxy consent; revoke access |
| Liability if user stops meds based on alert/agent | Explicit “do not stop without clinician”; no dose-change advice |
| Accessibility barriers for elders | Elder usability testing; caregiver-first + agentic flows |
| Scope creep into full CTMS/EDC | Hard product boundary (CT7); export/assist only |
| PHI leakage to model providers | BAA/DPAs, retention controls, minimization, audit |

---

## 15. Go-to-market and positioning

**Positioning:** “Agentic AI for family medication safety—built for caregivers managing real polypharmacy, not another pill reminder.”

**Initial channels:**

- Adult children/grandchildren of aging parents (caregiver communities, eldercare content)—**people like Ajay**  
- Partnerships with independent pharmacies and geriatric care navigators  
- Discharge / transitional care education (content, not clinical integration at first)  

**Later channels (trials):**

- Site networks / CRO participant-support pilots  
- Sponsors needing better concomitant-med + adherence signal from home (export-based)  

**Pricing (hypothesis for validation):**

| Tier | Idea |
| --- | --- |
| Free | 1 profile, basic reminders, limited history, limited agent runs |
| Family | Multiple profiles, caregivers, Visit Packet, full interaction history, generous agent usage |
| Later | Pharmacy / care-org B2B2C; **Research** tier for trial sites |

Validate willingness to pay with caregivers before locking pricing.

---

## 16. Milestones

| Phase | Deliverables | Outcome |
| --- | --- | --- |
| **Phase 0 — Discovery** (2–4 weeks) | Caregiver interviews (n≥10, include Ajay-like users), pharmacist advisory, interaction vendor + LLM/vendor security shortlist, AI claims regulatory memo | Problem/solution fit |
| **Phase 1 — MVP** (8–12 weeks) | Med list + allergies + interaction engine + severity UX + caregiver share + PDF export + reminders + **Intake / Explain / Prepare agents** (human-confirm) | Private beta with families |
| **Phase 2 — Trust** | Watch agent, OCR assist, missed-dose caregiver alerts, Spanish, adherence summaries, emergency card, agent eval harness in CI | Public launch readiness |
| **Phase 3 — Continuity** | Pharmacy/FHIR import, structured export, partner pilots | Reduce manual entry burden |
| **Phase 4 — Trials expansion** | Study enrollment linkage, concomitant-med export, externalized protocol rulesets, Trial prep agent, site pilot | Second application of the platform |

---

## 17. Open questions

1. MVP platform: native mobile vs. responsive web first?  
2. Geography: US-only drug data at launch?  
3. Who is the legal account holder for a cognitively impaired patient (proxy flows)?  
4. Which interaction content vendor meets clinical + commercial constraints?  
5. Should “Serious” alerts ever block saving a medication, or only require acknowledgment?  
6. How aggressive should we be about food/alcohol warnings without increasing fatigue?  
7. Will we pursue any FDA-regulated CDS pathway, or stay in non-device / informational consumer guidance with counsel’s approval?  
8. Which LLM host meets PHI / retention / BAA needs for caregiver documents?  
9. How many free agent runs before Family tier—avoid both abuse and “AI feels locked”?  
10. First trial wedge: concomitant-med export vs. adherence diary vs. protocol conflict flags?  

---

## 18. Appendix A — Example scenarios (product acceptance)

Use these as acceptance-test narratives (illustrative; final interaction rules from licensed content):

1. **Warfarin + new NSAID OTC** → Serious/Caution per content; Explain agent: bleeding risk; no dose change; pharmacist CTA.  
2. **Two anticholinergic agents** → Duplicate/class caution; sedation/confusion framing for older adults.  
3. **St. John’s wort + prescription** → Supplement interaction path must fire (validates OTC capture).  
4. **Allergy: penicillin + amoxicillin** → Allergy conflict Serious.  
5. **Caregiver adds med** → Owner notified; audit shows actor; interactions re-run.  
6. **Discharge PDF intake** → Intake agent proposes diffs; none committed until Ajay confirms; then interactions re-run.  
7. **Explain without vendor hit** → Agent must refuse to invent an interaction; may say data incomplete.  
8. **Trial (future):** participant adds prohibited-class OTC → protocol ruleset flag + notify to tell study team (not silent fix).  

---

## 19. Appendix B — Glossary

| Term | Meaning in this PRD |
| --- | --- |
| **TDM (clinical)** | Measuring drug levels in blood to guide dosing—**out of MVP scope** |
| **Consumer TDM (this product)** | Ongoing monitoring of the *home medication regimen* for safety, adherence, and coordination |
| **Agentic AI** | Tool-using AI workflows that pursue a caregiver goal (intake, explain, prepare, watch) with human confirmation on regimen changes |
| **Polypharmacy** | Concurrent use of multiple medications (often ≥5) |
| **CDS** | Clinical decision support |
| **Visit Packet** | Exportable snapshot for appointments |
| **Concomitant medications** | Drugs taken alongside a study intervention in a clinical trial |
| **Grounding** | Requiring clinical assertions to come from licensed engines or user-confirmed data, not model memory |

---

## 20. Appendix C — Strategic intent (source notes)

Product direction informed by founder intent (2026-07-31):

1. Build software with **agentic AI** for caregivers **like Ajay** (family managers of complex regimens).  
2. Design the platform to **extend to other applications**, including **clinical trials**, after the consumer caregiver wedge is proven.

---

## 21. Approval

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Product | | | |
| Engineering | | | |
| Design | | | |
| Clinical / pharmacy advisor | | | |
| Legal / privacy | | | |

---

*This PRD is a living document. Interaction severity, vendor choice, agent/LLM posture, and regulatory claims (including AI) must be finalized with licensed clinical content and counsel before public marketing.*
