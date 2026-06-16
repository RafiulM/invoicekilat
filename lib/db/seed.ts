import { and, eq, sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db } from "./index";
import { account, companies, templates, user } from "./schema";
import { TEMPLATES } from "../dummy-data";

// Templates are reference data — always upserted so a fresh DB is usable.
async function seedTemplates() {
  await db
    .insert(templates)
    .values(
      TEMPLATES.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        accent: t.accent,
        isActive: true,
      })),
    )
    .onConflictDoUpdate({
      target: templates.id,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        accent: sql`excluded.accent`,
      },
    });

  console.log(`[seed] Upserted ${TEMPLATES.length} templates.`);
}

// A known email/password login for testing. Opt-in via SEED_TEST_ACCOUNT=true.
// Only useful when email/password auth is enabled (AUTH_EMAIL_PASSWORD=true).
// The password is hashed with better-auth's own hasher so the normal login
// flow verifies it. Idempotent: re-runs reset the password, never duplicate.
async function seedTestAccount() {
  if (process.env.SEED_TEST_ACCOUNT !== "true") {
    console.log("[seed] SEED_TEST_ACCOUNT not 'true' — skipping test account.");
    return;
  }

  const email = process.env.TEST_ACCOUNT_EMAIL ?? "test@example.com";
  const password = process.env.TEST_ACCOUNT_PASSWORD ?? "test12345";
  const name = process.env.TEST_ACCOUNT_NAME ?? "Test User";

  // Find-or-create the user (email is unique).
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  let userId: string;
  if (existing.length) {
    userId = existing[0].id;
  } else {
    userId = crypto.randomUUID();
    await db.insert(user).values({
      id: userId,
      name,
      email,
      emailVerified: true,
    });
  }

  // Upsert the credential account holding the password hash.
  const hash = await hashPassword(password);
  const existingAccount = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
    .limit(1);

  if (existingAccount.length) {
    await db
      .update(account)
      .set({ password: hash, updatedAt: new Date() })
      .where(eq(account.id, existingAccount[0].id));
  } else {
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: hash,
      updatedAt: new Date(),
    });
  }

  // A sample company so the seeded account has something to look at.
  const sampleCompanyId = `seed-company-${userId}`;
  await db
    .insert(companies)
    .values({
      id: sampleCompanyId,
      userId,
      companyName: "Acme Studio",
      companyAddress: "123 Demo Street",
      companyContact: "hello@acme.test",
      contactPerson: name,
      logoText: "A",
      defaultTemplateId: "modern",
    })
    .onConflictDoNothing({ target: companies.id });

  console.log(`[seed] Test account ready: ${email} / ${password}`);
}

async function main() {
  await seedTemplates();
  await seedTestAccount();
  process.exit(0);
}

main().catch((e) => {
  console.error("[seed] Failed:", e);
  process.exit(1);
});
