"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, MessageCircle, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { rupee, qty, dateShort, todayStr } from "@/lib/format";
import { amountInWords } from "@/lib/numberToWords";
import { BUSINESS } from "@/lib/business";
import { Button, Skeleton } from "@/components/ui";
import { useRole } from "@/components/Role";
import BillFit from "@/components/BillFit";

// Bill ke saare labels - Hindi aur English dono
const LABELS = {
  hi: {
    invoice: "बिल / INVOICE",
    name: "नाम: ",
    billTo: "ग्राहक: ",
    billedBy: "विक्रेता",
    billedTo: "ग्राहक",
    billNo: "बिल नं.: ",
    date: "दिनांक: ",
    sr: "क्र.",
    desc: "विवरण",
    qty: "मात्रा",
    rate: "दर",
    amount: "मूल्य (₹)",
    inWords: "रुपया (शब्दों में):",
    subtotal: "टोटल",
    discount: "छूट",
    total: "कुल",
    paid: "अग्रिम (जमा)",
    due: "बकाया",
    paidStamp: "पूरा भुगतान ✓",
    scan: ["UPI se", "payment ke", "liye scan karo"],
    signature: "हस्ताक्षर",
    bankDetails: "बैंक विवरण (भुगतान हेतु)",
    eoe: "भूल-चूक लेनी देनी",
    thanks: "धन्यवाद 🙏",
    visitAgain: "फिर पधारें",
    blessing: "॥ श्री गणेशाय नमः ॥",
    prop: "प्रो. ",
    mob: "मो. ",
  },
  en: {
    invoice: "INVOICE",
    name: "Name: ",
    billTo: "Bill To: ",
    billedBy: "BILLED BY",
    billedTo: "BILLED TO",
    billNo: "Bill No.: ",
    date: "Date: ",
    sr: "Sr.",
    desc: "Description",
    qty: "Qty",
    rate: "Rate",
    amount: "Amount (₹)",
    inWords: "Amount in words:",
    subtotal: "Sub Total",
    discount: "Discount",
    total: "Total",
    paid: "Paid",
    due: "Balance Due",
    paidStamp: "PAID ✓",
    scan: ["Scan to", "pay via", "UPI"],
    signature: "Signature",
    bankDetails: "BANK DETAILS (FOR PAYMENT)",
    eoe: "E. & O.E.",
    thanks: "Thank you 🙏",
    visitAgain: "Please visit again",
    blessing: "|| Shri Ganeshay Namah ||",
    prop: "Prop. ",
    mob: "Mob. ",
  },
};

