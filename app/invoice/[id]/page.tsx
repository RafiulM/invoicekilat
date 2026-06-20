"use client";

import { use } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, Invoice01Icon } from "@hugeicons/core-free-icons";
import { InvoiceEditor } from "@/components/invoice-editor";
import { useInvoice } from "@/lib/hooks";
import { useT } from "@/lib/i18n";

// Renders the same editor as the home page, prefilled from the saved invoice.
export default function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useT();
  const { data: invoice, isLoading, isError } = useInvoice(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[var(--muted-foreground)]">
        <HugeiconsIcon icon={Loading03Icon} size={22} className="animate-spin" />
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 text-center">
        <HugeiconsIcon
          icon={Invoice01Icon}
          size={28}
          className="text-[var(--muted-foreground)]"
        />
        <p className="text-sm text-[var(--muted-foreground)]">
          {t.invoices.noMatch}
        </p>
        <Link
          href="/"
          className="text-sm font-medium text-[var(--primary)] underline"
        >
          {t.invoices.create}
        </Link>
      </div>
    );
  }

  // key forces a fresh editor (re-prefill) when navigating between invoices.
  return <InvoiceEditor key={invoice.id} invoice={invoice} />;
}
