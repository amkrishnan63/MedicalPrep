import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshProfileAlerts } from "@/lib/interactions";
import { ProfilePicker } from "@/components/ProfilePicker";
import { resolveProfileId } from "@/lib/profile-context";

export default async function AppHome({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: {
      profile: {
        include: {
          _count: {
            select: {
              medications: { where: { status: "active" } },
              alerts: { where: { status: "open", severity: "Serious" } },
            },
          },
        },
      },
    },
  });

  const profiles = memberships.map((m) => ({
    id: m.profile.id,
    displayName: m.profile.displayName,
    role: m.role,
    activeMedCount: m.profile._count.medications,
    openSeriousCount: m.profile._count.alerts,
  }));

  const profile = await resolveProfileId(user.id, sp.profileId);
  let openAlerts: Awaited<ReturnType<typeof refreshProfileAlerts>> = [];
  if (profile) {
    openAlerts = await refreshProfileAlerts(profile.id);
  }
  const serious = openAlerts.filter((a) => a.severity === "Serious" && a.status === "open");
  const activeMedCount =
    profiles.find((p) => p.id === profile?.id)?.activeMedCount ?? 0;

  return (
    <div className="stack">
      <section>
        <h1 style={{ marginBottom: "0.35rem" }}>Welcome, {user.name.split(" ")[0]}</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Manage a living medication list, catch interactions, and use the Assistant for discharge
          intake and visit prep — you confirm every change.
        </p>
      </section>

      {profiles.length === 0 ? (
        <div className="grid-2">
          <ProfilePicker profiles={profiles} />
          <div className="card stack">
            <h2 style={{ margin: 0, fontSize: "1.2rem" }}>What you can do next</h2>
            <ol style={{ margin: 0, paddingLeft: "1.2rem", color: "var(--ink-muted)" }}>
              <li>Create a profile (or load the sample).</li>
              <li>
                Add medicines on <strong>Medications</strong> — try adding ibuprofen to see a
                Serious alert with warfarin.
              </li>
              <li>
                Open <strong>Assistant</strong> → Intake with a discharge note.
              </li>
              <li>
                Print a <strong>Visit Packet</strong> for the pharmacist.
              </li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          <ProfilePicker profiles={profiles} selectedId={profile?.id} />

          {profile ? (
            <div className="stack">
              <div className="card">
                <h2 style={{ marginTop: 0, fontSize: "1.2rem" }}>{profile.displayName}</h2>
                {!profile.otcPromptCompleted && (
                  <p className="severity-caution" style={{ padding: "0.75rem", borderRadius: 8 }}>
                    Safety check may be incomplete — finish the OTC / supplement review on
                    Medications.
                  </p>
                )}
                <p className="muted">
                  {activeMedCount} active medicine{activeMedCount === 1 ? "" : "s"}
                  {serious.length > 0
                    ? ` · ${serious.length} open Serious alert(s)`
                    : " · no open Serious alerts"}
                </p>
                <div className="row" style={{ marginTop: "0.75rem" }}>
                  <Link
                    className="btn btn-primary"
                    href={`/app/medications?profileId=${profile.id}`}
                  >
                    Medications
                  </Link>
                  <Link
                    className="btn btn-secondary"
                    href={`/app/assistant?profileId=${profile.id}`}
                  >
                    Assistant
                  </Link>
                  <Link className="btn btn-secondary" href={`/app/safety?profileId=${profile.id}`}>
                    Safety
                  </Link>
                  <Link
                    className="btn btn-secondary"
                    href={`/app/visit-packet?profileId=${profile.id}`}
                  >
                    Visit Packet
                  </Link>
                  <Link className="btn btn-secondary" href={`/app/today?profileId=${profile.id}`}>
                    Today
                  </Link>
                </div>
              </div>
              {serious.slice(0, 2).map((a) => (
                <div key={a.id} className="card severity-serious">
                  <strong>{a.title}</strong>
                  <p style={{ marginBottom: 0 }}>{a.soWhatText}</p>
                  <Link
                    href={`/app/safety?profileId=${profile.id}`}
                    style={{ color: "var(--brand)", fontWeight: 600, fontSize: "0.9rem" }}
                  >
                    Review on Safety →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <p className="muted" style={{ margin: 0 }}>
                Select a profile to continue.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
