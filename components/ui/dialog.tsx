"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const t = useT();
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#1a1a1a]/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl",
          "max-h-[90vh] overflow-y-auto",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 p-5 pb-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {description && (
              <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] cursor-pointer"
            aria-label={t.common.close}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>
        <div className="p-5 pt-3">{children}</div>
      </div>
    </div>
  );
}
