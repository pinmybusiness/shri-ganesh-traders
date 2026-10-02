"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { todayStr } from "@/lib/format";
import { Skeleton, EmptyState } from "@/components/ui";
import { useRole } from "@/components/Role";
import BillForm from "@/components/BillForm";

export default function EditBillPage() {
  const { id } = useParams();
  const { isAdmin, loading: roleLoading } = useRole();
  const supabase = useMemo(() => createClient(), []);
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const [bRes, iRes] = await Promise.all([
        supabase.from("bills").select("*").eq("id", id).single(),
        supabase.from("bill_items").select("*").eq("bill_id", id).order("created_at"),
      ]);
      if (!bRes.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const b = bRes.data;
      setInitial({
        customer_id: b.customer_id || "",
        bill_date: b.bill_date,
        discount: Number(b.discount) || 0,
        paid_amount: Number(b.paid_amount) || 0,
        payment_mode: b.payment_mode || "cash",
        note: b.note || "",
        items: (iRes.data || []).map((it) => ({
          product_id: it.product_id || "",
          product_name: it.product_name,
          qty: Number(it.qty),
          rate: Number(it.rate),
          unit: "",
        })),
      });
      setLoading(false);
    }
    load();
  }, [supabase, id]);

  if (loading)
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    );

  if (notFound)
    return (
      <p className="text-slate-500">
        Bill nahi mila. <Link href="/bills" className="text-emerald-600 underline">Wapas</Link>
      </p>
    );

  // Staff sirf AAJ ka bill edit kar sakta hai; purane bill admin only
  if (!roleLoading && !isAdmin && initial?.bill_date !== todayStr()) {
    return (
      <EmptyState
        icon={<Lock size={40} />}
        title="Purana bill edit nahi kar sakte"
        hint="Staff sirf aaj ka bill edit kar sakta hai. Purane bill ke liye admin se poochho."
      >
        <Link href={`/bills/${id}`} className="text-sm font-medium text-emerald-600 hover:underline">
          ← Bill pe wapas
        </Link>
      </EmptyState>
    );
  }

  return <BillForm mode="edit" billId={id} initialBill={initial} />;
}
