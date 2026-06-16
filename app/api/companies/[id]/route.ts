import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import {
  getUser,
  ok,
  error,
  unauthorized,
  notFound,
  serializeCompany,
  str,
} from "@/lib/api";

async function owned(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, id), eq(companies.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function GET(_req: Request, ctx: RouteContext<"/api/companies/[id]">) {
  const u = await getUser();
  if (!u) return unauthorized();
  const { id } = await ctx.params;

  const row = await owned(u.id, id);
  if (!row) return notFound("Company");
  return ok(serializeCompany(row));
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/companies/[id]">) {
  const u = await getUser();
  if (!u) return unauthorized();
  const { id } = await ctx.params;

  const current = await owned(u.id, id);
  if (!current) return notFound("Company");

  const body = await req.json().catch(() => null);
  if (!body) return error("Invalid body");

  const patch: Partial<typeof companies.$inferInsert> = {};
  if ("companyName" in body) patch.companyName = str(body.companyName);
  if ("companyAddress" in body) patch.companyAddress = str(body.companyAddress);
  if ("companyContact" in body) patch.companyContact = str(body.companyContact);
  if ("contactPerson" in body) patch.contactPerson = str(body.contactPerson);
  if ("logoText" in body) patch.logoText = str(body.logoText, "?").slice(0, 3);
  if ("logoColor" in body) patch.logoColor = str(body.logoColor, "#64748b");
  if ("logoUrl" in body) patch.logoUrl = body.logoUrl ?? null;
  if ("defaultTemplateId" in body)
    patch.defaultTemplateId = str(body.defaultTemplateId, "modern");

  const [row] = await db
    .update(companies)
    .set(patch)
    .where(eq(companies.id, id))
    .returning();

  return ok(serializeCompany(row));
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/companies/[id]">) {
  const u = await getUser();
  if (!u) return unauthorized();
  const { id } = await ctx.params;

  const current = await owned(u.id, id);
  if (!current) return notFound("Company");

  await db.delete(companies).where(eq(companies.id, id));
  return ok({ ok: true });
}
