"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/lib/i18n";

// --- active company (client-only selection, persisted) ---------------------

const LS_ACTIVE = "invoicegen.activeCompany";

interface ActiveCompanyCtx {
  activeCompanyId: string;
  setActiveCompany: (id: string) => void;
}

const ActiveCompanyContext = createContext<ActiveCompanyCtx | null>(null);

function ActiveCompanyProvider({ children }: { children: React.ReactNode }) {
  const [activeCompanyId, setId] = useState("");

  // Hydrate the persisted selection on mount. Reading localStorage in the
  // initializer would cause an SSR/client hydration mismatch, so do it here.
  useEffect(() => {
    const saved = localStorage.getItem(LS_ACTIVE);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setId(saved);
  }, []);

  const setActiveCompany = (id: string) => {
    setId(id);
    localStorage.setItem(LS_ACTIVE, id);
  };

  return (
    <ActiveCompanyContext.Provider value={{ activeCompanyId, setActiveCompany }}>
      {children}
    </ActiveCompanyContext.Provider>
  );
}

export function useActiveCompany() {
  const ctx = useContext(ActiveCompanyContext);
  if (!ctx)
    throw new Error("useActiveCompany must be used within Providers");
  return ctx;
}

// --- root providers --------------------------------------------------------

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ActiveCompanyProvider>{children}</ActiveCompanyProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
