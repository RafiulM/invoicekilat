import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
}

// Reuse the pool across hot reloads in dev to avoid exhausting connections.
const globalForDb = globalThis as unknown as { __pool?: Pool };
const pool = globalForDb.__pool ?? new Pool({ connectionString });
if (process.env.NODE_ENV !== "production") globalForDb.__pool = pool;

export const db = drizzle({ client: pool, schema });
export { schema };
