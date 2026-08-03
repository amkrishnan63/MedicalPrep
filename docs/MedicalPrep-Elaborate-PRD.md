# MedicalPrep  
## Elaborate Product Requirements Document  
### Consumer Therapeutic Drug Monitoring · Agentic Caregiver AI · Platform Path to Clinical Trials

| Field | Value |
| --- | --- |
| **Product name** | MedicalPrep |
| **Document type** | Elaborate Product Requirements Document (PRD) |
| **Version** | 2.1 |
| **Status** | Draft — for founder / advisor review · aligned to working prototype |
| **Date** | 2026-08-02 |
| **Companion summary** | [PRD-therapeutic-drug-monitoring.md](./PRD-therapeutic-drug-monitoring.md) (v1.1 condensed) |
| **Deploy notes** | [VERCEL.md](./VERCEL.md) · [FIREBASE-MFA.md](./FIREBASE-MFA.md) |
| **Geographic focus (MVP)** | United States |
| **Primary language (MVP)** | English (US); Spanish planned |

---

## Document control

### Change history

| Version | Date | Summary |
| --- | --- | --- |
| 1.0 | 2026-08-01 | Initial consumer TDM PRD |
| 1.1 | 2026-08-01 | Agentic AI + clinical trials roadmap |
| 2.0 | 2026-08-02 | Elaborate PRD: market, stories, agent specs, UX, data, compliance, trials deep-dive |
| **2.1** | **2026-08-02** | **Align to working web prototype: Firebase Auth, Postgres, OpenAI Assistant, demo safety engine, Vercel** |

### Founder brief (source of truth)

Captured 2026-07-31 — Ajay Krishnan:

1. **Develop a PRD for therapeutic drug monitoring software for individual consumer use.** Motivation: grandparents take many medicines; family worried about interactions.  
2. **Develop software that uses agentic AI**, used by others like Ajay (family caregivers who want a capable delegate, not another form).  
3. **Extend to other applications**, including **clinical trials**.

This document elaborates all three intents into one coherent product strategy and specification.

### Implementation status (prototype — 2026-08-02)

A **working Next.js web app** exists in this repository. It is a **family-caregiver MVP prototype**, not yet a licensed-clinical-content product.

| Area | Prototype today | PRD target (later) |
| --- | --- | --- |
| Clients | Responsive web (`/app/*`) | + native / PWA polish |
| Auth | Firebase Email/Password → app session cookie | MFA, SSO, biometrics |
| Data | Prisma + **PostgreSQL** (Vercel/Neon for prod; same URL locally) | Same; encrypted object store for uploads |
| Med / allergy / dose / share | Implemented (CRUD, roles OWNER/CAREGIVER/VIEWER) | RxNorm depth, FHIR import |
| Safety engine | **Demo** in-app rules + drug catalog (seed data) | Licensed interaction vendor |
| Agents | Intake / Explain / Prepare via **OpenAI** (`OPENAI_API_KEY`) with human confirm on writes | Eval harness, Watch agent, tool firewall maturity |
| Explain posture | OpenAI answers using profile meds/allergies/alerts; may add **labeled general educational** interaction context when no coded alert matches; never autonomously changes regimen | Prefer licensed-engine claims; keep refuse-to-dose-change |
| Visit Packet | Printable HTML/PDF path | Time-limited share links |
| Hosting | Vercel + env vars (`DATABASE_URL`, `DIRECT_URL`, Firebase, OpenAI) | Same family; BAAs as needed |
| Sample data | “Grandma Eleanor” demo profile + seeded drug/interaction catalog | Expand golden-task sets |

**Disclaimer in product:** Educational/informational only; not a substitute for a pharmacist or clinician; demo knowledge is not a licensed clinical database.

### How to use this document

| Audience | Use |
| --- | --- |
| Founders / product | Strategy, scope, prioritization, open decisions |
| Design | Personas, journeys, alert UX, agent confirmation patterns |
| Engineering | Requirements, data model, agent tool firewall, NFRs |
| Clinical / pharmacy advisors | Safety posture, alert language, eval criteria |
| Legal / privacy | Claims boundaries, AI posture, research expansion constraints |
| Advisors / investors | Vision → wedge → platform narrative |

---

## Table of contents

