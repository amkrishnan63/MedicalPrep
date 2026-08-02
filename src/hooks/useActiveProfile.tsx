"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ProfileSummary = {
  id: string;
  displayName: string;
  role: string;
};

/**
 * Resolves the active household profile from ?profileId= or the first membership.
 * Keeps the query string in sync so top-nav links stop bouncing back to Home.
 */
export function useActiveProfile() {
  const search = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const queryId = search.get("profileId");
  const [profileId, setProfileId] = useState<string | null>(queryId);
  const [profileName, setProfileName] = useState<string | undefined>();
  const [status, setStatus] = useState<"loading" | "ready" | "empty">(
    queryId ? "ready" : "loading",
  );

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (queryId) {
        setProfileId(queryId);
        setStatus("ready");
        return;
      }

      setStatus("loading");
      const res = await fetch("/api/profiles");
      if (!res.ok) {
        if (!cancelled) setStatus("empty");
        return;
      }
      const data = (await res.json()) as { profiles: ProfileSummary[] };
      const first = data.profiles[0];
      if (!first) {
        if (!cancelled) {
          setProfileId(null);
          setStatus("empty");
        }
        return;
      }

      if (cancelled) return;
      setProfileId(first.id);
      setProfileName(first.displayName);
      setStatus("ready");
      const params = new URLSearchParams(search.toString());
      params.set("profileId", first.id);
      router.replace(`${pathname}?${params.toString()}`);
    }

    void resolve();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-resolve when query profile changes
  }, [queryId, pathname]);

  return { profileId, profileName, status };
}

export function NoProfileState() {
  return (
    <div className="card stack">
      <h1 style={{ margin: 0, fontSize: "1.3rem" }}>Choose a profile first</h1>
      <p className="muted" style={{ margin: 0 }}>
        Create or select a household profile on Home, then use Medications, Safety, and the
        Assistant.
      </p>
      <a className="btn btn-primary" href="/app" style={{ alignSelf: "flex-start" }}>
        Go to Home
      </a>
    </div>
  );
}
