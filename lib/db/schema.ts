import {
  pgTable,
  pgEnum,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Better Auth tables (standard schema — do not rename columns)
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// ---------------------------------------------------------------------------
// Application tables
// ---------------------------------------------------------------------------

export const invoiceStatus = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
]);

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const templates = pgTable("templates", {
  // id is the slug ("klasik", "modern", ...) so it doubles as the enum value
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  accent: text("accent").notNull().default("#1f2937"),
  thumbnailUrl: text("thumbnail_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const companies = pgTable(
  "companies",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    companyName: text("company_name").notNull(),
    companyAddress: text("company_address").notNull().default(""),
    companyContact: text("company_contact").notNull().default(""),
    contactPerson: text("contact_person").notNull().default(""),
    logoText: text("logo_text").notNull().default("?"),
    logoColor: text("logo_color").notNull().default("#64748b"),
    logoUrl: text("logo_url"),
    defaultTemplateId: text("default_template_id")
      .notNull()
      .default("modern")
      .references(() => templates.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("companies_user_id_idx").on(t.userId)],
);

export const contacts = pgTable(
  "contacts",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    companyName: text("company_name").notNull(),
    contactPerson: text("contact_person").notNull().default(""),
    contactInfo: text("contact_info").notNull().default(""),
    address: text("address").notNull().default(""),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("contacts_user_id_idx").on(t.userId)],
);

export const invoices = pgTable(
  "invoices",
  {
    id: id(),
    number: text("number").notNull(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    templateId: text("template_id")
      .notNull()
      .references(() => templates.id),
    recipientName: text("recipient_name").notNull(),
    recipientContact: text("recipient_contact").notNull().default(""),
    recipientAddress: text("recipient_address").notNull().default(""),
    totalAmount: bigint("total_amount", { mode: "number" })
      .notNull()
      .default(0),
    signatureName: text("signature_name").notNull().default(""),
    signatureUrl: text("signature_url"),
    notes: text("notes").notNull().default(""),
    status: invoiceStatus("status").notNull().default("draft"),
    issueDate: timestamp("issue_date").notNull().defaultNow(),
    dueDate: timestamp("due_date").notNull().defaultNow(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("invoices_company_id_idx").on(t.companyId)],
);

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: id(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    description: text("description").notNull().default(""),
    quantity: integer("quantity").notNull().default(1),
    price: bigint("price", { mode: "number" }).notNull().default(0),
  },
  (t) => [index("invoice_items_invoice_id_idx").on(t.invoiceId)],
);

export type DbCompany = typeof companies.$inferSelect;
export type DbContact = typeof contacts.$inferSelect;
export type DbInvoice = typeof invoices.$inferSelect;
export type DbInvoiceItem = typeof invoiceItems.$inferSelect;
export type DbTemplate = typeof templates.$inferSelect;
