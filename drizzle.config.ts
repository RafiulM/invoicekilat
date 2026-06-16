import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js keeps secrets in .env.local; fall back to .env.
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
