"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FileAddIcon,
  Search01Icon,
  Download01Icon,
  Delete02Icon,
  ViewIcon,
  Invoice01Icon,
} from "@hugeicons/core-free-icons";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Invoice } from "@/lib/types";
import { InvoiceDocument, InvoiceView } from "@/components/invoice-document";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge, statusTone } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import { formatIDR, formatDate } from "@/lib/utils";
import { downloadElementAsPdf } from "@/lib/pdf";

export default function InvoicesPage() {
  return (
    <Suspense fallback={null}>
      <InvoicesInner />
    </Suspense>
  );
}

function InvoicesInner() {
  const { companies, invoices, deleteInvoice } = useStore();
  const t = useT();
  const params = useSearchParams();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [status, setStatus] = useState("all");
  const [preview, setPreview] = useState<Invoice | null>(null);
  const [confirmDel, setConfirmDel] = useState<Invoice | null>(null);

  useEffect(() => {
    const focus = params.get("focus");
    if (focus) {
      const inv = invoices.find((i) => i.id === focus);
      if (inv) setPreview(inv);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return invoices.filter((i) => {
      if (filter !== "all" && i.companyId !== filter) return false;
      if (status !== "all" && i.status !== status) return false;
      if (!q) return true;
      return [i.number, i.recipientName, i.recipientContact]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [invoices, query, filter, status]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={t.invoices.title} subtitle={t.invoices.subtitle}>
        <Link href="/">
          <Button>
            <HugeiconsIcon icon={FileAddIcon} size={16} /> {t.invoices.create}
          </Button>
        </Link>
      </PageHeader>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.invoices.search}
            className="pl-9"
          />
        </div>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="sm:w-52"
        >
          <option value="all">{t.invoices.allCompanies}</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.companyName}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:w-40"
        >
          <option value="all">{t.invoices.allStatuses}</option>
          <option value="draft">{t.status.draft}</option>
          <option value="sent">{t.status.sent}</option>
          <option value="paid">{t.status.paid}</option>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[1.4fr_1.6fr_1fr_1fr_auto] gap-4 border-b border-[var(--border)] bg-[var(--muted)] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] md:grid">
          <span>{t.invoices.colInvoice}</span>
          <span>{t.invoices.colClient}</span>
          <span>{t.invoices.colTotal}</span>
          <span>{t.invoices.colStatus}</span>
          <span className="text-right">{t.invoices.colActions}</span>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {filtered.map((inv) => {
            const comp = companies.find((c) => c.id === inv.companyId);
            return (
              <div
                key={inv.id}
                className="grid grid-cols-1 gap-3 px-5 py-4 hover:bg-[var(--muted)] md:grid-cols-[1.4fr_1.6fr_1fr_1fr_auto] md:items-center md:gap-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                    style={{ background: comp?.logoColor ?? "#64748b" }}
                  >
                    {comp?.logoText ?? "??"}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{inv.number}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {formatDate(inv.issueDate)} · {t.templates.names[inv.templateId]}
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {inv.recipientName}
                  </div>
                  <div className="truncate text-xs text-[var(--muted-foreground)]">
                    {comp?.companyName}
                  </div>
                </div>
                <div className="text-sm font-semibold">
                  {formatIDR(inv.totalAmount)}
                </div>
                <div>
                  <Badge tone={statusTone(inv.status)}>
                    {t.status[inv.status]}
                  </Badge>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreview(inv)}
                  >
                    <HugeiconsIcon icon={ViewIcon} size={15} /> {t.invoices.view}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setConfirmDel(inv)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={16} />
                  </Button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <HugeiconsIcon icon={Invoice01Icon} size={28} className="text-[var(--muted-foreground)]" />
              <p className="text-sm text-[var(--muted-foreground)]">
                {t.invoices.noMatch}
              </p>
            </div>
          )}
        </div>
      </Card>

      {preview && (
        <PreviewModal
          invoice={preview}
          onClose={() => setPreview(null)}
        />
      )}

      <Dialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title={t.invoices.deleteTitle}
        description={t.invoices.deleteDesc(confirmDel?.number ?? "")}
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDel(null)}>
            {t.common.cancel}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirmDel) deleteInvoice(confirmDel.id);
              setConfirmDel(null);
            }}
          >
            <HugeiconsIcon icon={Delete02Icon} size={16} /> {t.common.delete}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function PreviewModal({
  invoice,
  onClose,
}: {
  invoice: Invoice;
  onClose: () => void;
}) {
  const { companies } = useStore();
  const t = useT();
  const docRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const company = companies.find((c) => c.id === invoice.companyId);
  if (!company) return null;

  const view: InvoiceView = {
    number: invoice.number,
    templateId: invoice.templateId,
    company,
    recipientName: invoice.recipientName,
    recipientContact: invoice.recipientContact,
    recipientAddress: invoice.recipientAddress,
    items: invoice.items,
    signatureName: invoice.signatureName,
    notes: invoice.notes,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
  };

  async function handleDownload() {
    if (!docRef.current) return;
    setBusy(true);
    try {
      await downloadElementAsPdf(docRef.current, `${invoice.number}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={invoice.number}
      description={`${company.companyName} → ${invoice.recipientName}`}
      className="max-w-2xl"
    >
      <div className="overflow-hidden rounded-lg border border-[var(--border)] shadow-sm">
        <div ref={docRef}>
          <InvoiceDocument data={view} />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          {t.common.close}
        </Button>
        <Button onClick={handleDownload} disabled={busy}>
          <HugeiconsIcon icon={Download01Icon} size={16} />{" "}
          {busy ? t.invoices.preparing : t.invoices.download}
        </Button>
      </div>
    </Dialog>
  );
}
