"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ContactInput } from "@/lib/api-client";
import { qk } from "./keys";

export function useContacts() {
  return useQuery({
    queryKey: qk.contacts,
    queryFn: api.contacts.list,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ContactInput) => api.contacts.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.contacts }),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ContactInput> }) =>
      api.contacts.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.contacts }),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.contacts.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.contacts }),
  });
}
