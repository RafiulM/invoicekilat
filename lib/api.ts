import { headers } from "next/headers";
import { auth } from "./auth";
import type {
  DbCompany,
  DbContact,
  DbInvoice,
  DbInvoiceItem,
  DbTemplate,
} from "./db/schema";

// --- auth ------------------------------------------------------------------

export async function getUser() {
  const s = await auth.api.getSession({ headers: await headers() });
  return s?.user ?? null;
}

// --- responses -------------------------------------------------------------

export const ok = <T>(data: T, status = 200) =>
  Response.json(data, { status });

export const error = (message: string, status = 400) =>
  Response.json({ error: message }, { status });

export const unauthorized = () => error("Unauthorized", 401);
export const notFound = (what = "Resource") => error(`${what} not found`, 404);

// --- serializers (db row -> frontend shape) --------------------------------

export const serializeCompany = (c: DbCompany) => ({
  id: c.id,
  companyName: c.companyName,
  companyAddress: c.companyAddress,
  companyContact: c.companyContact,
  contactPerson: c.contactPerson,
  logoText: c.logoText,
  logoColor: c.logoColor,
  logoUrl: c.logoUrl,
  defaultTemplateId: c.defaultTemplateId,
  createdAt: c.createdAt.toISOString(),
});

export const serializeContact = (c: DbContact) => ({
  id: c.id,
  companyName: c.companyName,
  contactPerson: c.contactPerson,
  contactInfo: c.contactInfo,
  address: c.address,
  createdAt: c.createdAt.toISOString(),
});

export const serializeTemplate = (t: DbTemplate) => ({
  id: t.id,
  name: t.name,
  description: t.description,
  accent: t.accent,
  thumbnailUrl: t.thumbnailUrl,
  isActive: t.isActive,
});

export const serializeInvoice = (
  i: DbInvoice,
  items: DbInvoiceItem[] = [],
) => ({
  id: i.id,
  number: i.number,
  companyId: i.companyId,
  templateId: i.templateId,
  recipientName: i.recipientName,
  recipientContact: i.recipientContact,
  recipientAddress: i.recipientAddress,
  items: items.map((it) => ({
    id: it.id,
    description: it.description,
    quantity: it.quantity,
    price: it.price,
  })),
  totalAmount: i.totalAmount,
  signatureName: i.signatureName,
  signatureUrl: i.signatureUrl,
  notes: i.notes,
  status: i.status,
  issueDate: i.issueDate.toISOString(),
  dueDate: i.dueDate.toISOString(),
  createdAt: i.createdAt.toISOString(),
});

// --- helpers ---------------------------------------------------------------

export const str = (v: unknown, fallback = "") =>
  typeof v === "string" ? v : fallback;

export const num = (v: unknown, fallback = 0) => {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
};

export const toDate = (v: unknown) => {
  const d = v ? new Date(v as string) : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
};
