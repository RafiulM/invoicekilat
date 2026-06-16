// Client-readable mirrors of the server auth config (see lib/auth.ts).
// NEXT_PUBLIC_* vars are inlined at build time, so keep these in sync with the
// server-side flags (AUTH_EMAIL_PASSWORD / GOOGLE_CLIENT_ID).
export const emailPasswordEnabled =
  process.env.NEXT_PUBLIC_AUTH_EMAIL_PASSWORD === "true";

export const googleEnabled =
  process.env.NEXT_PUBLIC_AUTH_GOOGLE === "true";
