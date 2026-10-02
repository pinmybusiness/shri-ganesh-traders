"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check, ShoppingCart, Keyboard, AlertTriangle, Phone, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { rupee, qty, todayStr } from "@/lib/format";
import { Button, Input, Skeleton, Field, Card, PageHeader, Combobox, Modal } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useRole } from "@/components/Role";

// Payment mode → paisa apne aap decide hota hai
const PAY_MODES = [
  { value: "cash", label: "Cash", hint: "poora mila" },
  { value: "upi", label: "UPI", hint: "poora mila" },
  { value: "udhaar", label: "Udhaar", hint: "baad me lena" },
  { value: "mixed", label: "Mixed", hint: "thoda ab, thoda baad" },
];

// mode: "new" | "edit".  initialBill: edit ke liye pehle se bhari values.
export default function BillForm({ mode = "new", billId = null, initialBill = null }) {
  const isEdit = mode === "edit";
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const toast = useToast();
  const { isAdmin } = useRole();
  const init = initialBill || {};

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [customerId, setCustomerId] = useState(init.customer_id || "");
  const [billDate, setBillDate] = useState(init.bill_date || todayStr());

  const [items, setItems] = useState(init.items || []);
  const [pick, setPick] = useState({ product_id: "", qty: "", rate: "" });

  const [discount, setDiscount] = useState(init.discount ? String(init.discount) : "");
  const [discountType, setDiscountType] = useState("₹");
  const [paid, setPaid] = useState(init.paid_amount ? String(init.paid_amount) : "");
  const [paymentMode, setPaymentMode] = useState(init.payment_mode || "cash");
  const [note, setNote] = useState(init.note || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Quick-add (list me na mile to wahi se naya add karo)
  const [qpOpen, setQpOpen] = useState(false);
  const [qp, setQp] = useState({ name: "", unit: "nag", rate: "", stock: "" });
  const [qpSaving, setQpSaving] = useState(false);
  const [qcOpen, setQcOpen] = useState(false);
  const [qc, setQc] = useState({ name: "", phone: "", address: "" });
  const [qcSaving, setQcSaving] = useState(false);

  const prodInputRef = useRef(null);
  const qtyRef = useRef(null);
  const rateRef = useRef(null);

  useEffect(() => {
    async function load() {
      const [pRes, cRes] = await Promise.all([
        supabase.from("products").select("*").order("name"),
        supabase.from("customer_balances").select("id, name, phone, address, balance").order("name"),
      ]);
      setProducts(pRes.data || []);
      setCustomers(cRes.data || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const customerOptions = useMemo(
    () => [
      { value: "", label: "Cash Grahak (khata nahi)", sub: "bina khate ke" },
      ...customers.map((c) => ({
        value: c.id,
        label: c.name,
        sub: [c.phone, c.address].filter(Boolean).join(" · ") || "phone nahi",
        keywords: `${c.name} ${c.phone || ""} ${c.address || ""}`,
      })),
    ],
    [customers]
  );

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        value: p.id,
        label: p.name,
        sub: `${qty(p.stock_qty)} ${p.unit} stock`,
        right: `${rupee(p.rate)}/${p.unit}`,
        keywords: p.name,
      })),
    [products]
  );

  function onPickProduct(pid) {
    const p = products.find((x) => x.id === pid);
    setPick({ product_id: pid, qty: "", rate: p ? p.rate : "" });
  }

  function addItem() {
    if (!pick.product_id || !pick.qty) return;
    const p = products.find((x) => x.id === pick.product_id);
    const addQty = Number(pick.qty);
    const rate = Number(pick.rate) || 0;
    setItems((prev) => {
      // Same maal + same rate pehle se hai → naya row nahi, qty jod do (standard)
      const idx = prev.findIndex((it) => it.product_id === p.id && Number(it.rate) === rate);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: Number(copy[idx].qty) + addQty };
        toast(`${p.name} — qty jud gayi (${qty(copy[idx].qty)} ${p.unit})`);
        return copy;
      }
      return [...prev, { product_id: p.id, product_name: p.name, unit: p.unit, qty: addQty, rate }];
    });
    setPick({ product_id: "", qty: "", rate: "" });
    setTimeout(() => prodInputRef.current?.focus(), 0);
  }

  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  // ---- Quick-add: naya maal ----
  function openQuickProduct(name) {
    setQp({ name: name || "", unit: "nag", rate: "", stock: "" });
    setQpOpen(true);
  }
  async function saveQuickProduct(e) {
    e.preventDefault();
    setQpSaving(true);
    const { data, error } = await supabase
      .from("products")
      .insert({ name: qp.name.trim(), unit: qp.unit.trim() || "nag", rate: Number(qp.rate) || 0, stock_qty: Number(qp.stock) || 0, low_stock_alert: 0 })
      .select()
      .single();
    setQpSaving(false);
    if (error) {
      toast("Maal add nahi hua: " + error.message, "error");
      return;
    }
    setProducts((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setPick({ product_id: data.id, qty: "", rate: data.rate });
    setQpOpen(false);
    toast("Naya maal add ho gaya");
    setTimeout(() => qtyRef.current?.focus(), 0);
  }

  // ---- Quick-add: naya grahak ----
  function openQuickCustomer(name) {
    setQc({ name: name || "", phone: "", address: "" });
    setQcOpen(true);
  }
  async function saveQuickCustomer(e) {
    e.preventDefault();
    setQcSaving(true);
    const { data, error } = await supabase
      .from("customers")
      .insert({ name: qc.name.trim(), phone: qc.phone.trim() || null, address: qc.address.trim() || null })
      .select("id, name, phone, address")
      .single();
    setQcSaving(false);
    if (error) {
      toast("Grahak add nahi hua: " + error.message, "error");
      return;
    }
    setCustomers((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setCustomerId(data.id);
    setQcOpen(false);
    toast("Naya grahak add ho gaya");
  }

  const subtotal = items.reduce((s, it) => s + it.qty * it.rate, 0);
  const discountAmount = Math.min(
    subtotal,
    Math.max(0, discountType === "%" ? (subtotal * (Number(discount) || 0)) / 100 : Number(discount) || 0)
  );
  const total = Math.max(0, subtotal - discountAmount);
  const paidAmount =
    paymentMode === "cash" || paymentMode === "upi"
      ? total
      : paymentMode === "udhaar"
        ? 0
        : Math.min(total, Number(paid) || 0);
  const baaki = Math.max(0, total - paidAmount);

  const pickProduct = products.find((p) => p.id === pick.product_id);
  const overStock = pickProduct && Number(pick.qty) > Number(pickProduct.stock_qty);
  const selectedCustomer = customers.find((c) => c.id === customerId) || null;

  async function saveBill() {
    setError("");
    if (items.length === 0) {
      setError("Kam se kam ek maal add karo.");
      return;
    }
    setSaving(true);
    const params = {
      p_customer_id: customerId || null,
      p_customer_name: customerId ? selectedCustomer?.name || null : "Cash Grahak",
      p_bill_date: billDate,
      p_discount: discountAmount,
      p_paid_amount: paidAmount,
      p_payment_mode: paymentMode,
      p_note: note.trim() || null,
      p_items: items.map((it) => ({ product_id: it.product_id, product_name: it.product_name, qty: it.qty, rate: it.rate })),
    };
    const { data, error } = isEdit
      ? await supabase.rpc("update_bill", { p_bill_id: billId, ...params })
      : await supabase.rpc("create_bill", params);
    setSaving(false);
    if (error) {
      setError("Bill save nahi hua: " + error.message);
      return;
    }
    const bill = Array.isArray(data) ? data[0] : data;
    toast(isEdit ? "Bill update ho gaya ✓" : "Bill ban gaya ✓");
    router.push(`/bills/${bill.id}`);
    router.refresh();
  }

  if (loading)
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );

  return (
    <div className="animate-in space-y-5">
      <PageHeader title={isEdit ? "Bill Edit" : "Naya Bill"} subtitle={isEdit ? "Bill me sudhaar karo" : "Maal becho · bill banao"}>
        <div className="w-40 sm:w-44">
          <label className="mb-1 block text-xs font-medium text-slate-500">Date</label>
          <Input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} />
        </div>
      </PageHeader>

      <p className="-mt-1 flex items-center gap-2 text-xs font-medium text-slate-400">
        <StepDot n={1} /> Grahak <span className="text-slate-300">→</span>
        <StepDot n={2} /> Maal <span className="text-slate-300">→</span>
        <StepDot n={3} /> Paisa
      </p>

      <Card className="p-5">
        <Field label="Grahak">
          <Combobox
            options={customerOptions}
            value={customerId}
            onChange={setCustomerId}
            onCreateNew={openQuickCustomer}
            createLabel="Naya grahak add karo (naam, phone, address)"
            placeholder="Naam ya phone se dhoondo — ya Cash Grahak"
            emptyText="Koi grahak nahi mila"
          />
        </Field>
        {selectedCustomer && (selectedCustomer.phone || selectedCustomer.address || Number(selectedCustomer.balance) > 0) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {selectedCustomer.phone && (
              <span className="inline-flex items-center gap-1"><Phone size={13} className="text-slate-400" /> {selectedCustomer.phone}</span>
            )}
            {selectedCustomer.address && (
              <span className="inline-flex items-center gap-1"><MapPin size={13} className="text-slate-400" /> {selectedCustomer.address}</span>
            )}
            {Number(selectedCustomer.balance) > 0 && (
              <span className="tnum inline-flex items-center gap-1 font-semibold text-rose-600">
                <AlertTriangle size={13} /> Pehle se {rupee(selectedCustomer.balance)} baaki
              </span>
            )}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <p className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
          <ShoppingCart size={18} className="text-emerald-600" /> Maal add karo
        </p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-[2fr_1fr_1fr_auto]">
          <Combobox
            className="col-span-2 md:col-span-1"
            inputRef={prodInputRef}
            options={productOptions}
            value={pick.product_id}
            onChange={onPickProduct}
            onCommit={() => setTimeout(() => qtyRef.current?.focus(), 0)}
            onCreateNew={openQuickProduct}
            createLabel="Naya maal add karo"
            placeholder="Maal type karo (jaise: git...)"
            emptyText="Aisa koi maal nahi"
          />
          <Input
            ref={qtyRef}
            type="number"
            step="any"
            placeholder="Qty"
            value={pick.qty}
            onChange={(e) => setPick({ ...pick, qty: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem();
              }
            }}
          />
          <Input
            ref={rateRef}
            type="number"
            step="any"
            placeholder="Rate"
            value={pick.rate}
            onChange={(e) => setPick({ ...pick, rate: e.target.value })}
            disabled={!isAdmin}
            title={!isAdmin ? "Rate fixed hai — sirf admin badal sakta hai" : undefined}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem();
              }
            }}
          />
          <Button type="button" onClick={addItem} disabled={!pick.product_id || !pick.qty} className="col-span-2 md:col-span-1">
            <Plus size={18} /> Add
          </Button>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          <Keyboard size={14} /> Maal dhoondo → Enter → qty likho → Enter → maal add. Bas repeat karo!
        </p>
        {overStock && (
          <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            <AlertTriangle size={14} /> Dhyan: stock me sirf {qty(pickProduct.stock_qty)} {pickProduct.unit} hai — phir bhi bech sakte ho.
          </p>
        )}

        {items.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Maal</th>
                  <th className="py-2 text-right font-medium">Qty</th>
                  <th className="py-2 text-right font-medium">Rate</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((it, i) => (
                  <tr key={i}>
                    <td className="py-2 font-medium text-slate-800">{it.product_name}</td>
                    <td className="tnum py-2 text-right text-slate-600">
                      {qty(it.qty)} {it.unit || products.find((p) => p.id === it.product_id)?.unit || ""}
                    </td>
                    <td className="tnum py-2 text-right text-slate-600">{rupee(it.rate)}</td>
                    <td className="tnum py-2 text-right font-semibold text-slate-900">{rupee(it.qty * it.rate)}</td>
                    <td className="py-2 text-right">
                      <button onClick={() => removeItem(i)} className="text-slate-300 transition hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="space-y-3.5 p-5">
          <Field label="Discount" hint={discountType === "%" && Number(discount) > 0 ? `= ${rupee(discountAmount)} chhoot` : null}>
            <div className="flex gap-2">
              <Input
                type="number"
                step="any"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value.replace(/-/g, ""))}
                placeholder="0"
                className="flex-1"
              />
              <div className="flex shrink-0 overflow-hidden rounded-xl border border-slate-200">
                {["₹", "%"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDiscountType(t)}
                    className={`px-3.5 text-sm font-semibold transition ${
                      discountType === t ? "bg-emerald-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </Field>
          <Field label="Payment — paisa kaise mila?">
            <div className="grid grid-cols-2 gap-2">
              {PAY_MODES.map((m) => {
                const active = paymentMode === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setPaymentMode(m.value)}
                    className={`rounded-xl border px-3 py-2.5 text-left transition ${
                      active
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{m.label}</span>
                    <span className={`block text-xs ${active ? "text-emerald-600/80" : "text-slate-400"}`}>{m.hint}</span>
                  </button>
                );
              })}
            </div>
          </Field>

          {paymentMode === "mixed" ? (
            <Field label="Abhi kitna mila (₹)" hint={`Baaki ${rupee(baaki)} udhaar rahega`}>
              <Input type="number" step="any" min="0" value={paid} onChange={(e) => setPaid(e.target.value.replace(/-/g, ""))} placeholder="0" autoFocus />
            </Field>
          ) : (
            <div
              className={`rounded-lg px-3 py-2 text-xs font-medium ${
                paymentMode === "udhaar" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {paymentMode === "udhaar"
                ? `Poora ${rupee(total)} udhaar — khate me chadhega.`
                : `Poora ${rupee(total)} mil gaya ✓ — kuch baaki nahi.`}
            </div>
          )}

          <Field label="Note (optional)">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="gaadi no. / detail" />
          </Field>
        </Card>

        <Card className="flex flex-col justify-between p-5">
          <div className="space-y-2.5">
            <Row label="Subtotal" value={rupee(subtotal)} />
            <Row label={discountType === "%" && Number(discount) > 0 ? `Discount (${discount}%)` : "Discount"} value={"- " + rupee(discountAmount)} />
            <div className="border-t border-slate-100 pt-2.5">
              <Row label="Total" value={rupee(total)} big />
            </div>
            <Row label="Mila" value={rupee(paidAmount)} />
            <Row label="Baaki (udhaar)" value={rupee(baaki)} danger={baaki > 0} />
            {customerId === "" && baaki > 0 && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Cash grahak ka udhaar khate me nahi chadhega. Udhaar ke liye upar se grahak chuno.
              </p>
            )}
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          </div>
          <Button onClick={saveBill} size="lg" loading={saving} disabled={items.length === 0} className="mt-4 w-full">
            {saving ? "Ho raha hai..." : (<><Check size={18} /> {isEdit ? "Bill Update karo" : "Bill Banao"}</>)}
          </Button>
        </Card>
      </div>

      {/* Quick-add: naya maal */}
      <Modal open={qpOpen} onClose={() => setQpOpen(false)} title="Naya Maal — turant add">
        <form onSubmit={saveQuickProduct} className="space-y-3.5">
          <Field label="Naam">
            <Input value={qp.name} onChange={(e) => setQp({ ...qp, name: e.target.value })} required autoFocus placeholder="Gitti 10mm" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit">
              <Input value={qp.unit} onChange={(e) => setQp({ ...qp, unit: e.target.value })} placeholder="ton" />
            </Field>
            <Field label="Rate (₹/unit)">
              <Input type="number" step="any" value={qp.rate} onChange={(e) => setQp({ ...qp, rate: e.target.value })} placeholder="0" />
            </Field>
          </div>
          <Field label="Abhi kitna stock hai">
            <Input type="number" step="any" value={qp.stock} onChange={(e) => setQp({ ...qp, stock: e.target.value })} placeholder="0" />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setQpOpen(false)}>Cancel</Button>
            <Button type="submit" loading={qpSaving}>Add karo</Button>
          </div>
        </form>
      </Modal>

      {/* Quick-add: naya grahak */}
      <Modal open={qcOpen} onClose={() => setQcOpen(false)} title="Naya Grahak — turant add">
        <form onSubmit={saveQuickCustomer} className="space-y-3.5">
          <Field label="Naam">
            <Input value={qc.name} onChange={(e) => setQc({ ...qc, name: e.target.value })} required autoFocus placeholder="Ramesh Kumar" />
          </Field>
          <Field label="Phone">
            <Input value={qc.phone} onChange={(e) => setQc({ ...qc, phone: e.target.value })} placeholder="9876543210" />
          </Field>
          <Field label="Address">
            <Input value={qc.address} onChange={(e) => setQc({ ...qc, address: e.target.value })} placeholder="Gaon / mohalla" />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setQcOpen(false)}>Cancel</Button>
            <Button type="submit" loading={qcSaving}>Add karo</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Row({ label, value, big, danger }) {
  return (
    <div className="flex items-center justify-between">
      <span className={big ? "font-semibold text-slate-900" : "text-sm text-slate-500"}>{label}</span>
      <span className={`tnum ${big ? "text-xl font-bold" : "text-sm font-medium"} ${danger ? "text-red-600" : "text-slate-900"}`}>{value}</span>
    </div>
  );
}

function StepDot({ n }) {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
      {n}
    </span>
  );
}
