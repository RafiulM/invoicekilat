import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, invoices, invoiceItems } from "@/lib/db/schema";
import {
  getUser,
  ok,
  error,
  unauthorized,
  serializeInvoice,
  str,
  num,
  toDate,
} from "@/lib/api";

type ItemInput = { description?: unknown; quantity?: unknown; price?: unknown };

export async function GET(req: Request) {
  const u = await getUser();
  if (!u) return unauthorized();

  const companyId = new URL(req.url).searchParams.get("companyId");

  const where = companyId
    ? and(eq(companies.userId, u.id), eq(invoices.companyId, companyId))
    : eq(companies.userId, u.id);

  const rows = await db
    .select({ invoice: invoices })
    .from(invoices)
    .innerJoin(companies, eq(invoices.companyId, companies.id))
    .where(where)
    .orderBy(desc(invoices.createdAt));

  const list = rows.map((r) => r.invoice);
  const ids = list.map((i) => i.id);

  const items = ids.length
    ? await db.select().from(invoiceItems).where(inArray(invoiceItems.invoiceId, ids))
    : [];

  const byInvoice = new Map<string, typeof items>();
  for (const it of items) {
    const arr = byInvoice.get(it.invoiceId) ?? [];
    arr.push(it);
    byInvoice.set(it.invoiceId, arr);
  }

  return ok(list.map((i) => serializeInvoice(i, byInvoice.get(i.id) ?? [])));
}

export async function POST(req: Request) {
  const u = await getUser();
  if (!u) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body) return error("Invalid body");

  const companyId = str(body.companyId);
  if (!companyId) return error("companyId is required");
  if (!str(body.recipientName).trim())
    return error("recipientName is required");

  // Verify the target company belongs to the current user.
  const [company] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, companyId), eq(companies.userId, u.id)))
    .limit(1);
  if (!company) return error("Company not found", 404);

  const rawItems: ItemInput[] = Array.isArray(body.items) ? body.items : [];
  const items = rawItems.map((it) => ({
    description: str(it.description),
    quantity: Math.max(0, Math.trunc(num(it.quantity, 1))),
    price: Math.max(0, Math.trunc(num(it.price, 0))),
  }));

  const computedTotal = items.reduce((s, it) => s + it.quantity * it.price, 0);
  const totalAmount =
    body.totalAmount != null ? num(body.totalAmount, computedTotal) : computedTotal;

  const number = str(body.number) || (await nextInvoiceNumber(u.id));

  const created = await db.transaction(async (tx) => {
    const [inv] = await tx
      .insert(invoices)
      .values({
        number,
        companyId,
        templateId: str(body.templateId, company.defaultTemplateId),
        recipientName: str(body.recipientName),
        recipientContact: str(body.recipientContact),
        recipientAddress: str(body.recipientAddress),
        totalAmount,
        signatureName: str(body.signatureName),
        signatureUrl: body.signatureUrl ?? null,
        notes: str(body.notes),
        status: ["draft", "sent", "paid"].includes(body.status)
          ? body.status
          : "draft",
        issueDate: toDate(body.issueDate),
        dueDate: toDate(body.dueDate),
      })
      .returning();

    const insertedItems = items.length
      ? await tx
          .insert(invoiceItems)
          .values(items.map((it) => ({ ...it, invoiceId: inv.id })))
          .returning()
      : [];

    return { inv, insertedItems };
  });

  return ok(serializeInvoice(created.inv, created.insertedItems), 201);
}

async function nextInvoiceNumber(userId: string) {
  const rows = await db
    .select({ id: invoices.id })
    .from(invoices)
    .innerJoin(companies, eq(invoices.companyId, companies.id))
    .where(eq(companies.userId, userId));
  const year = new Date().getFullYear();
  return `INV-${year}-${String(rows.length + 1).padStart(3, "0")}`;
}
