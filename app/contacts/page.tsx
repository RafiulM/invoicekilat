"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserMultipleIcon,
  Edit02Icon,
  Delete02Icon,
  PlusSignIcon,
  Search01Icon,
  Location01Icon,
  AtIcon,
} from "@hugeicons/core-free-icons";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Contact } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import { initials } from "@/lib/utils";

const empty = {
  companyName: "",
  contactPerson: "",
  contactInfo: "",
  address: "",
};

export default function ContactsPage() {
  const { contacts, addContact, updateContact, deleteContact } = useStore();
  const t = useT();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState(empty);
  const [confirmDel, setConfirmDel] = useState<Contact | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return contacts;
    return contacts.filter((c) =>
      [c.companyName, c.contactPerson, c.contactInfo, c.address]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [contacts, query]);

  function startAdd() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }
  function startEdit(c: Contact) {
    setEditing(c);
    setForm({
      companyName: c.companyName,
      contactPerson: c.contactPerson,
      contactInfo: c.contactInfo,
      address: c.address,
    });
    setOpen(true);
  }
  function save() {
    if (editing) updateContact(editing.id, form);
    else addContact(form);
    setOpen(false);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={t.contacts.title} subtitle={t.contacts.subtitle}>
        <Button onClick={startAdd}>
          <HugeiconsIcon icon={PlusSignIcon} size={16} /> {t.contacts.add}
        </Button>
      </PageHeader>

      <div className="relative mb-5">
        <HugeiconsIcon
          icon={Search01Icon}
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.contacts.search}
          className="pl-9"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <Card key={c.id} className="flex flex-col p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-sm font-bold text-[var(--primary)]">
                {initials(c.companyName || c.contactPerson)}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">{c.companyName}</h3>
                <p className="truncate text-xs text-[var(--muted-foreground)]">
                  {c.contactPerson}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-[var(--muted-foreground)]">
              <p className="flex items-start gap-2">
                <HugeiconsIcon icon={AtIcon} size={14} className="mt-0.5 shrink-0" />
                <span className="break-words">{c.contactInfo}</span>
              </p>
              <p className="flex items-start gap-2">
                <HugeiconsIcon icon={Location01Icon} size={14} className="mt-0.5 shrink-0" />
                <span>{c.address}</span>
              </p>
            </div>

            <div className="mt-4 flex justify-end gap-1 border-t border-[var(--border)] pt-3">
              <Button size="icon" variant="ghost" onClick={() => startEdit(c)}>
                <HugeiconsIcon icon={Edit02Icon} size={16} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setConfirmDel(c)}
                className="text-red-600 hover:bg-red-50"
              >
                <HugeiconsIcon icon={Delete02Icon} size={16} />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius)] border-2 border-dashed border-[var(--border)] py-16 text-center">
          <HugeiconsIcon icon={UserMultipleIcon} size={28} className="text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">
            {query ? t.contacts.noMatch : t.contacts.empty}
          </p>
          {!query && (
            <Button size="sm" onClick={startAdd}>
              <HugeiconsIcon icon={PlusSignIcon} size={15} /> {t.contacts.addFirst}
            </Button>
          )}
        </div>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? t.contacts.dialogEditTitle : t.contacts.dialogAddTitle}
        description={t.contacts.dialogDesc}
      >
        <div className="space-y-4">
          <div>
            <Label>{t.contacts.companyName}</Label>
            <Input
              value={form.companyName}
              onChange={(e) =>
                setForm({ ...form, companyName: e.target.value })
              }
              placeholder={t.contacts.companyPh}
            />
          </div>
          <div>
            <Label>{t.contacts.contactPerson}</Label>
            <Input
              value={form.contactPerson}
              onChange={(e) =>
                setForm({ ...form, contactPerson: e.target.value })
              }
              placeholder={t.contacts.personPh}
            />
          </div>
          <div>
            <Label>{t.contacts.contactInfo}</Label>
            <Input
              value={form.contactInfo}
              onChange={(e) =>
                setForm({ ...form, contactInfo: e.target.value })
              }
              placeholder={t.contacts.contactPh}
            />
          </div>
          <div>
            <Label>{t.contacts.billingAddress}</Label>
            <Textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder={t.contacts.addressPh}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={save} disabled={!form.companyName.trim()}>
              {editing ? t.common.saveChanges : t.contacts.addBtn}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title={t.contacts.deleteTitle}
        description={t.contacts.deleteDesc(confirmDel?.companyName ?? "")}
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDel(null)}>
            {t.common.cancel}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirmDel) deleteContact(confirmDel.id);
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
