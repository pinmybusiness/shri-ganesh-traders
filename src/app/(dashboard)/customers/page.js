"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Users, ChevronRight, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { rupee } from "@/lib/format";
import { Button, Input, Modal, Field, Card, EmptyState, PageHeader, Skeleton, ListSkeleton } from "@/components/ui";
import { useToast } from "@/components/Toast";

export default function CustomersPage() {
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", opening_balance: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("customer_balances").select("*").order("name");
    setCustomers(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveCustomer(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("customers").insert({
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      opening_balance: Number(form.opening_balance) || 0,
    });
    setSaving(false);
    if (error) {
      toast("Grahak add nahi hua: " + error.message, "error");
      return;
    }
    setOpen(false);
    setForm({ name: "", phone: "", address: "", opening_balance: "" });
    toast("Naya grahak add ho gaya");
    load();
  }

  const filtered = customers.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone || "").includes(search)
  );
  const totalUdhaar = customers.reduce((s, c) => s + Math.max(0, Number(c.balance || 0)), 0);

  if (loading)
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <ListSkeleton rows={6} />
      </div>
    );

  return (
    <div className="animate-in space-y-5">
      <PageHeader title="Grahak / Khata" subtitle={`${customers.length} grahak`}>
        <Button onClick={() => setOpen(true)}>
          <Plus size={18} /> Naya Grahak
        </Button>
      </PageHeader>

      <Card className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <Wallet size={22} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Total Udhaar Baaki</p>
          <p className="display tnum text-3xl text-slate-900">{rupee(totalUdhaar)}</p>
          <p className="text-xs text-slate-400">sab grahak milake</p>
        </div>
      </Card>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input className="pl-9" placeholder="Naam ya phone se dhoondo..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Users size={40} />} title="Koi grahak nahi mila" hint="'Naya Grahak' se add karo" />
      ) : (
        <Card className="divide-y divide-slate-50 overflow-hidden p-0">
          {filtered.map((c) => {
            const bal = Number(c.balance || 0);
            return (
              <Link key={c.id} href={`/customers/${c.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 active:bg-slate-100">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-600">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.phone || "phone nahi"}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`tnum font-semibold ${bal > 0 ? "text-rose-600" : bal < 0 ? "text-emerald-600" : "text-slate-400"}`}>
                    {rupee(bal)}
                  </p>
                  <p className="text-[10px] text-slate-400">{bal > 0 ? "baaki" : bal < 0 ? "advance" : "clear"}</p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-slate-300" />
              </Link>
            );
          })}
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Naya Grahak Add karo">
        <form onSubmit={saveCustomer} className="space-y-3.5">
          <Field label="Naam">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ramesh Kumar" />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
          </Field>
          <Field label="Address">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Gaon / mohalla" />
          </Field>
          <Field label="Purani Udhari" hint="Jo pehle se baaki hai (na ho to 0)">
            <Input type="number" step="any" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: e.target.value })} placeholder="0" />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