1. [Executive summary](#1-executive-summary)  
2. [Vision, mission, and strategy](#2-vision-mission-and-strategy)  
3. [Problem and market context](#3-problem-and-market-context)  
4. [Competitive landscape](#4-competitive-landscape)  
5. [Users, personas, and jobs-to-be-done](#5-users-personas-and-jobs-to-be-done)  
6. [Goals, non-goals, and success metrics](#6-goals-non-goals-and-success-metrics)  
7. [Product principles](#7-product-principles)  
8. [Product pillars and scope](#8-product-pillars-and-scope)  
9. [Detailed user journeys](#9-detailed-user-journeys)  
10. [Functional requirements and user stories](#10-functional-requirements-and-user-stories)  
11. [Agentic AI specification](#11-agentic-ai-specification)  
12. [Alert and safety UX](#12-alert-and-safety-ux)  
13. [Information architecture and key screens](#13-information-architecture-and-key-screens)  
14. [Data model](#14-data-model)  
15. [Clinical trials expansion](#15-clinical-trials-expansion)  
16. [Technical architecture](#16-technical-architecture)  
17. [Non-functional, security, and compliance](#17-non-functional-security-and-compliance)  
18. [Go-to-market and pricing](#18-go-to-market-and-pricing)  
19. [Roadmap and milestones](#19-roadmap-and-milestones)  
20. [Risks, assumptions, and open questions](#20-risks-assumptions-and-open-questions)  
21. [Appendices](#21-appendices)  
22. [Approval](#22-approval)

---

## 1. Executive summary

### 1.1 What MedicalPrep is

MedicalPrep is a **consumer medication-safety platform** for households managing **polypharmacy**—especially older adults and the adult children/grandchildren who help them. It combines:

1. A **trusted, living medication record** (prescriptions, OTCs, vitamins, supplements, allergies)  
2. **Continuous interaction and duplicate-therapy intelligence** (demo rules in prototype → **licensed clinical content** at launch)  
3. **Agentic AI** that does caregiver work: intake from discharge papers, plain-language risk explanation, visit preparation, and ongoing watchfulness  
4. A **platform foundation** that can later serve **clinical trial** participant support (concomitant meds, protocol flags, adherence signal)—without becoming an EDC/CTMS

### 1.2 What MedicalPrep is not

| Not this | Why it matters |
| --- | --- |
| Hospital / lab therapeutic drug monitoring (serum levels, PK dosing) | Different users, liability, and workflows |
| An “AI doctor” that changes doses autonomously | Unsafe and non-viable for consumer trust/regulation |
| A full EHR, pharmacy, or insurance system | Wrong wedge; dilutes focus |
| A trial EDC / CTMS / safety database | Sponsors keep those; we assist and export |

**Consumer TDM in this product means:** ongoing monitoring of the *home regimen* for safety, adherence, and coordination—not blood-level interpretation.

### 1.3 One-line vision

**Agentic AI that family caregivers trust to keep multi-drug regimens safe—and a platform that grows from households to trial participants.**

### 1.4 Why now

- Aging population + rising polypharmacy → more interaction risk at home  
- Caregivers are digitally fluent but time-poor → ready for **delegates**, not dashboards  
- LLMs make document intake and plain-language explanation practical—**if** grounded in licensed drug knowledge  
- Trials struggle with concomitant meds and home adherence visibility → natural second application of the same primitives  

### 1.5 Wedge → platform

```
Phase 1–2          Phase 3              Phase 4+
───────────        ──────               ────────
Family caregiver   Continuity           Clinical trials
polypharmacy +     (pharmacy/FHIR       (concomitant meds,
agentic AI         import, partners)    protocol flags,
                                        participant support)
        └── shared: med graph · alerts · agents · audit · consent ──┘
```

---

## 2. Vision, mission, and strategy

### 2.1 Vision (5–10 years)

Every household—and eventually every research participant who needs it—has a **single, trustworthy medication graph**, continuously checked for harm, explained in human language, and tended by AI agents that never outrun human and clinician judgment.

### 2.2 Mission (near term)

Help families like Ajay’s keep grandparents safer on complex regimens by combining a complete home medication list, licensed interaction intelligence, and agentic AI that removes busywork while keeping people in control.

### 2.3 Strategic bets

| Bet | Implication |
| --- | --- |
| **Caregiver is the buyer** | Optimize UX, messaging, and pricing for adult children/grandchildren first |
| **Agents are the differentiator** | Reminders alone are commoditized; intake + explain + prepare + watch are the product |
| **License clinical truth** | Do not build or hallucinate an interaction database |
| **Human confirm on writes** | Non-negotiable safety architecture |
| **Platform primitives early** | Med graph, alerts, agents, audit designed so trials are an *application*, not a rewrite |

### 2.4 Product thesis (one paragraph)

Static medication apps fail caregivers because the hard work is **reconciliation, interpretation, and vigilance**. MedicalPrep makes the medication list a living source of truth, runs deterministic safety checks, and wraps agentic AI around that truth so people like Ajay can upload a discharge summary, understand what matters, prepare for the pharmacist, and know the system is watching—without ever letting AI silently change a regimen. Once that loop works for families, the same loop extends to clinical trial concomitant-medication and adherence support.

---

## 3. Problem and market context

### 3.1 The household problem (detail)

Older adults commonly receive medications from:

- Primary care  
- Cardiology, endocrinology, neurology, pain, psychiatry, and other specialists  
- Hospital / ED discharge  
- Retail and mail-order pharmacies (sometimes more than one)  
- Self-selected OTCs and supplements (often invisible to clinicians)

**Failure modes families experience:**

| Failure mode | Example | Family impact |
| --- | --- | --- |
| Invisible interaction | New NSAID + anticoagulant | Bleeding risk unnoticed until event or pharmacy catch |
| Duplicate therapy | Two similar sleep / anticholinergic agents | Confusion, falls, sedation |
| Fragmented list | Portal A ≠ Portal B ≠ pill organizer | Wrong list at appointment |
| Post-discharge chaos | Stopped/started meds in fine print | Caregiver spends hours decoding |
| OTC blind spot | St. John’s wort, antacids, melatonin | Interactions never checked |
| Alert without action | Dense clinical warning | Caregiver freezes or ignores |

### 3.2 Problem statements (jobs language)

1. **When** a new prescription, OTC, or discharge happens, **caregivers need** to know if the full regimen is still safe—**so that** they can escalate before harm.  
2. **When** preparing for a visit, **caregivers need** a clean current list and the right questions—**so that** clinicians see the real home regimen.  
3. **When** day-to-day life is busy, **caregivers need** a delegate that watches and drafts—**so that** safety does not depend on heroic memory.

### 3.3 Market context (directional)

Use for planning, not as audited TAM figures—validate in discovery:

- Large and growing population of older adults on ≥5 medications  
- Millions of unpaid family caregivers in the US, many digitally reachable  
- Consumer health apps crowded on *reminders*; thin on *trusted interaction + caregiver agents*  
- Clinical research spend high; participant support and concomitant-med quality remain operational pain  

**Initial beachhead:** US adult caregivers of parents/grandparents on polypharmacy, especially after hospital discharge or multi-specialist care.

### 3.4 Insight: “TDM” for consumers

Classical TDM = measure drug concentration → adjust dose (clinic/lab).

**MedicalPrep consumer TDM** = continuously monitor the *regimen and its risks* at home:

| Classical TDM | MedicalPrep consumer TDM |
| --- | --- |
| Blood levels | Medication list completeness |
| PK models | Interaction / duplicate / allergy engines |
| Prescriber dosing | Caregiver coordination + escalation |
| Hospital pharmacy | Household + agentic assistance |

Naming note: externally, prefer language like “medication safety” / “family medication co-pilot” unless “therapeutic drug monitoring” is intentionally used with clear consumer definition (avoid clinical confusion).

---

## 4. Competitive landscape

### 4.1 Category map

| Category | Examples (illustrative) | Strength | Gap vs MedicalPrep |
| --- | --- | --- | --- |
| Pill reminders | Medisafe-style apps | Habit loops | Weak interaction depth; weak caregiver agents |
| Pharmacy apps | Retail pharmacy apps | Fill + some checks | Incomplete across pharmacies; OTCs weak |
| Patient portals | Health-system portals | Official Rx | Fragmented; not household source of truth |
| Consumer checkers | Web interaction checkers | Quick lookup | One-off; no regimen memory; no agents |
| Caregiver platforms | General eldercare apps | Family sharing | Med safety not core; not agentic intake |
| Clinical TDM / CDS | Hospital tools | Clinical rigor | Not for home caregivers |
| Trial eCOA / eDiary | Research apps | Protocol fit | Narrow; not family polypharmacy wedge |

### 4.2 Differentiation

MedicalPrep wins if it is the only place that simultaneously offers:

1. **Complete home regimen** (Rx + OTC + supplements)  
2. **Licensed continuous interaction intelligence**  
3. **Agentic caregiver workflows** with human confirmation  
4. **Visit-ready exports** clinicians actually use  
5. **Credible path** to trial participant support on the same core  

### 4.3 Positioning statement

For **adult family caregivers** who manage **complex medication regimens** for older relatives, MedicalPrep is the **agentic medication-safety co-pilot** that keeps a living home medication list, checks interactions continuously, and prepares you for the pharmacist or clinician—unlike reminder apps that only nag, or portals that only show one system’s prescriptions.

---

## 5. Users, personas, and jobs-to-be-done

### 5.1 Persona: Ajay — Agentic caregiver (primary buyer / design target)

| Attribute | Detail |
| --- | --- |
| Role | Adult child or grandchild; unpaid care coordinator |
| Context | Grandparents on 6–15 meds; multiple doctors; lives nearby or remote |
| Tech comfort | High; expects modern AI products to *do work* |
| Anxiety | Interactions, post-discharge errors, “Did anyone check the full list?” |
| Time | Scarce; bursts of effort around events (discharge, new Rx) |
| Success | Confident, current list; knows top risks; walks into pharmacy prepared |

**Jobs-to-be-done**

| Job | Importance | Current workaround |
| --- | --- | --- |
| Build/update accurate med list quickly | Critical | Spreadsheet, photos in camera roll |
| Know if new thing is dangerous | Critical | Google + hope pharmacist notices |
| Coordinate siblings / spouse | High | Group chat chaos |
| Prepare for appointments | High | Handwritten list, forgotten OTCs |
| Stay vigilant between events | Medium–High | Nothing systematic |

**Day-in-the-life triggers**

- Hospital discharge PDF arrives by email  
- Grandparent says “the new doctor gave me something for sleep”  
- Sibling texts a photo of a bottle  
- PCP visit in 48 hours  
- Missed evening dose pattern emerges  

**Product must feel like:** a junior chief-of-staff for medications—fast, careful, never reckless.

### 5.2 Persona: Eleanor — Older adult (primary patient user)

| Attribute | Detail |
| --- | --- |
| Age | ~70–90 |
| Regimen | Many daily meds + occasional OTCs |
| Constraints | Vision, memory load, smaller motor targets |
| Attitude | Wants simplicity; distrusts scary medical jargon |
| Success | Knows what to take when; feels family is aligned |

**Jobs:** take the right pills at the right time; answer “what do you take?” at visits; not feel scolded by the app.

### 5.3 Persona: Marcus — Pharmacist / clinician (secondary)

| Attribute | Detail |
| --- | --- |
| Need | Accurate list + allergies + what changed recently |
| Constraint | Minutes per encounter |
| Success | Patient/caregiver hands him a clean Visit Packet |

### 5.4 Persona: Dana — Trial coordinator (future)

| Attribute | Detail |
| --- | --- |
| Need | Concomitant meds, adherence signal, participant questions |
| Constraint | Protocol + sponsor systems already exist |
| Success | Fewer surprises; cleaner exports into study workflow |

### 5.5 Anti-personas

- Users seeking recreational multi-drug “checkers”  
- Clinics wanting EHR replacement  
- Teams needing classical serum TDM / PK dashboards  
- Users wanting fully autonomous AI prescribing  

### 5.6 Permission model (household)

| Role | Can view | Can edit regimen | Can run agents that propose edits | Can invite others | Can export |
| --- | --- | --- | --- | --- | --- |
| Owner / proxy | Yes | Yes | Yes | Yes | Yes |
| Caregiver | Yes | Yes | Yes | No (unless granted) | Yes |
| Viewer | Yes | No | Explain/Prepare only (no intake commit) | No | Yes (if allowed) |

Patient (or legal proxy) consent is required before sharing.

---

## 6. Goals, non-goals, and success metrics

### 6.1 MVP goals

| ID | Goal | Success signal (90 days post-launch) |
| --- | --- | --- |
| G1 | Complete home medication list | ≥90% activated users have profile with ≥3 meds |
| G2 | Meaningful interaction / duplicate risk in plain language | Users can name top risks without clinical training |
| G3 | Caregiver collaboration | ≥40% profiles linked to second trusted user in 60 days |
| G4 | Adherence support | Weekly engagement ≥50% activated on schedule or list |
| G5 | Clear escalation | Every Serious alert has pharmacist/clinician CTA |
| G6 | Agents caregivers use | ≥50% activated caregivers ≥1 agent task/week by day 60 |
| G7 | Platform-ready architecture | Shared domain + agent tools documented; no consumer-only dead ends |

### 6.2 Non-goals (v1)

- Replace physician/pharmacist judgment  
- Serum-level / PK dosing (classical TDM)  
- Diagnose conditions or recommend new Rx drugs  
- Autonomous AI regimen changes  
- LLM as sole interaction authority  
- Pharmacy dispensing / e-prescribing / insurance adjudication  
- Full EDC / CTMS / SAE adjudication  
- Global formulary completeness guarantee  

### 6.3 Metrics framework

**North star (consumer):** *Caregiver-weeks with a confirmed-complete regimen and zero unresolved Serious alerts older than 7 days.*

**Product / engagement**

| Metric | Target / intent |
| --- | --- |
| Activated profile rate | Growth MoM after baseline |
| Caregiver link rate | ≥40% / 60 days |
| WAU (list, dose, or agent) | ≥50% activated |
| Visit Packet export | ≥25% activated ≥1× |
| Agent tasks / caregiver / week | ≥1 for ≥50% by day 60 |
| Intake accept-with-edit rate | High usefulness (quality), not blind accept |

**Safety quality (leading)**

| Metric | Intent |
| --- | --- |
| Serious alert acknowledgment before save | ~100% |
| Agent commits without human confirm | **Zero** |
| Ungrounded interaction claims in eval | **Zero** |
| OTC/supplement step completion | ≥70% new profiles |
| False-alarm complaints | Downward trend |

**Qualitative**

- “I feel confident managing my grandparents’ medicines.”  
- “The pharmacist said this list was helpful.”  
- “The agent saved me an hour after discharge.”  

---

## 7. Product principles

1. **Safety over engagement** — Never gamify dismissing Serious risk.  
2. **Plain language first** — Household actions, not jargon dumps.  
3. **Incomplete data is dangerous** — Prefer uncertainty over false confidence.  
4. **Caregiver is first-class** — Designed for Ajay, usable by Eleanor.  
5. **Escalate, don’t prescribe** — No dose-change instructions from the product.  
6. **Privacy by default** — Explicit share; minimize PHI in logs.  
7. **Agents assist; humans decide** — Propose ≠ commit.  
8. **Deterministic clinical truth, generative explanation** — Engine facts; model words.  
9. **Platform primitives over feature islands** — Build for reuse (trials later).  
10. **Degrade gracefully** — If AI is down, list + deterministic alerts still work.  

---

## 8. Product pillars and scope

```
┌────────────────────────────────────────────────────────────┐
│ A  Medication identity & regimen                           │
│ B  Interaction & risk intelligence                         │
│ C  Schedule, adherence & daily use                         │
│ D  Care team & household sharing                           │
│ E  Appointments, export & continuity                       │
│ F  Agentic AI (caregiver co-pilot)                         │
│ G  Platform expansion — clinical trials (post-MVP)         │
└────────────────────────────────────────────────────────────┘
```

**MVP includes:** A–E (core) + F (Intake, Explain, Prepare).  
**Launch+:** Watch agent, richer adherence, emergency card, Spanish.  
**Later:** FHIR/pharmacy import, trials (G).

---

## 9. Detailed user journeys

### 9.1 Journey J1 — First-week setup (caregiver-led)

**Actor:** Ajay  
**Trigger:** Decides to get grandparents’ meds under control  

| Step | User action | System response | Notes |
| --- | --- | --- | --- |
| 1 | Creates account | Auth + empty household | MFA available |
| 2 | Creates profile “Grandma Eleanor” | Profile shell | Timezone set |
| 3 | Uploads discharge PDF / bottle photos | Intake agent proposes diffs | Nothing saved yet |
| 4 | Accepts/edits/rejects each proposal | Meds committed with provenance | Audit attributed to Ajay |
| 5 | Completes OTC/supplement prompt | List marked more complete | Block soft-skip with warning |
| 6 | Adds allergies | Allergy store | |
| 7 | Views baseline safety review | Explain agent + severity UI | Serious → clear CTA |
| 8 | Invites sibling as Caregiver/Viewer | Magic link grant | Consent recorded |

**Success:** Activated profile + first Visit Packet available.

### 9.2 Journey J2 — New OTC at the store

**Trigger:** Eleanor buys ibuprofen; Ajay hears later  

| Step | Action | System |
| --- | --- | --- |
| 1 | Ajay adds ibuprofen (or photo) | Identity coded |
| 2 | Engine runs | Interaction vs warfarin → Serious/Caution per content |
| 3 | Full-screen / strong interrupt | Explain agent: bleeding risk; do not stop warfarin alone; call pharmacist |
| 4 | Ajay acknowledges + optional “discussed” | Audit; export questions |

### 9.3 Journey J3 — Daily adherence (Eleanor + optional caregiver)

| Step | Action | System |
| --- | --- | --- |
| 1 | Morning notification | Due doses |
| 2 | Marks taken / skipped | DoseEvent |
| 3 | Pattern of misses | Watch agent (P1) notifies Ajay if enabled |

### 9.4 Journey J4 — Clinic visit prep

| Step | Action | System |
| --- | --- | --- |
| 1 | “Prep me for Thursday’s appointment” | Prepare agent |
| 2 | Ajay edits narrative / questions | Human polish |
| 3 | Exports PDF or time-limited link | Visit Packet |

### 9.5 Journey J5 — Agentic discharge reconciliation (hero flow)

1. Upload discharge summary  
2. Intake proposes: stop X, start Y, change Z dose  
3. Ajay confirms line by line (side-by-side source highlight)  
4. Engine + Explain produce ranked risks  
5. Watch tracks unacknowledged Serious items  
6. Prepare generates pharmacist script  

### 9.6 Journey J6 — Future trial participant (Phase 4)

1. Profile linked to study enrollment  
2. Protocol ruleset attached (prohibited classes)  
3. New OTC triggers protocol flag + “tell study team” script  
4. Concomitant med report exported for coordinator  

---

## 10. Functional requirements and user stories

Priority: **P0** MVP · **P1** launch+ · **P2** later

### 10.1 Pillar A — Medication identity & regimen

| ID | Requirement | Pri |
| --- | --- | --- |
| A1 | Full CRUD: name (brand/generic), strength, form, dose, route, frequency, times, PRN, indication, prescriber, pharmacy, start/stop, active/inactive | P0 |
| A2 | RxNorm (or equiv.) coding with free-text + `needs_review` fallback | P0 |
| A3 | Explicit OTC / vitamin / herbal / supplement capture | P0 |
| A4 | Allergy & intolerance list (substance, reaction, severity) | P0 |
| A5 | Condition list for condition–drug warnings | P1 |
| A6 | Photo → OCR suggestions; confirm before save | P1 |
| A7 | Barcode / NDC scan | P2 |
| A8 | Pharmacy/portal import (FHIR) + reconcile UI | P2 |

**Example stories**

- *As Ajay, I can add Grandma’s meds from a discharge PDF so I don’t type everything.*  
- *As Ajay, I am forced to consider OTCs/supplements so interaction checks aren’t blind.*  
- *As Eleanor, I can see my list in large text so I can verify it.*  

**Acceptance (A2):** Saving a med either attaches a code or sets `needs_review=true` and excludes it from “fully checked” confidence until resolved.

### 10.2 Pillar B — Interaction & risk intelligence

| ID | Requirement | Pri |
| --- | --- | --- |
| B1 | DDI check on every add/edit/activate across full active list | P0 |
| B2 | Drug–OTC / drug–supplement checks | P0 |
| B3 | Duplicate therapy / class overlap | P0 |
| B4 | Allergy–drug conflicts | P0 |
| B5 | ≥3 severity levels → household actions | P0 |
| B6 | Alert content: what / so what / now what (no dose changes) | P0 |
| B7 | Serious: acknowledge required; Caution/Info dismiss with reason | P0 |
| B8 | Food / alcohol / grapefruit-style flags | P1 |
| B9 | Age / organ-function sensitive warnings if profile data present | P1 |
| B10 | Narrow-therapeutic-index *awareness* (not lab interpretation) | P1 |
| B11 | Licensed vendor content with update SLA | P0 |
| B12 | Alert audit log | P0 |

**Safety copy (required on interaction surfaces):** MedicalPrep does not replace professional medical advice. Do not start, stop, or change medications based only on this app. Consult a pharmacist or clinician.

### 10.3 Pillar C — Schedule & adherence

| ID | Requirement | Pri |
| --- | --- | --- |
| C1 | Daily timeline + timezone | P0 |
| C2 | Notifications + quiet hours | P0 |
| C3 | taken / skipped / late / snoozed | P0 |
| C4 | PRN logging | P1 |
| C5 | Caregiver missed-dose alerts (opt-in) | P1 |
| C6 | 7/30-day adherence summary | P1 |
| C7 | Refill / days’-supply reminders | P2 |

### 10.4 Pillar D — Household sharing

| ID | Requirement | Pri |
| --- | --- | --- |
| D1 | Multi-profile (self + dependents) | P0 |
| D2 | Invite via email/SMS magic link | P0 |
| D3 | Roles: Owner, Caregiver, Viewer | P0 |
| D4 | Consent before share | P0 |
| D5 | Activity feed (who changed what) | P0 |
| D6 | Emergency card (allergies + critical meds), offline-capable | P1 |
| D7 | Multi-caregiver conflict: last-write + history | P1 |

### 10.5 Pillar E — Export & continuity

| ID | Requirement | Pri |
| --- | --- | --- |
| E1 | PDF / printable med list | P0 |
| E2 | Visit Packet: meds + allergies + open Serious + recent changes | P0 |
| E3 | Time-limited read-only link | P1 |
| E4 | FHIR MedicationRequest / MedicationStatement export | P2 |
| E5 | Appointment question checklist | P1 |

### 10.6 Account, accessibility, platforms

| ID | Requirement | Pri |
| --- | --- | --- |
| PL1 | iOS + Android and/or excellent responsive web (decision in §16) | P0 |
| PL2 | Dynamic type, contrast, VoiceOver/TalkBack on core flows | P0 |
| PL3 | Email auth + SSO options; biometric unlock | P0 |
| PL4 | Offline: today’s schedule + emergency card | P1 |
| PL5 | US English; Spanish P1 | P1 |

---

## 11. Agentic AI specification

### 11.1 Design doctrine

| Rule | Statement |
| --- | --- |
| R1 | Agents may **propose** regimen changes; only humans **commit** |
| R2 | Coded interaction/allergy **alerts** come from the safety engine (demo rules today; licensed vendor at launch) or user-confirmed profile data |
| R3 | LLMs (**OpenAI** in prototype) may **orchestrate, extract, summarize, phrase, and educate**—they must not silently change the regimen |
| R4 | Tools are **allowlisted** and enforced server-side |
| R5 | Every agent run is **audited** (tool calls, proposals, decisions, model version) |
| R6 | For **regimen writes**, if extraction/coding fails, agent marks `needs_review` rather than inventing codes |
| R7 | Agents never instruct a specific new dose or to stop a drug unilaterally—always route to pharmacist/clinician confirmation |

### 11.2 Agent catalog

| Agent | Goal | MVP |
| --- | --- | --- |
| **Intake** | Turn documents/photos/text into structured med diffs | P0 |
| **Explain** | Turn engine alerts into plain language + scripts | P0 |
| **Prepare** | Draft Visit Packet narrative + top questions | P0 |
| **Watch** | Background nudges (unconfirmed intake, open Serious, misses) | P1 |
| **Trial prep** | Concomitant + protocol communication (future) | P2 |

### 11.3 Allowlisted tools (MVP)

| Tool | Purpose | Writes regimen? |
| --- | --- | --- |
| `get_profile_meds` | Read active/inactive meds | No |
| `get_allergies` | Read allergies | No |
| `get_alerts` | Read current engine alerts | No |
| `propose_med_changes` | Create `MedChangeProposal` set | Proposal only |
| `run_interaction_check` | Invoke safety engine (demo rules → licensed later) | No |
| `draft_visit_packet` | Create editable export draft | No |
| `notify_caregiver` | Push/email nudge | No |
| `commit_med_changes` | Apply proposals | **Yes — requires user confirmation token** |

**Forbidden in MVP:** open web browse for clinical claims; arbitrary code exec; emailing clinicians automatically without user action; silent commits.

### 11.4 Intake agent — detail

**Inputs:** Pasted text (PDF/OCR later); optional user hint.  

**Prototype implementation:** OpenAI extracts structured `add | change | stop` drafts as JSON when `OPENAI_API_KEY` is set; each draft is **re-resolved** against the local drug catalog. Falls back to rule-based line parsing if the LLM call fails.  

**Outputs:** Ordered list of proposals:

```text
op: add | change | stop
display_name, strength, form, dose, frequency, schedule?, rxnorm?,
confidence: high | medium | low
evidence: { page/region quote or OCR snippet }
needs_review: boolean
```

**UX:** “Proposed row” with Accept / Reject per item; **Confirm selected changes** commits with a confirmation token. Nothing is saved until confirm.  

**Failure modes**

| Failure | Behavior |
| --- | --- |
| Unreadable / empty extract | Fall back to rules or ask for clearer text; no silent fake meds |
| Ambiguous drug | Propose with `needs_review` |
| Conflict with existing list | Present as change/stop, not silent overwrite |

### 11.5 Explain agent — detail

**Inputs:** Caregiver question + profile meds, allergies, and current safety-engine alerts.  

**Prototype implementation:** OpenAI generates a natural-language answer. It should:

1. Prefer / highlight any **matching safety-engine alerts**  
2. When no coded alert matches, still answer helpfully using **general educational pharmaceutical knowledge**, clearly labeling that part as educational (not a MedicalPrep coded alert)  
3. Use the active medication list for context  
4. Never tell the user to start/stop/change a medicine on the agent’s own authority  

**Hard constraints (product):** No autonomous regimen writes. Always end with “educational only / ask pharmacist or clinician.”  

**Launch target:** Prefer licensed-engine citations (`alert_id`) for any firm interaction claim used in marketing or “safety checked” UI states.

### 11.6 Prepare agent — detail

**Inputs:** Meds, allergies, alerts, recent changes (e.g., 30 days), optional appointment type.  

**Prototype implementation:** Builds a Visit Packet from live profile data; OpenAI may polish narrative + ≤5 questions when configured.  

**User must** preview/edit before share/export (print / save PDF in prototype).

### 11.7 Watch agent — detail (P1)

**Triggers:** unconfirmed proposals > N hours; Serious alert open > N hours; missed dose streak; list not confirmed in N days.  
**Actions:** notify only; never edit regimen.

### 11.8 Orchestration

```
Caregiver message / upload
        │
        ▼
┌───────────────────┐
│ Orchestrator      │  intent → Intake | Explain | Prepare | Watch
│ (OpenAI + tools)  │
└─────────┬─────────┘
          │ allowlisted tools
          ▼
┌───────────────────┐     ┌─────────────────────┐
│ Med graph         │────▶│ Safety engine       │
│ proposals / reads │     │ (demo → licensed)   │
└───────────────────┘     └─────────────────────┘
          │
          ▼
   Human confirm UI ──▶ committed regimen + audit
```

### 11.9 Evaluation harness (P1, start in Phase 1 shadow)

Golden tasks reviewed by pharmacist advisor:

| Suite | Pass bar |
| --- | --- |
| Intake extraction accuracy on labeled discharges | Target set with advisor (e.g., critical drug recall) |
| Explain: no unauthorized dose-change instructions | **100%** refuse / redirect |
| Explain: coded-alert claims match engine when asserted as alerts | High precision |
| Role respect | Viewer cannot commit intake |

Gate prompt/model changes on suite pass.

### 11.10 Example caregiver utterances

| Utterance | Agent |
| --- | --- |
| “Here’s Grandma’s discharge summary” | Intake |
| “Is it safe that she started ibuprofen?” | Explain (+ engine) |
| “Prep me for the pharmacist tomorrow” | Prepare |
| “Anything I should worry about this week?” | Explain + Watch status |

---

## 12. Alert and safety UX

### 12.1 Severity model

| Severity | Meaning | UX |
| --- | --- | --- |
| **Serious** | Major interaction or allergy conflict; harm plausible | Full-screen interrupt; ack required; CTA call pharmacist/clinician; Visit Packet shortcut |
| **Caution** | Moderate / monitoring | Banner + detail sheet; suggested questions |
| **Informational** | Minor / theoretical / timing | Subtle notice |

### 12.2 Mandatory content pattern

1. **What** — Drug A + Drug B (or class / allergen)  
2. **So what** — Everyday consequence  
3. **Now what** — Do not change meds alone; contact professional; optional “I discussed this”  

### 12.3 Confidence & completeness

UI must show when list is incomplete (skipped OTC step, `needs_review` meds, stale confirmation). Example banner: “Safety check may be incomplete — 2 meds need review.”

### 12.4 Copy principles

- No unexplained professional severity codes as the only message  
- No “stop taking X tonight” instructions  
- Prefer “ask your pharmacist whether this combination is appropriate”  

---

## 13. Information architecture and key screens

### 13.1 Primary nav (caregiver)

1. **Home** — Today’s doses, open alerts, agent entry  
2. **Medications** — Active list, inactive, add  
3. **Safety** — Alerts inbox  
4. **Assistant** — Agent chat / tasks  
5. **People** — Profiles & sharing  
6. **Visit Packet** — Export / prepare  

Elderly patient mode may simplify to: Today · My meds · Help.

### 13.2 Key screens (MVP)

| Screen | Purpose |
| --- | --- |
| Onboarding | Profile + first intake + OTC prompt + allergies |
| Med list | Source of truth |
| Med detail | Edit fields, provenance, history |
| Proposal review | Intake confirm UI |
| Alert detail | What / so what / now what |
| Assistant | Chat + task shortcuts |
| Today | Adherence |
| Visit Packet preview | Edit + export |
| Sharing | Invites & roles |
| Settings | Notifications, MFA, data export/delete |

### 13.3 Accessibility requirements

- Dynamic type up to large accessibility sizes on Today + Med list + Alerts  
- Minimum tap targets on dose marking  
- Screen reader labels on severity and CTAs  
- Avoid color-only severity (icon + text)  

---

## 14. Data model

### 14.1 Core entities

| Entity | Key fields (conceptual) |
| --- | --- |
| **User** | id, auth, locale, notification prefs |
| **Profile** | id, display_name, timezone, birth_year?, accessibility_prefs |
| **ShareGrant** | profile_id, grantee_user_id, role, scope, created_at, revoked_at, consent_ref |
| **Allergy** | substance, coded_id?, reaction, severity, status |
| **Condition** | name, coded_id?, status (P1) |
| **Medication** | profile_id, rxnorm?, display_name, brand?, strength, form, dose, route, frequency, schedule_times[], prn, indication?, prescriber?, pharmacy?, start_at, stop_at, status, source, needs_review, last_confirmed_at, created_by |
| **InteractionAlert** | profile_id, members[], severity, vendor_code, vendor_version, plain_title, status, acked_at, acked_by |
| **DoseEvent** | medication_id, scheduled_at, status, actor_user_id, note? |
| **MedChangeProposal** | agent_run_id, ops[], status (pending/accepted/rejected), confirmation_token? |
| **AgentRun** | agent_type, user_id, profile_id, model, tool_calls[], input_refs[], created_at |
| **AuditEvent** | actor, action, entity_ref, payload_hash, at |
| **StudyEnrollment** (P2) | profile_id, study_id, site_id, participant_id, ruleset_id?, status |

### 14.2 Provenance

Every medication records `source ∈ {manual, ocr, agent_intake, import}` and `last_confirmed_at`. Caregiver home surfaces “Confirm list still accurate” nudges.

### 14.3 Soft deletes & history

Prefer status transitions (`active` → `stopped`) over hard deletes; retain history for Visit Packet “recent changes.”

---

## 15. Clinical trials expansion

### 15.1 Why this is the same product

| Consumer primitive | Trial application |
| --- | --- |
| Med graph | Concomitant medication list |
| Interaction engine | Safety awareness (+ optional protocol ruleset) |
| Adherence events | Compliance signal / diary export |
| Intake agent | Reconcile meds at visits |
| Explain / Prepare | “What to tell the study team” |
| Audit + consent | Research-grade traceability |

### 15.2 Explicit boundary

MedicalPrep **does not** replace:

- EDC  
- CTMS  
- Sponsor safety database  
- Medical monitoring / SAE processing  
- Regulatory submission systems  

It **does** help participants/caregivers keep concomitant meds accurate and communicate cleanly with sites.

### 15.3 Phase 4 requirements

| ID | Requirement | Pri |
| --- | --- | --- |
| CT1 | Study enrollment linkage on profile | P2 |
| CT2 | Concomitant medication report export | P2 |
| CT3 | Externalized protocol-prohibited class rulesets | P2 |
| CT4 | Adherence / AE note capture exportable as diary inputs | P2 |
| CT5 | Trial prep agent variant | P2 |
| CT6 | Consent & DPA/BAA pathways for research | P2 |
| CT7 | Documented boundary vs EDC/CTMS | P2 |

### 15.4 Trial wedge options (pick in discovery)

1. **Concomitant-med quality** (most aligned with core)  
2. **Adherence visibility** for oral therapies  
3. **Protocol conflict flags** for prohibited OTCs/classes  

Recommendation: start with (1), add (3) when a pilot sponsor provides rulesets.

### 15.5 Sample trial scenario

Participant on study drug; caregiver adds OTC decongestant prohibited by protocol ruleset → flag: “This may not be allowed in the study—contact your study team before use. Do not stop study drug on your own.” Export concomitant list for coordinator.

---

## 16. Technical architecture

### 16.1 MVP orientation (prototype stack)

| Layer | Prototype (shipped) | Launch target |
| --- | --- | --- |
| Clients | Next.js App Router responsive web | + PWA / native wrappers |
| Auth | Firebase Authentication (email/password) → HTTP-only app session (`mp_session`) | MFA ([FIREBASE-MFA.md](./FIREBASE-MFA.md)), SSO |
| API | Next.js Route Handlers under `/api/*` | Same pattern; rate limits |
| Persistence | Prisma ORM + **PostgreSQL** | Same; object storage for uploads |
| Med safety | Seeded demo catalog + interaction rules | Licensed drug knowledge API |
| Coding | Free-text + optional `drugKey` / RxNorm fields | Stronger RxNorm resolution |
| Agents | OpenAI Chat Completions (`gpt-4o-mini` default) + server tools | Eval gate; optional BAA provider |
| Jobs | Sync path for checks/agents (async OCR later) | Queue for OCR/intake |
| Hosting | Vercel; env: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_FIREBASE_*`, `OPENAI_API_KEY` | Same family |

### 16.2 Key decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Interaction engine | Demo now → buy/license for launch | Liability, coverage, maintenance |
| LLM role | OpenAI for Intake/Explain/Prepare | Caregiver UX; human confirm on writes |
| Regimen writes | Human confirm token | Safety |
| Web browse tools | Off in MVP | Uncontrolled claims |
| Classical lab TDM | Defer | Different product |
| Trials | Phase 4+ | Protect wedge focus |
| Local vs prod DB | Postgres for both when deploying to Vercel | Serverless has no durable SQLite disk |

### 16.3 Graceful degradation

| Dependency down | Behavior |
| --- | --- |
| LLM / OpenAI | Fall back to rule-based Intake parsing; Explain/Prepare use deterministic templates; banner if key missing |
| Interaction vendor / engine | Prototype uses demo rules; at launch: block “fully checked” claims; show stale/unavailable warning; allow list edit |
| Push notifications | In-app Today still accurate |

### 16.4 Analytics (privacy-preserving)

Event taxonomy for activation, alerts, agent tasks, exports—avoid sending raw medication names to third-party analytics without review. Firebase Analytics optional via `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`.

---

## 17. Non-functional, security, and compliance

### 17.1 NFR table

| Area | Requirement |
| --- | --- |
| Privacy | TLS 1.2+; encryption at rest; retention & deletion; PHI-minimized LLM logs |
| Security | MFA; session controls; server-side tool allowlist; pen test pre-launch |
| Reliability | ≥99.5% monthly uptime for list + alert path |
| Performance | Interaction check < 2s p95 (≤30 meds); intake proposals < 30s p95 typical PDF |
| Content freshness | Vendor SLA; critical safety patches expedited |
| Accessibility | WCAG 2.2 AA (web); platform a11y guidelines (mobile) |
| Audit | Alert acks + agent decisions retained per policy |

### 17.2 Compliance posture (directional — counsel required)

| Topic | Posture |
| --- | --- |
| Marketing claims | No diagnose/treat/cure; careful AI claims; no “AI doctor” |
| FDA / CDS / SaMD | Legal review before implying device-grade CDS |
| Consumer privacy | Privacy policy; CCPA/CPRA etc. as applicable |
| HIPAA | Consumer app first; BAAs when acting as/with covered entities or research partners |
| AI providers | Contractual retention, training opt-out, subprocessors reviewed |

### 17.3 Disclaimer (product-wide)

Always available from Safety and Assistant: educational/informational only; not a substitute for professional medical advice; emergencies → local emergency services.

---

## 18. Go-to-market and pricing

### 18.1 Positioning

“Agentic AI for family medication safety—built for caregivers managing real polypharmacy, not another pill reminder.”

### 18.2 Beachhead channels

- Caregiver communities, eldercare newsletters, discharge education content  
- Independent pharmacies / geriatric navigators (trust transfer)  
- Word-of-mouth among “Ajay-like” technically fluent caregivers  

### 18.3 Later channels

- Care-org / pharmacy B2B2C  
- Trial site / CRO participant-support pilots  

### 18.4 Pricing hypotheses (validate)

| Tier | Idea |
| --- | --- |
| **Free** | 1 profile, reminders, limited history, capped agent runs |
| **Family** | Multi-profile, caregivers, Visit Packet, full history, generous agents |
| **Research** (later) | Site/sponsor features, exports, rulesets, BAAs |

Avoid making AI feel “locked” on Free; avoid unlimited Free abuse.

### 18.5 Launch narrative

Lead with the grandparents/polypharmacy story; demonstrate discharge → confirm → explain → Visit Packet in under 10 minutes.

---

## 19. Roadmap and milestones

| Phase | Timing | Deliverables | Outcome |
| --- | --- | --- | --- |
| **0 Discovery** | 2–4 weeks | ≥10 caregiver interviews; pharmacist advisor; vendor shortlists (interaction + LLM); regulatory claims memo | Go / no-go on MVP shape |
| **1 MVP** | 8–12 weeks | Med list, allergies, engine, severity UX, sharing, PDF, reminders, Intake/Explain/Prepare | Private family beta — **web prototype exists (2026-08)** |
| **2 Trust** | +6–10 weeks | Watch agent, OCR, missed-dose alerts, Spanish, adherence summaries, emergency card, eval in CI | Public launch readiness |
| **3 Continuity** | Ongoing | FHIR/pharmacy import, structured export, partners | Less manual entry |
| **4 Trials** | After consumer PMF signals | Enrollment link, concomitant export, rulesets, Trial prep agent, site pilot | Second application |

### 19.1 MVP epic checklist

- [ ] Auth, profiles, roles  
- [ ] Med + allergy CRUD + RxNorm search  
- [ ] Licensed interaction integration  
- [ ] Alert UX (3 severities)  
- [ ] Today + notifications  
- [ ] Visit Packet PDF  
- [ ] Assistant + Intake/Explain/Prepare  
- [ ] Proposal confirmation + audit  
- [ ] OTC completeness step  
- [ ] Disclaimers + data export/delete  

---

## 20. Risks, assumptions, and open questions

### 20.1 Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Incomplete lists | OTC step; confirm nudges; later import |
| Alert fatigue | Severity UX; suppress dupes; pharmacist tuning |
| LLM hallucination | Grounding; allowlist; eval gate; refuse |
| Overclaim / regulatory | Counsel; conservative marketing |
| Vendor gaps | SLA; incomplete-state UX |
| Caregiver overreach | Consent; roles; revoke |
| User stops meds from alert | Explicit copy; no dose advice |
| Elder accessibility | Caregiver-first; a11y testing |
| CTMS scope creep | CT7 boundary |
| PHI to model providers | BAA; minimization; retention |

### 20.2 Assumptions

- Caregivers will upload real documents if confirmation UI is trustworthy  
- Licensed content APIs are affordable at early scale  
- Families will pay for Family tier if agents save real time  
- US RxNorm-centric MVP is enough to learn  

### 20.3 Open questions

1. Web-first vs native-first for MVP?  
2. US-only drug data at launch?  
3. Proxy / legal account holder flows for cognitive impairment?  
4. Which interaction vendor?  
5. Serious alerts: hard block save vs acknowledge-and-save?  
6. Food/alcohol warning aggressiveness?  
7. FDA CDS pathway vs informational consumer guidance?  
8. Which LLM host for PHI/documents?  
9. Free-tier agent run caps?  
10. First trial wedge: concomitant export vs adherence vs protocol flags?  
11. External brand language: “TDM” vs “medication safety co-pilot”?  

---

## 21. Appendices

### Appendix A — Acceptance scenarios

1. **Warfarin + new NSAID OTC** → engine severity; Explain: bleeding risk; no dose change; pharmacist CTA.  
2. **Two anticholinergics** → duplicate/class caution; falls/confusion framing.  
3. **St. John’s wort + Rx** → must fire (OTC path works).  
4. **Penicillin allergy + amoxicillin** → Serious allergy conflict.  
5. **Caregiver edit** → notify/audit; re-check interactions.  
6. **Discharge PDF** → proposals only; commit after Ajay confirms.  
7. **Explain without vendor hit** → refuse to invent interaction.  
8. **Viewer role** → cannot commit Intake proposals.  
9. **LLM outage** → manual med add + deterministic alerts still function.  
10. **Future trial:** prohibited OTC class → protocol flag + study-team script.  

### Appendix B — Glossary

| Term | Meaning |
| --- | --- |
| Classical TDM | Blood-level guided dosing |
| Consumer TDM (MedicalPrep) | Home regimen monitoring for safety/adherence/coordination |
| Agentic AI | Tool-using AI pursuing caregiver goals with human confirm on writes |
| Polypharmacy | Multiple concurrent medications (often ≥5) |
| Grounding | Clinical claims tied to engine/user facts |
| Visit Packet | Appointment-ready export |
| Concomitant medications | Drugs taken with a study intervention |
| CDS | Clinical decision support |

### Appendix C — Sample Visit Packet outline

1. Patient display name / DOB (if provided)  
2. Allergies  
3. Active medications (name, dose, frequency, indication if known)  
4. Recently stopped / changed (30 days)  
5. Open Serious / Caution alerts (plain language)  
6. Questions for pharmacist/clinician  
7. Generated timestamp + “caregiver-reported; verify with patient”  

### Appendix D — Sample Explain output (illustrative)

> **What:** Ibuprofen (OTC pain reliever) and warfarin (blood thinner)  
> **So what:** Using them together can increase bleeding risk.  
> **Now what:** Don’t stop warfarin on your own. Contact your pharmacist or clinician promptly and ask whether ibuprofen is appropriate. Consider asking about safer pain options.  
> **Source:** Safety alert `#ALERT_ID` from our licensed interaction database.

### Appendix E — Discovery interview guide (starter)

1. How do you currently track your parent/grandparent’s meds?  
2. Tell me about the last time you worried about an interaction.  
3. Walk me through the last hospital discharge.  
4. What would you trust an AI to do vs never do?  
5. Who else helps—and how do you share information today?  
6. What would you print or show a pharmacist?  
7. Willingness to pay (van Westendorp or simple tier reaction)  

### Appendix F — Condensed mapping to founder brief

| Founder statement | Document sections |
| --- | --- |
| Consumer TDM; grandparents; interactions | §§1–3, 8–10, 12 |
| Agentic AI for people like me | §§5.1, 9.5, 11 |
| Extend to clinical trials | §§2.3, 8 (Pillar G), 15, Phase 4 |

---

## 22. Approval

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Product / Founder | | | |
| Engineering | | | |
| Design | | | |
| Clinical / pharmacy advisor | | | |
| Legal / privacy | | | |

---

*Living document (v2.1). Interaction severity, vendors, agent/LLM posture, and all public claims (including AI) require licensed clinical content partners and counsel before launch marketing. The repository prototype uses a **demo** safety catalog and OpenAI; do not market it as licensed clinical decision support.*
