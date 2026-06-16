"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { qk } from "./keys";

export function useTemplates() {
  return useQuery({
    queryKey: qk.templates,
    queryFn: api.templates.list,
    staleTime: 60 * 60 * 1000, // catalog rarely changes
  });
}
