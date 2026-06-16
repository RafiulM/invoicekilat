import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";
import {
  getUser,
  ok,
  error,
  unauthorized,
  serializeContact,
  str,
} from "@/lib/api";

export async function GET() {
  const u = await getUser();
  if (!u) return unauthorized();

  const rows = await db
    .select()
    .from(contacts)
    .where(eq(contacts.userId, u.id))
    .orderBy(desc(contacts.createdAt));

  return ok(rows.map(serializeContact));
}

export async function POST(req: Request) {
  const u = await getUser();
  if (!u) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body || !str(body.companyName).trim())
    return error("companyName is required");

  const [row] = await db
    .insert(contacts)
    .values({
      userId: u.id,
      companyName: str(body.companyName),
      contactPerson: str(body.contactPerson),
      contactInfo: str(body.contactInfo),
      address: str(body.address),
    })
    .returning();

  return ok(serializeContact(row), 201);
}
