"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wallet, Plus, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { rupee, dateShort, todayStr } from "@/lib/format";
import { BUSINESS } from "@/lib/business";
import { Button, Input, Modal, Field, Card, Skeleton, ConfirmDialog } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useRole } from "@/components/Role";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const { isAdmin } = useRole();
  const supabase = useMemo(() => createClient(), []);
  const [customer, setCustomer] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [entry, setEntry] = useState({ type: "credit", amount: "", description: "", entry_date: todayStr() });
  const [saving, setSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", address: "", opening_balance: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [delOpen, setDelOpen] = useState(false);

  async function load() {
    setLoading(true);
    const [custRes, ledRes] = await Promise.all([
      supabase.from("customers").select("*").eq("id", id).single(),
      supabase.from("ledger_entries").select("*").eq("customer_id", id).order("entry_date").order("created_at"),
    ]);
    setCustomer(custRes.data);
    setEntries(ledRes.data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function openEntry(type) {
    setEntry({ type, amount: "", description: "", entry_date: todayStr() });
    setOpen(true);
  }

  async function saveEntry(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("ledger_entries").insert({
      customer_id: id,
      type: entry.type,
      amount: Number(entry.amount) || 0,
      description: entry.description.trim() || (entry.type === "credit" ? "Paisa jama" : "Udhaar"),
      entry_date: entry.entry_date,
    });
    setSaving(false);
    if (error) {
      toast("Save nahi hua: " + error.message, "error");
      return;
    }
    setOpen(false);
    toast(entry.type === "credit" ? "Paisa jama ho gaya" : "Udhaar chadh gaya");
    load();
  }

  function openEdit() {
    setEditForm({
      name: customer.name,
      phone: customer.phone || "",
      address: customer.address || "",
      opening_balance: customer.opening_balance ?? "",
    });
    setEditOpen(true);
  }

  async function saveEdit(e) {
    e.preventDefault();
    setEditSaving(true);
    const { error } = await supabase
      .from("customers")
      .update({
        name: editForm.name.trim(),
        phone: editForm.phone.trim() || null,
        address: editForm.address.trim() || null,
        opening_balance: Number(editForm.opening_balance) || 0,
      })
      .eq("id", id);
    setEditSaving(false);
    if (error) {
      toast("Update nahi hua: " + error.message, "error");
      return;
    }
    setEditOpen(false);
    toast("Grahak update ho gaya");
    load();
  }

  async function deleteCustomer() {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) {
      toast("Delete nahi hua: " + error.message, "error");
      return;
    }
    toast("Grahak delete ho gaya");
    router.push("/customers");
  }

  // Balance render me compute hota hai; reminder ke liye yahan bhi chahiye
  function whatsappRemind(balance) {
    const digits = (customer.phone || "").replace(/\D/g, "");
    const num = digits.length === 10 ? "91" + digits : digits;
    const msg =
      `Namaste ${customer.name} ji 🙏\n` +
      `${BUSINESS.name}\n` +
      `Aapka ${rupee(balance)} baaki hai. Kripya jald jama kar dein.\n` +
      `Dhanyawaad!`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  if (loading)
    return (
      <div className="space-y-5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="flex gap-2">
          <Skeleton className="h-11 w-44 rounded-xl" />
          <Skeleton className="h-11 w-40 rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  if (!customer)
    return (
      <p className="text-slate-500">
        Grahak nahi mila. <Link href="/customers" className="text-emerald-600 underline">Wapas</Link>
      </p>
    );

  let running = Number(customer.opening_balance || 0);
  const rows = entries.map((en) => {
    if (en.type === "debit") running += Number(en.amount);
    else running -= Number(en.amount);
    return { ...en, balance: running };
  });
  const finalBalance = running;

  return (
    <div className="animate-in space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600">
          <ArrowLeft size={16} /> Sab grahak
        </Link>
        <div className="flex gap-1">
          <button onClick={openEdit} title="Edit" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100">
            <Pencil size={16} />
          </button>
          {isAdmin && (
            <button onClick={() => setDelOpen(true)} title="Delete" className="flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-600">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{customer.name}</h1>
            <p className="text-sm text-slate-500">
              {customer.phone || "phone nahi"} {customer.address ? `· ${customer.address}` : ""}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-400">Abhi Baaki</p>
          <p className={`tnum text-2xl font-bold ${finalBalance > 0 ? "text-rose-600" : finalBalance < 0 ? "text-emerald-600" : "text-slate-400"}`}>
            {rupee(finalBalance)}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Button variant="success" onClick={() => openEntry("credit")} className="w-full sm:w-auto">
          <Wallet size={17} /> Paisa jama
        </Button>
        <Button variant="secondary" onClick={() => openEntry("debit")} className="w-full sm:w-auto">
          <Plus size={17} /> Udhaar chadhao
        </Button>
        {finalBalance > 0 && customer.phone && (
          <Button variant="secondary" onClick={() => whatsappRemind(finalBalance)} className="col-span-2 w-full text-emerald-700 sm:col-span-1 sm:w-auto">
            <MessageCircle size={17} /> WhatsApp yaad dilao
          </Button>
        )}
      </div>

      {/* Mobile: khata cards (app jaisa) */}
      <div className="space-y-2 sm:hidden">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm">
          <span className="text-slate-500">Purani udhari (opening)</span>
          <span className="tnum font-medium text-slate-700">{rupee(customer.opening_balance)}</span>
        </div>
        {rows.map((en) => (
          <div key={en.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">{en.description}</p>
              <p className="text-xs text-slate-400">{dateShort(en.entry_date)}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className={`tnum text-sm font-semibold ${en.type === "debit" ? "text-rose-600" : "text-emerald-600"}`}>
                {en.type === "debit" ? "+ " : "- "}{rupee(en.amount)}
              </p>
              <p className="tnum text-[11px] text-slate-400">Baaki {rupee(en.balance)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <Card className="hidden overflow-hidden sm:block">
        <div className="overflow-x-auto">
          <table className="tnum w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/60 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Detail</th>
                <th className="px-4 py-3 text-right font-medium">Udhaar (+)</th>
                <th className="px-4 py-3 text-right font-medium">Jama (-)</th>
                <th className="px-4 py-3 text-right font-medium">Baaki</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr className="text-slate-500">
                <td className="px-4 py-2.5">-</td>
                <td className="px-4 py-2.5">Purani udhari (opening)</td>
                <td className="px-4 py-2.5 text-right">{Number(customer.opening_balance) ? rupee(customer.opening_balance) : "-"}</td>
                <td className="px-4 py-2.5 text-right">-</td>
                <td className="px-4 py-2.5 text-right font-medium">{rupee(customer.opening_balance)}</td>
              </tr>
              {rows.map((en) => (
                <tr key={en.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 text-slate-600">{dateShort(en.entry_date)}</td>
                  <td className="px-4 py-2.5 text-slate-700">{en.description}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-rose-600">{en.type === "debit" ? rupee(en.amount) : ""}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-emerald-600">{en.type === "credit" ? rupee(en.amount) : ""}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{rupee(en.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={entry.type === "credit" ? "Paisa jama (grahak ne diya)" : "Udhaar chadhao"}>
        <form onSubmit={saveEntry} className="space-y-3.5">
          <Field label="Amount (₹)">
            <Input type="number" step="any" value={entry.amount} onChange={(e) => setEntry({ ...entry, amount: e.target.value })} required autoFocus placeholder="0" />
          </Field>
          <Field label="Date">
            <Input type="date" value={entry.entry_date} onChange={(e) => setEntry({ ...entry, entry_date: e.target.value })} />
          </Field>
          <Field label="Note (optional)">
            <Input value={entry.description} onChange={(e) => setEntry({ ...entry, description: e.target.value })} placeholder="cash / UPI / detail" />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Grahak Edit karo">
        <form onSubmit={saveEdit} className="space-y-3.5">
          <Field label="Naam">
            <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required placeholder="Ramesh Kumar" />
          </Field>
          <Field label="Phone">
            <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="9876543210" />
          </Field>
          <Field label="Address">
            <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} placeholder="Gaon / mohalla" />
          </Field>
          <Field label="Purani Udhari (opening)" hint="Isse baaki ka hisaab badlega — dhyan se">
            <Input type="number" step="any" value={editForm.opening_balance} onChange={(e) => setEditForm({ ...editForm, opening_balance: e.target.value })} placeholder="0" />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" loading={editSaving}>Save</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={delOpen}
        danger
        title={`"${customer.name}" delete kare?`}
        message="Iski poori udhaar history (khata) bhi delete ho jaayegi. Ye wapas nahi aayega."
        confirmLabel="Haan, delete"
        cancelLabel="Rehne do"
        onConfirm={deleteCustomer}
        onClose={() => setDelOpen(false)}
      />
    </div>
  );
}
