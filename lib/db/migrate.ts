import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

// Standalone migration runner — applies the SQL files in ./drizzle against
// DATABASE_URL. Used by the Docker entrypoint before the server starts.
// Safe to run repeatedly: drizzle tracks applied migrations in its own table.

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[migrate] DATABASE_URL is not set.");
  process.exit(1);
}

const migrationsFolder = process.env.DRIZZLE_MIGRATIONS_FOLDER ?? "./drizzle";

async function main() {
  const pool = new Pool({ connectionString });
  const db = drizzle(pool);
  console.log(`[migrate] Applying migrations from ${migrationsFolder} ...`);
  await migrate(db, { migrationsFolder });
  await pool.end();
  console.log("[migrate] Done.");
}

main().catch((e) => {
  console.error("[migrate] Failed:", e);
  process.exit(1);
});
