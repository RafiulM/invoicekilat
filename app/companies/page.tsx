"use client";

import { useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Building02Icon,
  Edit02Icon,
  Delete02Icon,
  PlusSignIcon,
  Tick02Icon,
  ImageUploadIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { useStore } from "@/lib/store";
import { useUpload } from "@/lib/hooks";
import { useT } from "@/lib/i18n";
import { Company, TemplateId } from "@/lib/types";
import { TEMPLATES } from "@/lib/dummy-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";

const LOGO_COLORS = [
  "#4f46e5",
  "#0f766e",
  "#b45309",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#16a34a",
];

const empty = {
  companyName: "",
  companyAddress: "",
  companyContact: "",
  contactPerson: "",
  logoText: "",
  logoColor: LOGO_COLORS[0],
  logoUrl: "",
  defaultTemplateId: "modern" as TemplateId,
};

export default function CompaniesPage() {
  const {
    companies,
    invoices,
    activeCompanyId,
    addCompany,
    updateCompany,
    deleteCompany,
    setActiveCompany,
  } = useStore();
  const t = useT();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState(empty);
  const [confirmDel, setConfirmDel] = useState<Company | null>(null);

  const upload = useUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoErr, setLogoErr] = useState<string | null>(null);

  async function onLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be picked again after a remove
    if (!file) return;
    setLogoErr(null);
    try {
      const { url } = await upload.mutateAsync({ file, kind: "logo" });
      setForm((f) => ({ ...f, logoUrl: url }));
    } catch (err) {
      setLogoErr(err instanceof Error ? err.message : t.editor.saveError);
    }
  }

  function startAdd() {
    setEditing(null);
    setForm(empty);
    setLogoErr(null);
    setOpen(true);
  }
  function startEdit(c: Company) {
    setEditing(c);
    setForm({
      companyName: c.companyName,
      companyAddress: c.companyAddress,
      companyContact: c.companyContact,
      contactPerson: c.contactPerson,
      logoText: c.logoText,
      logoColor: c.logoColor,
      logoUrl: c.logoUrl ?? "",
      defaultTemplateId: c.defaultTemplateId,
    });
    setLogoErr(null);
    setOpen(true);
  }
  function save() {
    const logoText =
      form.logoText.trim() ||
      form.companyName
        .split(" ")
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
    const payload = { ...form, logoText, logoUrl: form.logoUrl || null };
    if (editing) updateCompany(editing.id, payload);
    else addCompany(payload);
    setOpen(false);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={t.companies.title} subtitle={t.companies.subtitle}>
        <Button onClick={startAdd}>
          <HugeiconsIcon icon={PlusSignIcon} size={16} /> {t.companies.add}
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        {companies.map((c) => {
          const count = invoices.filter((i) => i.companyId === c.id).length;
          const isActive = c.id === activeCompanyId;
          return (
            <Card key={c.id} className="p-5">
              <div className="flex items-start gap-4">
                {c.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.logoUrl}
                    alt={`${c.companyName} logo`}
                    className="h-12 w-12 shrink-0 rounded-xl object-contain bg-white ring-1 ring-[var(--border)]"
                  />
                ) : (
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ background: c.logoColor }}
                  >
                    {c.logoText}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold">{c.companyName}</h3>
                    {isActive && <Badge tone="indigo">{t.companies.activeBadge}</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                    {c.contactPerson}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-sm text-[var(--muted-foreground)]">
                <p>{c.companyAddress}</p>
                <p>{c.companyContact}</p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
                <div className="flex items-center gap-2">
                  <Badge tone="slate">{t.templates.names[c.defaultTemplateId]}</Badge>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {t.companies.invoiceCount(count)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {!isActive && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveCompany(c.id)}
                    >
                      <HugeiconsIcon icon={Tick02Icon} size={15} /> {t.companies.setActive}
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEdit(c)}
                    aria-label={t.common.edit}
                  >
                    <HugeiconsIcon icon={Edit02Icon} size={16} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setConfirmDel(c)}
                    aria-label={t.common.delete}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        <button
          onClick={startAdd}
          className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-[var(--radius)] border-2 border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] cursor-pointer"
        >
          <HugeiconsIcon icon={Building02Icon} size={24} />
          <span className="text-sm font-medium">{t.companies.addNew}</span>
        </button>
      </div>

      {/* add / edit dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? t.companies.dialogEditTitle : t.companies.dialogAddTitle}
        description={t.companies.dialogDesc}
      >
        <div className="space-y-4">
          <div>
            <Label>{t.companies.name}</Label>
            <Input
              value={form.companyName}
              onChange={(e) =>
                setForm({ ...form, companyName: e.target.value })
              }
              placeholder={t.companies.namePh}
            />
          </div>
          <div>
            <Label>{t.companies.address}</Label>
            <Textarea
              value={form.companyAddress}
              onChange={(e) =>
                setForm({ ...form, companyAddress: e.target.value })
              }
              placeholder={t.companies.addressPh}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t.companies.contact}</Label>
              <Input
                value={form.companyContact}
                onChange={(e) =>
                  setForm({ ...form, companyContact: e.target.value })
                }
                placeholder={t.companies.contactPh}
              />
            </div>
            <div>
              <Label>{t.companies.internalPerson}</Label>
              <Input
                value={form.contactPerson}
                onChange={(e) =>
                  setForm({ ...form, contactPerson: e.target.value })
                }
                placeholder={t.companies.personPh}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t.companies.logoInitials}</Label>
              <Input
                maxLength={3}
                value={form.logoText}
                onChange={(e) =>
                  setForm({ ...form, logoText: e.target.value.toUpperCase() })
                }
                placeholder={t.companies.logoAuto}
              />
            </div>
            <div>
              <Label>{t.companies.defaultTemplate}</Label>
              <Select
                value={form.defaultTemplateId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    defaultTemplateId: e.target.value as TemplateId,
                  })
                }
              >
                {TEMPLATES.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {t.templates.names[tpl.id]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label>{t.companies.logoColor}</Label>
            <div className="flex flex-wrap gap-2">
              {LOGO_COLORS.map((col) => (
                <button
                  key={col}
                  onClick={() => setForm({ ...form, logoColor: col })}
                  className="flex h-9 w-9 items-center justify-center rounded-lg ring-2 ring-offset-2 cursor-pointer"
                  style={{
                    background: col,
                    boxShadow:
                      form.logoColor === col ? `0 0 0 2px ${col}` : "none",
                  }}
                >
                  {form.logoColor === col && (
                    <HugeiconsIcon icon={Tick02Icon} size={16} className="text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>{t.companies.logoImage}</Label>
            <div className="flex items-center gap-3">
              {form.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.logoUrl}
                  alt="Logo preview"
                  className="h-14 w-14 shrink-0 rounded-xl object-contain bg-white ring-1 ring-[var(--border)]"
                />
              ) : (
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-[var(--muted-foreground)] ring-1 ring-dashed ring-[var(--border)]"
                >
                  <HugeiconsIcon icon={ImageUploadIcon} size={20} />
                </span>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                className="hidden"
                onChange={onLogoFile}
              />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    disabled={upload.isPending}
                  >
                    {upload.isPending ? (
                      <HugeiconsIcon
                        icon={Loading03Icon}
                        size={15}
                        className="animate-spin"
                      />
                    ) : (
                      <HugeiconsIcon icon={ImageUploadIcon} size={15} />
                    )}
                    {upload.isPending
                      ? t.companies.logoUploading
                      : t.companies.logoUploadBtn}
                  </Button>
                  {form.logoUrl && !upload.isPending && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => setForm({ ...form, logoUrl: "" })}
                    >
                      {t.companies.logoRemove}
                    </Button>
                  )}
                </div>
                {logoErr ? (
                  <p className="text-xs text-red-600" role="alert">
                    {logoErr}
                  </p>
                ) : (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {t.companies.logoHint}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={save} disabled={!form.companyName.trim()}>
              {editing ? t.common.saveChanges : t.companies.addBtn}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* delete confirm */}
      <Dialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title={t.companies.deleteTitle}
        description={t.companies.deleteDesc(confirmDel?.companyName ?? "")}
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDel(null)}>
            {t.common.cancel}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirmDel) deleteCompany(confirmDel.id);
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
