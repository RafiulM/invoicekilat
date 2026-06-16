export type TemplateId = "klasik" | "modern" | "minimalis" | "profesional";

export interface Template {
  id: TemplateId;
  name: string;
  description: string;
  accent: string;
}

export interface Company {
  id: string;
  companyName: string;
  companyAddress: string;
  companyContact: string;
  contactPerson: string;
  logoText: string; // fallback logo = initials/emoji
  logoColor: string;
  logoUrl?: string | null; // uploaded logo image (overrides initials when set)
  defaultTemplateId: TemplateId;
  createdAt: string;
}

export interface Contact {
  id: string;
  companyName: string;
  contactPerson: string;
  contactInfo: string;
  address: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  number: string;
  companyId: string;
  templateId: TemplateId;
  recipientName: string;
  recipientContact: string;
  recipientAddress: string;
  items: InvoiceItem[];
  totalAmount: number;
  signatureName: string;
  notes: string;
  status: "draft" | "sent" | "paid";
  issueDate: string;
  dueDate: string;
  createdAt: string;
}
