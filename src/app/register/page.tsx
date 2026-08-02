"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { createAppSession, firebaseErrorMessage } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    try {
      const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
      await createAppSession(cred.user, name);
      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(firebaseErrorMessage(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell" style={{ maxWidth: 480, paddingTop: "4rem" }}>
      <p className="brand-font" style={{ fontSize: "2.4rem", color: "var(--brand)", margin: 0 }}>
        MedicalPrep
      </p>
      <form className="card stack" style={{ marginTop: "1.5rem" }} onSubmit={onSubmit}>
        <h1 style={{ margin: 0, fontSize: "1.4rem" }}>Create account</h1>
        <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
          Use any email. You&apos;ll add a family member&apos;s medication profile next.
        </p>
        <div>
          <label className="label" htmlFor="name">
            Name
          </label>
          <input
            className="input"
            id="name"
            name="name"
            required
            autoComplete="name"
            suppressHydrationWarning
          />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            className="input"
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            suppressHydrationWarning
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password (min 6)
          </label>
          <input
            className="input"
            id="password"
            name="password"
            type="password"
            minLength={6}
            required
            autoComplete="new-password"
            suppressHydrationWarning
          />
        </div>
        {error && <p style={{ color: "var(--serious)", margin: 0 }}>{error}</p>}
        <button className="btn btn-primary" disabled={loading} type="submit">
          {loading ? "Creating…" : "Create account"}
        </button>
        <p className="muted" style={{ margin: 0 }}>
          <Link href="/login" style={{ color: "var(--brand)", fontWeight: 600 }}>
            Back to sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
