"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, FileAddIcon } from "@hugeicons/core-free-icons";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { TEMPLATES } from "@/lib/dummy-data";
import { InvoiceDocument, InvoiceView } from "@/components/invoice-document";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Company, TemplateId } from "@/lib/types";

const SAMPLE_ITEMS = [
  { id: "s1", description: "Jasa desain", quantity: 1, price: 5000000 },
  { id: "s2", description: "Konsultasi", quantity: 2, price: 750000 },
];

export default function TemplatesPage() {
  const { companies, activeCompanyId } = useStore();
  const t = useT();

  // Shown in previews before the user has created any company.
  const fallbackCompany: Company = {
    id: "",
    companyName: t.templates.fallbackCompany,
    companyAddress: t.templates.fallbackAddress,
    companyContact: "email@anda.com · +62 800-0000-0000",
    contactPerson: t.templates.fallbackPerson,
    logoText: "PA",
    logoColor: "#4f46e5",
    defaultTemplateId: "modern",
    createdAt: "",
  };

  const company =
    companies.find((c) => c.id === activeCompanyId) ??
    companies[0] ??
    fallbackCompany;

  function sample(templateId: TemplateId): InvoiceView {
    return {
      number: "INV-2026-XXX",
      templateId,
      company,
      recipientName: "PT Maju Bersama",
      recipientContact: "rina@majubersama.co.id",
      recipientAddress: "Jl. Sudirman Kav. 21, Jakarta",
      items: SAMPLE_ITEMS,
      signatureName: company?.contactPerson ?? "Andi Wijaya",
      notes: "Terima kasih atas kepercayaan Anda.",
      issueDate: "2026-06-16T00:00:00.000Z",
      dueDate: "2026-06-30T00:00:00.000Z",
    };
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={t.templates.title} subtitle={t.templates.subtitle}>
        <Link href="/">
          <Button>
            <HugeiconsIcon icon={FileAddIcon} size={16} /> {t.templates.create}
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-6 sm:grid-cols-2">
        {TEMPLATES.map((tpl) => {
          const isDefault = company?.defaultTemplateId === tpl.id;
          return (
            <Card key={tpl.id} className="overflow-hidden">
              <div className="relative bg-[var(--muted)] p-5">
                {isDefault && (
                  <Badge tone="indigo" className="absolute right-4 top-4 z-10">
                    <HugeiconsIcon icon={Tick02Icon} size={12} className="mr-1" /> {t.templates.defaultBadge}
                  </Badge>
                )}
                <div className="mx-auto max-w-[300px] overflow-hidden rounded-lg border border-[var(--border)] shadow-sm">
                  <InvoiceDocument data={sample(tpl.id)} />
                </div>
              </div>
              <div className="flex items-center justify-between p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ background: tpl.accent }}
                    />
                    <h3 className="font-semibold">{t.templates.names[tpl.id]}</h3>
                  </div>
                  <p className="mt-1 max-w-xs text-sm text-[var(--muted-foreground)]">
                    {t.templates.descs[tpl.id]}
                  </p>
                </div>
                <Link href="/">
                  <Button variant="outline" size="sm">
                    {t.templates.use}
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
