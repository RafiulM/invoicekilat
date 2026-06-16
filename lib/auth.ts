import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { BetterAuthOptions } from "better-auth";
import { db } from "./db";
import { user, session, account, verification } from "./db/schema";

// Email/password login is opt-in via env. Google is enabled whenever its
// OAuth credentials are present.
export const emailPasswordEnabled = process.env.AUTH_EMAIL_PASSWORD === "true";
export const googleEnabled = !!(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

const socialProviders: NonNullable<BetterAuthOptions["socialProviders"]> = {};
if (googleEnabled) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    // Optional override for non-default deployments.
    ...(process.env.GOOGLE_REDIRECT_URI
      ? { redirectURI: process.env.GOOGLE_REDIRECT_URI }
      : {}),
  };
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: emailPasswordEnabled,
  },
  socialProviders,
  account: {
    accountLinking: {
      // Link a Google login to an existing account with the same verified email.
      enabled: true,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
