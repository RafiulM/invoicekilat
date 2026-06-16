import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";
import {
  getUser,
  ok,
  error,
  unauthorized,
  notFound,
  serializeContact,
  str,
} from "@/lib/api";

async function owned(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function GET(_req: Request, ctx: RouteContext<"/api/contacts/[id]">) {
  const u = await getUser();
  if (!u) return unauthorized();
  const { id } = await ctx.params;

  const row = await owned(u.id, id);
  if (!row) return notFound("Contact");
  return ok(serializeContact(row));
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/contacts/[id]">) {
  const u = await getUser();
  if (!u) return unauthorized();
  const { id } = await ctx.params;

  const current = await owned(u.id, id);
  if (!current) return notFound("Contact");

  const body = await req.json().catch(() => null);
  if (!body) return error("Invalid body");

  const patch: Partial<typeof contacts.$inferInsert> = {};
  if ("companyName" in body) patch.companyName = str(body.companyName);
  if ("contactPerson" in body) patch.contactPerson = str(body.contactPerson);
  if ("contactInfo" in body) patch.contactInfo = str(body.contactInfo);
  if ("address" in body) patch.address = str(body.address);

  const [row] = await db
    .update(contacts)
    .set(patch)
    .where(eq(contacts.id, id))
    .returning();

  return ok(serializeContact(row));
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/contacts/[id]">) {
  const u = await getUser();
  if (!u) return unauthorized();
  const { id } = await ctx.params;

  const current = await owned(u.id, id);
  if (!current) return notFound("Contact");

  await db.delete(contacts).where(eq(contacts.id, id));
  return ok({ ok: true });
}
