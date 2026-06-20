// Centralized query keys so hooks and manual invalidation stay in sync.
export const qk = {
  companies: ["companies"] as const,
  contacts: ["contacts"] as const,
  invoices: ["invoices"] as const,
  invoice: (id: string) => ["invoices", id] as const,
};