export default function BillDetailPage() {
  const { id } = useParams();
  const { isAdmin } = useRole();
  const supabase = useMemo(() => createClient(), []);
  const [bill, setBill] = useState(null);
  const [items, setItems] = useState([]);
  const [customer, setCustomer] = useState(null); // BILLED TO details (agar khata-wala grahak ho)
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState("en"); // "hi" | "en" — default English

  useEffect(() => {
    async function load() {
      const [bRes, iRes] = await Promise.all([
        supabase.from("bills").select("*").eq("id", id).single(),
        supabase.from("bill_items").select("*").eq("bill_id", id).order("created_at"),
      ]);
      setBill(bRes.data);
      setItems(iRes.data || []);
      if (bRes.data?.customer_id) {
        const { data: c } = await supabase.from("customers").select("phone, address").eq("id", bRes.data.customer_id).single();
        setCustomer(c);
      }
      setLoading(false);
    }
    load();
  }, [supabase, id]);

  if (loading)
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>
        <Skeleton className="mx-auto h-130 max-w-2xl rounded-2xl" />
      </div>
    );
  if (!bill)
    return (
      <p className="text-slate-500">
        Bill nahi mila. <Link href="/bills" className="text-emerald-600 underline">Wapas</Link>
      </p>
    );

  const baaki = Number(bill.total_amount) - Number(bill.paid_amount);

  const en = lang === "en";
  const L = LABELS[lang];
  const H = en ? "" : "hindi"; // Devanagari class sirf Hindi mode me
  // English mode me bade naam English, chhota naam Hindi (aur vice-versa)
  const biz = en
    ? { name: BUSINESS.name, sub: BUSINESS.nameHindi, tagline: BUSINESS.tagline, address: BUSINESS.address, prop: BUSINESS.proprietor }
    : { name: BUSINESS.nameHindi, sub: BUSINESS.name, tagline: BUSINESS.taglineHindi, address: BUSINESS.addressHindi, prop: BUSINESS.proprietorHindi };

  function whatsappShare() {
    const lines = items
      .map((it) => `${it.product_name}  ${qty(it.qty)} x ${rupee(it.rate)} = ${rupee(it.amount)}`)
      .join("\n");
    const msg =
      `*${BUSINESS.name}*\n` +
      `Bill #${bill.bill_no} | ${dateShort(bill.bill_date)}\n` +
      `Grahak: ${bill.customer_name || "Cash Grahak"}\n` +
      `--------------------\n` +
      `${lines}\n` +
      `--------------------\n` +
      `Total: ${rupee(bill.total_amount)}\n` +
      (Number(bill.discount) > 0 ? `Chhoot: ${rupee(bill.discount)}\n` : "") +
      `Jama: ${rupee(bill.paid_amount)}\n` +
      `Baaki: ${rupee(baaki)}\n\n` +
      `Dhanyawaad! 🙏`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }

  return (
    <div className="animate-in space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Link href="/bills" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600">
          <ArrowLeft size={16} /> Sab bills
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {/* Bhasha toggle - Hindi / English */}
          <div className="flex overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            {[
              ["hi", "हिंदी"],
              ["en", "English"],
            ].map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setLang(v)}
                className={`px-3.5 py-2 text-sm font-medium transition ${
                  lang === v ? "bg-emerald-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                } ${v === "hi" ? "hindi" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
          {(isAdmin || bill.bill_date === todayStr()) && (
            <Link
              href={`/bills/${id}/edit`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Pencil size={17} /> Edit
            </Link>
          )}
          <Button variant="success" onClick={whatsappShare}>
            <MessageCircle size={17} /> WhatsApp
          </Button>
          <Button onClick={() => window.print()}>
            <Printer size={17} /> Print / PDF
          </Button>
        </div>
      </div>

      {/* ===== INVOICE (desktop layout; mobile pe BillFit se scale-down) ===== */}
      <BillFit>
      <div className="print-area w-[210mm] bg-white p-[12mm] shadow-md">
       {/* Top border (accent) - border hamesha print hota hai, B&W me bhi dark line */}
       <div className="overflow-hidden rounded-lg border border-slate-300 border-t-4 border-t-emerald-600">
        <div className="p-7">

        {/* Header - brand left, INVOICE meta right */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt="" className="h-14 w-14 shrink-0 rounded-lg" />
            <div>
              <h1 className={`${en ? "" : "hindi"} text-2xl font-bold leading-tight text-emerald-700`}>{biz.name}</h1>
              <p className={`${H} mt-0.5 max-w-xs text-[11px] leading-snug text-slate-500`}>{biz.tagline}</p>
            </div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-right">
            <p className={`${H} text-xl font-bold tracking-wide text-emerald-700`}>{L.invoice}</p>
            <p className="tnum mt-0.5 text-xs text-slate-500">
              <span className={H}>{L.billNo}</span>#{bill.bill_no}
            </p>
            <p className="tnum text-xs text-slate-500">
              <span className={H}>{L.date}</span>{dateShort(bill.bill_date)}
            </p>
          </div>
        </div>

        <div className="my-4 h-px bg-slate-200" />

        {/* BILLED BY / BILLED TO */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <p className={`${H} mb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700`}>{L.billedBy}</p>
            <p className={`${en ? "" : "hindi"} text-sm font-semibold text-slate-900`}>{biz.name}</p>
            <p className={`${H} mt-0.5 text-[11px] leading-snug text-slate-500`}>{biz.address}</p>
            <p className="mt-0.5 text-[11px] text-slate-500"><span className={H}>{L.prop}{biz.prop}</span></p>
            <p className="text-[11px] text-slate-500"><span className={H}>{L.mob}</span>{BUSINESS.mobiles.join(", ")}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <p className={`${H} mb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700`}>{L.billedTo}</p>
            <p className="text-sm font-semibold text-slate-900">{bill.customer_name || "Cash Grahak"}</p>
            {customer?.phone && <p className="text-[11px] text-slate-500"><span className={H}>{L.mob}</span>{customer.phone}</p>}
            {customer?.address && <p className="text-[11px] leading-snug text-slate-500">{customer.address}</p>}
          </div>
        </div>

        {/* Items */}
        <table className="tnum mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-slate-500">
              <th className={`${H} py-2 pr-2 text-left font-medium`}>{L.sr}</th>
              <th className={`${H} py-2 pr-2 text-left font-medium`}>{L.desc}</th>
              <th className={`${H} py-2 px-2 text-right font-medium`}>{L.qty}</th>
              <th className={`${H} py-2 px-2 text-right font-medium`}>{L.rate}</th>
              <th className={`${H} py-2 pl-2 text-right font-medium`}>{L.amount}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={it.id} className="border-b border-slate-100">
                <td className="py-2.5 pr-2 text-slate-400">{i + 1}</td>
                <td className="py-2.5 pr-2 font-medium text-slate-800">{it.product_name}</td>
                <td className="py-2.5 px-2 text-right text-slate-600">{qty(it.qty)}</td>
                <td className="py-2.5 px-2 text-right text-slate-600">{rupee(it.rate)}</td>
                <td className="py-2.5 pl-2 text-right font-medium text-slate-900">{rupee(it.amount)}</td>
              </tr>
            ))}
            {items.length < 5 &&
              Array.from({ length: 5 - items.length }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-slate-100">
                  <td className="py-2.5 text-transparent">.</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 flex flex-row justify-between gap-4">
          <div className="flex-1 pt-1">
            <p className="text-xs text-slate-500">
              <span className={H}>{L.inWords}</span>
            </p>
            <p className="mt-0.5 text-sm font-medium text-slate-700">{amountInWords(bill.total_amount)}</p>
          </div>
          <div className="tnum w-full max-w-60 space-y-1.5 text-sm">
            <TotLine label={L.subtotal} value={rupee(bill.subtotal)} labelClass={H} />
            {Number(bill.discount) > 0 && <TotLine label={L.discount} value={"- " + rupee(bill.discount)} labelClass={H} />}
            <div className="flex justify-between border-t border-slate-200 pt-1.5 text-[15px] font-bold">
              <span className={`${H} text-slate-800`}>{L.total}</span>
              <span className="text-slate-900">{rupee(bill.total_amount)}</span>
            </div>
            <TotLine label={L.paid} value={rupee(bill.paid_amount)} labelClass={H} />
            {baaki > 0 ? (
              <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 font-bold text-rose-700">
                <span className={H}>{L.due}</span>
                <span>{rupee(baaki)}</span>
              </div>
            ) : (
              <div className={`${H} flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 font-bold tracking-wide text-emerald-700`}>
                {L.paidStamp}
              </div>
            )}
          </div>
        </div>

        {/* Bank details + signature */}
        <div className="mt-6 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
          <div className="text-[11px] leading-relaxed text-slate-600">
            <p className={`${H} mb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700`}>{L.bankDetails}</p>
            <p><span className="text-slate-400">Bank: </span>{BUSINESS.bank.name} ({BUSINESS.bank.branch})</p>
            <p><span className="text-slate-400">A/c Name: </span>{BUSINESS.bank.accountName}</p>
            <p><span className="text-slate-400">A/c No.: </span><span className="tnum font-semibold text-slate-800">{BUSINESS.bank.accountNo}</span></p>
            <p><span className="text-slate-400">IFSC: </span><span className="font-semibold text-slate-800">{BUSINESS.bank.ifsc}</span></p>
          </div>
          <div className="shrink-0 text-center text-xs text-slate-500">
            <div className="mb-1 h-9" />
            <p className={`${H} border-t border-slate-300 pt-1 text-slate-600`}>{L.signature}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-dashed border-slate-200 pt-4 text-center">
          <p className={`${H} text-xs text-slate-400`}>{L.eoe}</p>
          <p className={`${H} mt-1 text-sm font-medium text-slate-600`}>{L.thanks} · {L.visitAgain}</p>
        </div>
        </div>
       </div>
      </div>
      </BillFit>
    </div>
  );
}

function TotLine({ label, value, labelClass = "" }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span className={labelClass}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
