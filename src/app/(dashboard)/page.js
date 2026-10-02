"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Package, Wallet, ArrowRight, AlertTriangle, ReceiptText, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { rupee, qty, todayStr, dateShort } from "@/lib/format";
import { Card, Skeleton } from "@/components/ui";

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [d, setD] = useState({
    todaySale: 0,
    todayCount: 0,
    totalUdhaar: 0,
    productCount: 0,
    customerCount: 0,
    lowStock: [],
    topUdhaar: [],
    recentBills: [],
  });

  useEffect(() => {
    async function load() {
      const today = todayStr();
      const [billsToday, balances, products, customersCount, recentBills] = await Promise.all([
        supabase.from("bills").select("total_amount").eq("bill_date", today),
        supabase.from("customer_balances").select("id, name, balance").order("balance", { ascending: false }),
        supabase.from("products").select("id, name, unit, stock_qty, low_stock_alert"),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("bills").select("id, bill_no, customer_name, total_amount, paid_amount, bill_date").order("created_at", { ascending: false }).limit(5),
      ]);

      const bt = billsToday.data || [];
      const bal = balances.data || [];
      const prods = products.data || [];
      setD({
        todaySale: bt.reduce((s, b) => s + Number(b.total_amount || 0), 0),
        todayCount: bt.length,
        totalUdhaar: bal.reduce((s, c) => s + Math.max(0, Number(c.balance || 0)), 0),
        productCount: prods.length,
        customerCount: customersCount.count || 0,
        lowStock: prods.filter((p) => Number(p.low_stock_alert) > 0 && Number(p.stock_qty) <= Number(p.low_stock_alert)),
        topUdhaar: bal.filter((c) => Number(c.balance) > 0).slice(0, 5),
        recentBills: recentBills.data || [],
      });
      setLoading(false);
    }
    load();
  }, [supabase]);

  return (
    <div className="animate-in space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-slate-500">Namaste 🙏 · {dateShort(todayStr())}</p>
          <h1 className="display text-3xl text-slate-900">Dashboard</h1>
        </div>
        <Link
          href="/billing/new"
          className="hidden items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 sm:inline-flex"
        >
          <Plus size={18} /> Naya Bill
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-linear-to-br from-emerald-50 via-white to-teal-50 p-6 shadow-sm lg:col-span-2">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-emerald-200/40 blur-2xl" />
          <p className="text-sm text-slate-500">Aaj ki Sale</p>
          {loading ? (
            <Skeleton className="mt-2 h-11 w-40" />
          ) : (
            <p className="display tnum mt-1 text-[42px] leading-none text-slate-900">{rupee(d.todaySale)}</p>
          )}
          <p className="mt-1.5 text-xs text-slate-400">{d.todayCount} bill aaj bane</p>

          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-emerald-100 pt-4">
            <HeroStat label="Udhaar Baaki" value={rupee(d.totalUdhaar)} accent="text-rose-600" loading={loading} />
            <HeroStat label="Grahak" value={d.customerCount} loading={loading} />
            <HeroStat label="Maal (items)" value={d.productCount} loading={loading} />
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid gap-3">
          <ActionCard href="/billing/new" primary icon={<Plus size={20} />} title="Naya Bill" sub="Maal becho" />
          <ActionCard href="/products" icon={<Package size={20} />} title="Stock" sub="Maal manage" />
          <ActionCard href="/customers" icon={<Wallet size={20} />} title="Udhari Khata" sub="Kaun kitna dega" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent bills */}
        <Card className="p-5">
          <SectionHead title="Recent Bills" href="/bills" />
          {loading ? (
            <ListSkeleton />
          ) : d.recentBills.length === 0 ? (
            <Empty text="Abhi koi bill nahi bana." />
          ) : (
            <ul className="mt-1 divide-y divide-slate-50">
              {d.recentBills.map((b) => {
                const baaki = Number(b.total_amount) - Number(b.paid_amount);
                return (
                  <li key={b.id}>
                    <Link href={`/bills/${b.id}`} className="flex items-center gap-3 py-2.5 transition hover:opacity-70">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                        <ReceiptText size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">#{b.bill_no} · {b.customer_name || "Cash Grahak"}</p>
                        <p className="text-xs text-slate-400">{dateShort(b.bill_date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="tnum text-sm font-semibold text-slate-900">{rupee(b.total_amount)}</p>
                        {baaki > 0 ? (
                          <p className="tnum text-[11px] font-medium text-rose-600">{rupee(baaki)} baaki</p>
                        ) : (
                          <p className="text-[11px] font-medium text-emerald-600">Paid</p>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Top udhaar */}
        <Card className="p-5">
          <SectionHead title="Sabse Zyada Udhaar" href="/customers" />
          {loading ? (
            <ListSkeleton />
          ) : d.topUdhaar.length === 0 ? (
            <Empty text="Kisi ka udhaar baaki nahi. 👍" />
          ) : (
            <ul className="mt-1 divide-y divide-slate-50">
              {d.topUdhaar.map((c) => (
                <li key={c.id}>
                  <Link href={`/customers/${c.id}`} className="flex items-center gap-3 py-2.5 transition hover:opacity-70">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{c.name}</p>
                    <p className="tnum text-sm font-semibold text-rose-600">{rupee(c.balance)}</p>
                    <ChevronRight size={15} className="text-slate-300" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Low stock */}
      <Card className="p-5">
        <div className="mb-1 flex items-center gap-2">
          <AlertTriangle size={17} className="text-amber-500" />
          <h2 className="font-semibold text-slate-900">Kam Stock wala Maal</h2>
        </div>
        {loading ? (
          <ListSkeleton />
        ) : d.lowStock.length === 0 ? (
          <p className="text-sm text-slate-500">Sab theek hai, koi maal kam nahi hai. 👍</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-50">
            {d.lowStock.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5">
                <span className="text-sm font-medium text-slate-700">{p.name}</span>
                <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-600/10">
                  {qty(p.stock_qty)} {p.unit} bacha
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function HeroStat({ label, value, accent = "text-slate-900", loading }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      {loading ? <Skeleton className="mt-1 h-5 w-16" /> : <p className={`tnum text-lg font-semibold ${accent}`}>{value}</p>}
    </div>
  );
}

function ActionCard({ href, primary, icon, title, sub }) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-2xl p-4 shadow-sm transition ${
        primary ? "bg-emerald-600 text-white hover:bg-emerald-700" : "border border-slate-200/80 bg-white hover:border-slate-300"
      }`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${primary ? "bg-white/20" : "bg-emerald-50 text-emerald-700"}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-semibold ${primary ? "text-white" : "text-slate-900"}`}>{title}</p>
        <p className={`text-xs ${primary ? "text-emerald-50" : "text-slate-400"}`}>{sub}</p>
      </div>
      <ArrowRight size={17} className={`transition group-hover:translate-x-0.5 ${primary ? "text-emerald-100" : "text-slate-300"}`} />
    </Link>
  );
}

function SectionHead({ title, href }) {
  return (
    <div className="mb-1 flex items-center justify-between">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <Link href={href} className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
        Sab dekho →
      </Link>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="mt-2 space-y-2.5">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-11 w-full" />
      ))}
    </div>
  );
}

function Empty({ text }) {
  return <p className="py-4 text-sm text-slate-400">{text}</p>;
}
