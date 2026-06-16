import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import {
  getUser,
  ok,
  error,
  unauthorized,
  serializeCompany,
  str,
} from "@/lib/api";

export async function GET() {
  const u = await getUser();
  if (!u) return unauthorized();

  const rows = await db
    .select()
    .from(companies)
    .where(eq(companies.userId, u.id))
    .orderBy(desc(companies.createdAt));

  return ok(rows.map(serializeCompany));
}

export async function POST(req: Request) {
  const u = await getUser();
  if (!u) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body || !str(body.companyName).trim())
    return error("companyName is required");

  const [row] = await db
    .insert(companies)
    .values({
      userId: u.id,
      companyName: str(body.companyName),
      companyAddress: str(body.companyAddress),
      companyContact: str(body.companyContact),
      contactPerson: str(body.contactPerson),
      logoText: str(body.logoText, "?").slice(0, 3),
      logoColor: str(body.logoColor, "#64748b"),
      logoUrl: body.logoUrl ?? null,
      defaultTemplateId: str(body.defaultTemplateId, "modern"),
    })
    .returning();

  return ok(serializeCompany(row), 201);
}
