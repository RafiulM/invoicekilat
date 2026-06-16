"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type InvoiceInput } from "@/lib/api-client";
import { qk } from "./keys";

// Fetches every invoice the user can see (across companies). Pages filter
// client-side; pass a companyId to scope the request server-side instead.
export function useInvoices(companyId?: string) {
  return useQuery({
    queryKey: companyId ? [...qk.invoices, { companyId }] : qk.invoices,
    queryFn: () => api.invoices.list(companyId),
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: qk.invoice(id ?? ""),
    queryFn: () => api.invoices.get(id!),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InvoiceInput) => api.invoices.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.invoices }),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.invoices.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.invoices }),
  });
}
