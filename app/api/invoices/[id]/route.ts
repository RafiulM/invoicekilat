import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, invoices, invoiceItems } from "@/lib/db/schema";
import {
  getUser,
  ok,
  unauthorized,
  notFound,
  serializeInvoice,
} from "@/lib/api";

async function owned(userId: string, id: string) {
  const [row] = await db
    .select({ invoice: invoices })
    .from(invoices)
    .innerJoin(companies, eq(invoices.companyId, companies.id))
    .where(and(eq(invoices.id, id), eq(companies.userId, userId)))
    .limit(1);
  return row?.invoice ?? null;
}

export async function GET(_req: Request, ctx: RouteContext<"/api/invoices/[id]">) {
  const u = await getUser();
  if (!u) return unauthorized();
  const { id } = await ctx.params;

  const inv = await owned(u.id, id);
  if (!inv) return notFound("Invoice");

  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, id));

  return ok(serializeInvoice(inv, items));
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/invoices/[id]">) {
  const u = await getUser();
  if (!u) return unauthorized();
  const { id } = await ctx.params;

  const inv = await owned(u.id, id);
  if (!inv) return notFound("Invoice");

  // invoice_items rows cascade via FK on delete.
  await db.delete(invoices).where(eq(invoices.id, id));
  return ok({ ok: true });
}
