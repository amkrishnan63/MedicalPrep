import type { User } from "firebase/auth";

export async function createAppSession(user: User, name?: string) {
  const idToken = await user.getIdToken(true);
  const res = await fetch("/api/auth/firebase-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idToken,
      ...(name ? { name } : {}),
    }),
  });
  const data = await res.json().catch(() => ({} as { error?: string }));
  if (!res.ok) {
    throw new Error(
      (typeof data.error === "string" && data.error) ||
        `Could not create app session (HTTP ${res.status})`,
    );
  }
  return data;
}

export function firebaseErrorMessage(err: unknown, fallback = "Something went wrong") {
  if (!err || typeof err !== "object") return fallback;
  const code = "code" in err ? String((err as { code?: string }).code) : "";
  const message = "message" in err ? String((err as { message?: string }).message) : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Invalid email or password";
    case "auth/user-not-found":
      return "No account with that email";
    case "auth/too-many-requests":
      return "Too many attempts — try again later";
    case "auth/invalid-email":
      return "Enter a valid email address";
    case "auth/email-already-in-use":
      return "That email is already registered";
    case "auth/weak-password":
      return "Password is too weak (use at least 6 characters)";
    case "auth/operation-not-allowed":
      return "Email/Password is not enabled in Firebase Console";
    default:
      break;
  }

  if (message.includes("Missing Firebase env")) {
    return "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* env vars (Vercel → Settings → Environment Variables) and redeploy.";
  }

  return message.replace(/^Firebase:\s*/i, "").replace(/\s*\(.*\)\s*$/, "") || fallback;
}
