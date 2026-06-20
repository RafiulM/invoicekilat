import type { Company, Contact, Invoice } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Payload shapes (id / createdAt are assigned server-side).
export type CompanyInput = Omit<Company, "id" | "createdAt"> & {
  logoUrl?: string | null;
};
export type ContactInput = Omit<Contact, "id" | "createdAt">;
export type InvoiceInput = Omit<Invoice, "id" | "createdAt"> & {
  signatureUrl?: string | null;
};

export const api = {
  companies: {
    list: () => request<Company[]>("/companies"),
    create: (data: CompanyInput) =>
      request<Company>("/companies", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, patch: Partial<CompanyInput>) =>
      request<Company>(`/companies/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    remove: (id: string) =>
      request<{ ok: true }>(`/companies/${id}`, { method: "DELETE" }),
  },

  contacts: {
    list: () => request<Contact[]>("/contacts"),
    create: (data: ContactInput) =>
      request<Contact>("/contacts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, patch: Partial<ContactInput>) =>
      request<Contact>(`/contacts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    remove: (id: string) =>
      request<{ ok: true }>(`/contacts/${id}`, { method: "DELETE" }),
  },

  invoices: {
    list: (companyId?: string) =>
      request<Invoice[]>(
        companyId ? `/invoices?companyId=${encodeURIComponent(companyId)}` : "/invoices",
      ),
    get: (id: string) => request<Invoice>(`/invoices/${id}`),
    create: (data: InvoiceInput) =>
      request<Invoice>("/invoices", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    remove: (id: string) =>
      request<{ ok: true }>(`/invoices/${id}`, { method: "DELETE" }),
  },

  // Multipart upload — no JSON content-type header.
  upload: async (file: File, kind: "logo" | "signature" = "logo") => {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    const res = await fetch("/api/upload", {
      method: "POST",
      credentials: "include",
      body: form,
    });
    if (!res.ok) {
      let message = res.statusText;
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch {
        /* ignore */
      }
      throw new ApiError(message, res.status);
    }
    return res.json() as Promise<{ key: string; url: string }>;
  },
};
