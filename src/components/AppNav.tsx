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

type ProfileOption = {
  id: string;
  displayName: string;
};

export function AppNav({ userName }: { userName: string; profileName?: string }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const queryProfileId = search.get("profileId");
  const [profileId, setProfileId] = useState<string | null>(queryProfileId);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfiles() {
      const res = await fetch("/api/profiles");
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as { profiles: ProfileOption[] };
      const list = data.profiles ?? [];
      if (cancelled) return;
      setProfiles(list);

      const selected =
        (queryProfileId && list.find((p) => p.id === queryProfileId)) || list[0] || null;

      if (!selected) {
        setProfileId(null);
        return;
      }

      setProfileId(selected.id);

      if (!queryProfileId && pathname.startsWith("/app")) {
        const params = new URLSearchParams(search.toString());
        params.set("profileId", selected.id);
        router.replace(`${pathname}?${params.toString()}`);
      }
    }

    void loadProfiles();
    return () => {
      cancelled = true;
    };
  }, [queryProfileId, pathname, router, search]);

  function withProfile(href: string, id = profileId) {
    if (href === "/app") {
      return id ? `/app?profileId=${id}` : "/app";
    }
    if (!id) return href;
    return `${href}?profileId=${id}`;
  }

  function switchProfile(nextId: string) {
    setProfileId(nextId);
    const base = pathname.startsWith("/app") ? pathname : "/app";
    router.push(withProfile(base, nextId));
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
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Link
              href={withProfile("/app")}
              className="brand-font"
              style={{ fontSize: "1.45rem", color: "var(--brand)" }}
            >
              MedicalPrep
            </Link>
            <div className="muted" style={{ fontSize: "0.85rem" }}>
              {userName}
            </div>
          </div>

          <div className="row" style={{ alignItems: "center", gap: "0.55rem" }}>
            {profiles.length > 0 && (
              <select
                className="select"
                value={profileId ?? ""}
                onChange={(e) => switchProfile(e.target.value)}
                style={{ minWidth: 180, padding: "0.45rem 0.65rem" }}
                aria-label="Switch household profile"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName}
                  </option>
                ))}
              </select>
            )}
            <button className="btn btn-secondary" onClick={logout} type="button">
              Sign out
            </button>
          </div>
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
