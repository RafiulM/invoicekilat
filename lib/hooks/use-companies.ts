"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type CompanyInput } from "@/lib/api-client";
import { qk } from "./keys";

export function useCompanies() {
  return useQuery({
    queryKey: qk.companies,
    queryFn: api.companies.list,
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CompanyInput) => api.companies.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.companies }),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CompanyInput> }) =>
      api.companies.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.companies }),
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.companies.remove(id),
    onSuccess: () => {
      // Deleting a company cascades its invoices server-side.
      qc.invalidateQueries({ queryKey: qk.companies });
      qc.invalidateQueries({ queryKey: qk.invoices });
    },
  });
}
