"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const links = [
  { href: "/app", label: "Home", match: "/app" },
  { href: "/app/medications", label: "Medications", match: "/app/medications" },
  { href: "/app/safety", label: "Safety", match: "/app/safety" },
  { href: "/app/today", label: "Today", match: "/app/today" },
  { href: "/app/assistant", label: "Assistant", match: "/app/assistant" },
  { href: "/app/visit-packet", label: "Visit Packet", match: "/app/visit-packet" },
  { href: "/app/people", label: "People", match: "/app/people" },
];

export function AppNav({
  userName,
  profileName,
}: {
  userName: string;
  profileName?: string;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const queryProfileId = search.get("profileId");
  const [profileId, setProfileId] = useState<string | null>(queryProfileId);
  const [resolvedName, setResolvedName] = useState<string | undefined>(profileName);

  useEffect(() => {
    let cancelled = false;

    async function ensureProfile() {
      if (queryProfileId) {
        setProfileId(queryProfileId);
        return;
      }
      const res = await fetch("/api/profiles");
      if (!res.ok || cancelled) return;
      const data = await res.json();
      const first = data.profiles?.[0];
      if (!first || cancelled) return;
      setProfileId(first.id);
      setResolvedName(first.displayName);
      // Keep Home URL shareable with an active profile when one exists
      if (pathname === "/app") {
        router.replace(`/app?profileId=${first.id}`);
      }
    }

    void ensureProfile();
    return () => {
      cancelled = true;
    };
  }, [queryProfileId, pathname, router]);

  function withProfile(href: string) {
    // Home can work without a query; other sections need a profile
    if (href === "/app") {
      return profileId ? `/app?profileId=${profileId}` : "/app";
    }
    if (!profileId) return href;
    return `${href}?profileId=${profileId}`;
  }

  async function logout() {
    try {
      const { signOut } = await import("firebase/auth");
      const { getFirebaseAuth } = await import("@/lib/firebase");
      await signOut(getFirebaseAuth());
    } catch {
      // Firebase may already be signed out
    }
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      style={{
        borderBottom: "1px solid var(--line)",
        background: "rgba(247, 250, 251, 0.9)",
        backdropFilter: "blur(8px)",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <div className="shell" style={{ paddingBottom: "0.85rem", paddingTop: "0.85rem" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <Link
              href={withProfile("/app")}
              className="brand-font"
              style={{ fontSize: "1.45rem", color: "var(--brand)" }}
            >
              MedicalPrep
            </Link>
            <div className="muted" style={{ fontSize: "0.85rem" }}>
              {resolvedName
                ? `Caring for ${resolvedName}`
                : "Family medication safety"}{" "}
              · {userName}
            </div>
          </div>
          <button className="btn btn-secondary" onClick={logout} type="button">
            Sign out
          </button>
        </div>
        <nav className="row" style={{ marginTop: "0.75rem" }}>
          {links.map((l) => {
            const active =
              l.match === "/app" ? pathname === "/app" : pathname.startsWith(l.match);
            return (
              <Link
                key={l.href}
                href={withProfile(l.href)}
                className={`nav-link${active ? " active" : ""}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
