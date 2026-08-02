/**
 * Verify a Firebase ID token via Identity Toolkit (no service-account file needed).
 * Uses the same web API key as the client.
 */

export type FirebaseTokenUser = {
  localId: string;
  email: string;
  displayName?: string;
};

export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseTokenUser> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is not configured");
  }

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    },
  );

  const data = (await res.json()) as {
    error?: { message?: string };
    users?: Array<{ localId: string; email?: string; displayName?: string }>;
  };

  if (!res.ok || !data.users?.[0]) {
    throw new Error(data.error?.message || "Invalid or expired Firebase session");
  }

  const u = data.users[0];
  if (!u.email) {
    throw new Error("Firebase account has no email");
  }

  return {
    localId: u.localId,
    email: u.email.toLowerCase(),
    displayName: u.displayName,
  };
}
