"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, ReceiptText, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { rupee, dateShort } from "@/lib/format";
import { Input, Card, Badge, EmptyState, PageHeader, Skeleton, ListSkeleton } from "@/components/ui";

export default function BillsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("bills")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      setBills(data || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const filtered = bills.filter(
    (b) => (b.customer_name || "").toLowerCase().includes(search.toLowerCase()) || String(b.bill_no).includes(search)
  );

  if (loading)
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <ListSkeleton rows={7} />
      </div>
    );

  return (
    <div className="animate-in space-y-5">
      <PageHeader title="Bills" subtitle={`${bills.length} bill`} />

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input className="pl-9" placeholder="Bill no. ya grahak naam se dhoondo..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<ReceiptText size={40} />} title="Koi bill nahi mila" hint="Naya Bill se shuru karo" />
      ) : (
        <Card className="divide-y divide-slate-50 overflow-hidden p-0">
          {filtered.map((b) => {
            const baaki = Number(b.total_amount) - Number(b.paid_amount);
            return (
              <Link key={b.id} href={`/bills/${b.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 active:bg-slate-100">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ReceiptText size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{b.customer_name || "Cash Grahak"}</p>
                  <p className="tnum text-xs text-slate-400">#{b.bill_no} · {dateShort(b.bill_date)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="tnum font-semibold text-slate-900">{rupee(b.total_amount)}</p>
                  {baaki > 0 ? <Badge color="red">{rupee(baaki)} baaki</Badge> : <Badge color="green">Paid</Badge>}
                </div>
                <ChevronRight size={16} className="shrink-0 text-slate-300" />
              </Link>
            );
          })}
        </Card>
      )}
    </div>
  );
}
