"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { rupee, qty, dateShort, todayStr } from "@/lib/format";
import { Button, Input, Card, Skeleton, PageHeader, EmptyState } from "@/components/ui";
import { BUSINESS } from "@/lib/business";
import { Printer, ReceiptText, Lock } from "lucide-react";
import { useRole } from "@/components/Role";

// ---- Date helpers (browser) ----
function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("en-CA");
}
function monthStart() {
  const d = new Date();
  d.setDate(1);
  return d.toLocaleDateString("en-CA");
}

const MODE_LABEL = { cash: "Cash", upi: "UPI", udhaar: "Udhaar", mixed: "Mixed" };

export default function ReportsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { isAdmin, loading: roleLoading } = useRole();
  const today = todayStr();

  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [filter, setFilter] = useState("all"); // "all" | "udhaar"
  const [bills, setBills] = useState([]);
  const [rawItems, setRawItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Grahak list ek baar (naam resolve + link ke liye)
  useEffect(() => {
    supabase
      .from("customers")
      .select("id, name")
      .then(({ data }) => setCustomers(data || []));
  }, [supabase]);

  // Bill pe grahak ka sahi naam (registered ho to customers se, warna stored name)
  const custName = (b) => {
    if (b.customer_id) {
      const c = customers.find((x) => x.id === b.customer_id);
      if (c) return c.name;
    }
    return b.customer_name || "Cash Grahak";
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: bRows } = await supabase
        .from("bills")
        .select("*")
        .gte("bill_date", from)
        .lte("bill_date", to)
        .order("bill_no", { ascending: true });
      const b = bRows || [];

      let its = [];
      if (b.length) {
        const ids = b.map((x) => x.id);
        const { data } = await supabase.from("bill_items").select("product_name, qty, amount, bill_id").in("bill_id", ids);
        its = data || [];
      }
      setBills(b);
      setRawItems(its);
      setLoading(false);
    }
    load();
  }, [supabase, from, to]);

  const ranges = [
    { label: "Aaj", from: today, to: today },
    { label: "Kal", from: addDays(today, -1), to: addDays(today, -1) },
    { label: "7 din", from: addDays(today, -6), to: today },
    { label: "Is mahina", from: monthStart(), to: today },
  ];
  const isActiveRange = (r) => r.from === from && r.to === to;

  const baakiOf = (b) => Math.max(0, Number(b.total_amount || 0) - Number(b.paid_amount || 0));

  // Filter + sort (udhaar mode: sirf baaki-wale, sabse zyada baaki upar)
  const filteredBills = useMemo(() => {
    if (filter === "udhaar") {
      return bills.filter((b) => baakiOf(b) > 0).sort((a, b) => baakiOf(b) - baakiOf(a));
    }
    return bills;
  }, [bills, filter]);

  const itemsAgg = useMemo(() => {
    const ids = new Set(filteredBills.map((b) => b.id));
    const map = {};
    rawItems.forEach((it) => {
      if (!ids.has(it.bill_id)) return;
      if (!map[it.product_name]) map[it.product_name] = { name: it.product_name, qty: 0, amount: 0 };
      map[it.product_name].qty += Number(it.qty);
      map[it.product_name].amount += Number(it.amount);
    });
    return Object.values(map).sort((x, y) => y.amount - x.amount);
  }, [rawItems, filteredBills]);

  const totalSale = filteredBills.reduce((s, b) => s + Number(b.total_amount || 0), 0);
  const totalPaid = filteredBills.reduce((s, b) => s + Number(b.paid_amount || 0), 0);
  const totalBaaki = filteredBills.reduce((s, b) => s + baakiOf(b), 0);
  const totalDiscount = filteredBills.reduce((s, b) => s + Number(b.discount || 0), 0);

  const byMode = {};
  filteredBills.forEach((b) => {
    const m = b.payment_mode || "cash";
    byMode[m] = (byMode[m] || 0) + Number(b.total_amount || 0);
  });

  const isUdhaar = filter === "udhaar";
  const periodText = from === to ? dateShort(from) : `${dateShort(from)} – ${dateShort(to)}`;
  const reportTitle = isUdhaar ? "Udhaar (Baaki) Report" : "Sales Report";

  // Sirf admin — staff ko report nahi
  if (!roleLoading && !isAdmin) {
    return (
      <div className="animate-in space-y-5">
        <PageHeader title="Report" />
        <EmptyState icon={<Lock size={40} />} title="Sirf admin ke liye" hint="Report dekhne ki permission nahi hai — admin se poochho." />
      </div>
    );
  }

  return (
    <div className="animate-in space-y-5">
      <PageHeader title="Report" subtitle="Din ka hisaab — sale, cash, udhaar">
        <Button onClick={() => window.print()} disabled={filteredBills.length === 0}>
          <Printer size={17} /> Print
        </Button>
      </PageHeader>

      {/* Controls - print me nahi aayenge */}
      <Card className="no-print space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          {ranges.map((r) => (
            <button
              key={r.label}
              onClick={() => {
                setFrom(r.from);
                setTo(r.to);
              }}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                isActiveRange(r)
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Se (From)</label>
            <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Tak (To)</label>
            <Input type="date" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        {/* Filter: sab ya sirf udhaar */}
        <div className="flex gap-2 border-t border-slate-100 pt-3">
          {[
            ["all", "Sab bills"],
            ["udhaar", "Sirf Udhaar baaki"],
          ].map(([v, label]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                filter === v
                  ? v === "udhaar"
                    ? "border-rose-500 bg-rose-50 text-rose-700"
                    : "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : filteredBills.length === 0 ? (
        <EmptyState
          icon={<ReceiptText size={40} />}
          title={isUdhaar ? "Is period me koi udhaar baaki nahi 👍" : "Is period me koi bill nahi"}
          hint="Doosri date ya filter chuno"
        />
      ) : (
        /* ===== PRINTABLE REPORT ===== */
        <div className="print-area rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          {/* Report header */}
          <div className="mb-5 border-b border-slate-200 pb-4 text-center">
            <h2 className="text-xl font-bold text-slate-900">{BUSINESS.name}</h2>
            <p className={`text-sm font-semibold ${isUdhaar ? "text-rose-600" : "text-emerald-700"}`}>{reportTitle}</p>
            <p className="mt-0.5 text-xs text-slate-500">{periodText}</p>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox label="Total (in bills)" value={rupee(totalSale)} accent="text-slate-900" />
            <StatBox label="Mila (jama)" value={rupee(totalPaid)} accent="text-emerald-700" />
            <StatBox label="Udhaar (baaki)" value={rupee(totalBaaki)} accent="text-rose-600" />
            <StatBox label={isUdhaar ? "Udhaar bills" : "Discount diya"} value={isUdhaar ? String(filteredBills.length) : rupee(totalDiscount)} accent="text-amber-600" />
          </div>
          {!isUdhaar && (
            <p className="mt-2 text-xs text-slate-500">
              Total <span className="font-semibold text-slate-700">{filteredBills.length}</span> bill is period me.
            </p>
          )}

          {/* Payment breakdown */}
          <div className="mt-5 flex flex-wrap gap-2">
            {Object.entries(byMode).map(([m, amt]) => (
              <span key={m} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                {MODE_LABEL[m] || m}: <span className="tnum font-semibold text-slate-800">{rupee(amt)}</span>
              </span>
            ))}
          </div>

          {/* Bills table */}
          <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-900">
            {isUdhaar ? "Udhaar wale bills" : "Bills"} ({filteredBills.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="tnum w-full border-collapse text-sm">
              <thead>
                <tr className="border-y border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-2 font-medium">Bill</th>
                  <th className="py-2 pr-2 font-medium">Date</th>
                  <th className="py-2 pr-2 font-medium">Grahak</th>
                  <th className="py-2 px-2 text-right font-medium">Total</th>
                  <th className="py-2 px-2 text-right font-medium">Mila</th>
                  <th className="py-2 pl-2 text-right font-medium">Baaki</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((b) => {
                  const baaki = baakiOf(b);
                  return (
                    <tr key={b.id} className="border-b border-slate-100">
                      <td className="py-2 pr-2 font-medium text-slate-800">#{b.bill_no}</td>
                      <td className="py-2 pr-2 text-slate-500">{dateShort(b.bill_date)}</td>
                      <td className="py-2 pr-2 text-slate-700">
                        {b.customer_id ? (
                          <Link
                            href={`/customers/${b.customer_id}`}
                            className="font-medium underline-offset-2 hover:text-emerald-700 hover:underline"
                            title="Grahak ka poora khata dekho"
                          >
                            {custName(b)}
                          </Link>
                        ) : (
                          custName(b)
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-semibold text-slate-900">{rupee(b.total_amount)}</td>
                      <td className="py-2 px-2 text-right text-emerald-700">{rupee(b.paid_amount)}</td>
                      <td className="py-2 pl-2 text-right font-medium text-rose-600">{baaki > 0 ? rupee(baaki) : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 text-sm font-bold">
                  <td className="py-2 pr-2" colSpan={3}>Total</td>
                  <td className="py-2 px-2 text-right text-slate-900">{rupee(totalSale)}</td>
                  <td className="py-2 px-2 text-right text-emerald-700">{rupee(totalPaid)}</td>
                  <td className="py-2 pl-2 text-right text-rose-600">{rupee(totalBaaki)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Item-wise sales (sirf 'sab bills' me) */}
          {!isUdhaar && itemsAgg.length > 0 && (
            <>
              <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-900">Maal-wise bikri</h3>
              <div className="overflow-x-auto">
                <table className="tnum w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-y border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="py-2 pr-2 font-medium">Maal</th>
                      <th className="py-2 px-2 text-right font-medium">Kitna bika (qty)</th>
                      <th className="py-2 pl-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsAgg.map((it) => (
                      <tr key={it.name} className="border-b border-slate-100">
                        <td className="py-2 pr-2 font-medium text-slate-800">{it.name}</td>
                        <td className="py-2 px-2 text-right text-slate-600">{qty(it.qty)}</td>
                        <td className="py-2 pl-2 text-right font-semibold text-slate-900">{rupee(it.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <p className="mt-6 text-center text-[11px] text-slate-400">
            {BUSINESS.name} · Report print: {dateShort(today)}
          </p>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`tnum mt-0.5 text-lg font-bold ${accent || "text-slate-900"}`}>{value}</p>
    </div>
  );
}
