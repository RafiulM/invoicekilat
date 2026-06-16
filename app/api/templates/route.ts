import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { templates } from "@/lib/db/schema";
import { ok, serializeTemplate } from "@/lib/api";

// Templates are global, read-only catalog data. No auth required.
export async function GET() {
  const rows = await db
    .select()
    .from(templates)
    .where(eq(templates.isActive, true));

  return ok(rows.map(serializeTemplate));
}
