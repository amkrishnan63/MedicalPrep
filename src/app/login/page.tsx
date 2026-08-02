"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { createAppSession, firebaseErrorMessage } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    try {
      const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      await createAppSession(cred.user);
      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(firebaseErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell" style={{ maxWidth: 480, paddingTop: "4rem" }}>
      <p className="brand-font" style={{ fontSize: "2.4rem", color: "var(--brand)", margin: 0 }}>
        MedicalPrep
      </p>
      <p className="muted" style={{ marginTop: "0.5rem" }}>
        Family medication safety for caregivers.
      </p>
      <form className="card stack" style={{ marginTop: "1.5rem" }} onSubmit={onSubmit}>
        <h1 style={{ margin: 0, fontSize: "1.4rem" }}>Sign in</h1>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            className="input"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            // Password managers often mutate input attrs/values before React hydrates.
            suppressHydrationWarning
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            className="input"
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Your password"
            suppressHydrationWarning
          />
        </div>
        {error && <p style={{ color: "var(--serious)", margin: 0 }}>{error}</p>}
        <button className="btn btn-primary" disabled={loading} type="submit">
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
          No account yet?{" "}
          <Link href="/register" style={{ color: "var(--brand)", fontWeight: 600 }}>
            Create account
          </Link>
        </p>
      </form>
    </main>
  );
}
