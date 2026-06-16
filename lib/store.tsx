"use client";

import { useEffect, useMemo } from "react";
import { Company, Contact, Invoice, TemplateId } from "./types";
import { useActiveCompany } from "@/components/providers";
import {
  useCompanies,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
  useContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  useInvoices,
  useCreateInvoice,
  useDeleteInvoice,
} from "./hooks";
import type { CompanyInput, ContactInput, InvoiceInput } from "./api-client";

/**
 * Backwards-compatible store facade.
 *
 * The original localStorage store has been replaced by TanStack Query hooks
 * (see `lib/hooks`) talking to the REST API. This hook preserves the old
 * `useStore()` surface so existing pages keep working, while data, loading,
 * and mutations are now handled by React Query + the API client.
 *
 * New code should prefer the dedicated hooks (`useCompanies`, `useInvoices`, …).
 */
export function useStore() {
  const { activeCompanyId, setActiveCompany } = useActiveCompany();

  const companiesQ = useCompanies();
  const contactsQ = useContacts();
  const invoicesQ = useInvoices();

  const createCompany = useCreateCompany();
  const updateCompanyM = useUpdateCompany();
  const deleteCompanyM = useDeleteCompany();
  const createContact = useCreateContact();
  const updateContactM = useUpdateContact();
  const deleteContactM = useDeleteContact();
  const createInvoice = useCreateInvoice();
  const deleteInvoiceM = useDeleteInvoice();

  const companies = useMemo(() => companiesQ.data ?? [], [companiesQ.data]);
  const contacts = useMemo(() => contactsQ.data ?? [], [contactsQ.data]);
  const invoices = useMemo(() => invoicesQ.data ?? [], [invoicesQ.data]);

  // Resolve the effective active company: stored selection if still valid,
  // otherwise fall back to the first company.
  const effectiveActiveId =
    companies.find((c) => c.id === activeCompanyId)?.id ??
    companies[0]?.id ??
    "";

  // Keep the persisted selection in sync once data loads.
  useEffect(() => {
    if (effectiveActiveId && effectiveActiveId !== activeCompanyId) {
      setActiveCompany(effectiveActiveId);
    }
  }, [effectiveActiveId, activeCompanyId, setActiveCompany]);

  const ready =
    !companiesQ.isLoading && !contactsQ.isLoading && !invoicesQ.isLoading;

  return {
    companies,
    contacts,
    invoices,
    activeCompanyId: effectiveActiveId,
    ready,
    setActiveCompany,

    addCompany: (c: CompanyInput) => createCompany.mutate(c),
    updateCompany: (id: string, patch: Partial<CompanyInput>) =>
      updateCompanyM.mutate({ id, patch }),
    deleteCompany: (id: string) => deleteCompanyM.mutate(id),

    addContact: (c: ContactInput) => createContact.mutate(c),
    updateContact: (id: string, patch: Partial<ContactInput>) =>
      updateContactM.mutate({ id, patch }),
    deleteContact: (id: string) => deleteContactM.mutate(id),

    addInvoice: (i: InvoiceInput) => createInvoice.mutate(i),
    deleteInvoice: (id: string) => deleteInvoiceM.mutate(id),

    nextInvoiceNumber: () => {
      const year = new Date().getFullYear();
      const n = invoices.length + 1;
      return `INV-${year}-${String(n).padStart(3, "0")}`;
    },

    // expose raw mutation/query state for callers that want loading flags
    _state: {
      isMutating:
        createCompany.isPending ||
        updateCompanyM.isPending ||
        deleteCompanyM.isPending ||
        createContact.isPending ||
        updateContactM.isPending ||
        deleteContactM.isPending ||
        createInvoice.isPending ||
        deleteInvoiceM.isPending,
    },
  };
}

export function templateName(id: TemplateId | string) {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

// Re-exported types for convenience (kept for import-compat).
export type { Company, Contact, Invoice, TemplateId };
