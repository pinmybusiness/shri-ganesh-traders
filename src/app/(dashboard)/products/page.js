"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, ArrowDownToLine, ArrowUpFromLine, Pencil, Trash2, PackageX, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { rupee, qty } from "@/lib/format";
import { Button, Input, Modal, Field, Card, Badge, EmptyState, PageHeader, ConfirmDialog, ListSkeleton, Skeleton } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useRole } from "@/components/Role";

const UNIT_SUGGESTIONS = ["nag", "bag", "ton", "truck", "tractor", "trailer", "brass", "cft", "kg", "litre", "piece", "sheet"];

export default function ProductsPage() {
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();
  const { isAdmin } = useRole();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", unit: "nag", rate: "", stock_qty: "", low_stock_alert: "" });
  const [saving, setSaving] = useState(false);

  const [moveOpen, setMoveOpen] = useState(false);
  const [moveProduct, setMoveProduct] = useState(null);
  const [move, setMove] = useState({ type: "in", qty: "", note: "" });

  const [delTarget, setDelTarget] = useState(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("name");
    setProducts(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", unit: "nag", rate: "", stock_qty: "", low_stock_alert: "" });
    setFormOpen(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({ name: p.name, unit: p.unit, rate: p.rate, stock_qty: p.stock_qty, low_stock_alert: p.low_stock_alert });
    setFormOpen(true);
  }

  async function saveProduct(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      unit: form.unit.trim() || "nag",
      rate: Number(form.rate) || 0,
      low_stock_alert: Number(form.low_stock_alert) || 0,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("products").update(payload).eq("id", editing.id));
    } else {
      payload.stock_qty = Number(form.stock_qty) || 0;
      ({ error } = await supabase.from("products").insert(payload));
    }
    setSaving(false);
    if (error) {
      toast("Save nahi hua: " + error.message, "error");
      return;
    }
    setFormOpen(false);
    toast(editing ? "Maal update ho gaya" : "Naya maal add ho gaya");
    load();
  }

  function openMove(p, type) {
    setMoveProduct(p);
    setMove({ type, qty: "", note: "" });
    setMoveOpen(true);
  }

  async function saveMove(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.rpc("record_stock_movement", {
      p_product_id: moveProduct.id,
      p_type: move.type,
      p_qty: Number(move.qty) || 0,
      p_note: move.note || null,
    });
    setSaving(false);
    if (error) {
      toast("Nahi hua: " + error.message, "error");
      return;
    }
    setMoveOpen(false);
    toast(move.type === "in" ? "Maal aaya — stock badha" : "Stock kam hua");
    load();
  }

  async function deleteProduct(p) {
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) {
      toast("Delete nahi hua: " + error.message, "error");
      return;
    }
    toast("Maal delete ho gaya");
    load();
  }

  if (loading)
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-48" />
        <ListSkeleton rows={6} />
      </div>
    );

  const totalValue = products.reduce((s, p) => s + Number(p.stock_qty) * Number(p.rate), 0);
  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-in space-y-5">
      <PageHeader title="Stock / Maal" subtitle={`${products.length} items · ${rupee(totalValue)} ka maal`}>
        <Button onClick={openAdd}>
          <Plus size={18} /> Naya Maal
        </Button>
      </PageHeader>

      {products.length === 0 ? (
        <EmptyState icon={<PackageX size={40} />} title="Abhi koi maal nahi hai" hint="'Naya Maal' se add karo" />
      ) : (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="Maal ka naam dhoondo..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={<Search size={36} />} title="Koi maal nahi mila" hint="Doosra naam try karo" />
          ) : (
            <>
              {/* Mobile: cards (app jaisa) */}
              <div className="space-y-2.5 sm:hidden">
                {filtered.map((p) => {
                  const low = Number(p.low_stock_alert) > 0 && Number(p.stock_qty) <= Number(p.low_stock_alert);
                  return (
                    <Card key={p.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          <p className="tnum mt-0.5 text-sm text-slate-500">
                            {rupee(p.rate)}<span className="text-slate-400">/{p.unit}</span>
                          </p>
                        </div>
                        {low ? (
                          <Badge color="red">{qty(p.stock_qty)} {p.unit} · kam!</Badge>
                        ) : (
                          <span className="tnum shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">
                            {qty(p.stock_qty)} {p.unit}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                        <MobAction onClick={() => openMove(p, "in")} color="emerald"><ArrowDownToLine size={17} /> Aaya</MobAction>
                        <MobAction onClick={() => openMove(p, "out")} color="amber"><ArrowUpFromLine size={17} /> Nikla</MobAction>
                        <MobAction onClick={() => openEdit(p)} color="slate"><Pencil size={17} /> Edit</MobAction>
                        {isAdmin && (
                          <MobAction onClick={() => setDelTarget(p)} color="red"><Trash2 size={17} /> Delete</MobAction>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop: table */}
              <Card className="hidden overflow-hidden sm:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50/60 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Maal</th>
                        <th className="px-4 py-3 font-medium">Rate</th>
                        <th className="px-4 py-3 font-medium">Stock</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filtered.map((p) => {
                        const low = Number(p.low_stock_alert) > 0 && Number(p.stock_qty) <= Number(p.low_stock_alert);
                        return (
                          <tr key={p.id} className="transition hover:bg-slate-50/60">
                            <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                            <td className="tnum px-4 py-3 text-slate-600">
                              {rupee(p.rate)}
                              <span className="text-slate-400">/{p.unit}</span>
                            </td>
                            <td className="px-4 py-3">
                              {low ? (
                                <Badge color="red">{qty(p.stock_qty)} {p.unit} · kam!</Badge>
                              ) : (
                                <span className="text-slate-700">{qty(p.stock_qty)} {p.unit}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1">
                                <IconBtn onClick={() => openMove(p, "in")} title="Maal aaya" color="emerald"><ArrowDownToLine size={16} /></IconBtn>
                                <IconBtn onClick={() => openMove(p, "out")} title="Maal nikala" color="amber"><ArrowUpFromLine size={16} /></IconBtn>
                                <IconBtn onClick={() => openEdit(p)} title="Edit" color="slate"><Pencil size={16} /></IconBtn>
                                {isAdmin && (
                                  <IconBtn onClick={() => setDelTarget(p)} title="Delete" color="red"><Trash2 size={16} /></IconBtn>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Maal Edit karo" : "Naya Maal Add karo"}>
        <form onSubmit={saveProduct} className="space-y-3.5">
          <Field label="Naam">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Gitti 10mm" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit">
              <Input list="units" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="ton" />
              <datalist id="units">
                {UNIT_SUGGESTIONS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </Field>
            <Field label="Rate (₹/unit)" hint={!isAdmin && editing ? "Sirf admin rate badal sakta hai" : null}>
              <Input
                type="number"
                step="any"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                placeholder="0"
                disabled={!isAdmin && !!editing}
              />
            </Field>
          </div>
          {!editing && (
            <Field label="Abhi kitna stock hai">
              <Input type="number" step="any" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} placeholder="0" />
            </Field>
          )}
          <Field label="Kam stock alert" hint="Itne se kam ho to dashboard pe warning aayega">
            <Input type="number" step="any" value={form.low_stock_alert} onChange={(e) => setForm({ ...form, low_stock_alert: e.target.value })} placeholder="0" />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        title={moveProduct ? `${moveProduct.name} · ${move.type === "in" ? "Maal aaya" : "Maal nikala"}` : ""}
      >
        <form onSubmit={saveMove} className="space-y-3.5">
          <Field label={`Kitna ${move.type === "in" ? "aaya" : "nikala"} (${moveProduct?.unit || ""})`}>
            <Input type="number" step="any" value={move.qty} onChange={(e) => setMove({ ...move, qty: e.target.value })} required autoFocus placeholder="0" />
          </Field>
          <Field label="Note (optional)">
            <Input value={move.note} onChange={(e) => setMove({ ...move, note: e.target.value })} placeholder="kis se aaya / kaha gaya" />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setMoveOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!delTarget}
        danger
        title={`"${delTarget?.name}" delete kare?`}
        message="Purane bill safe rahenge, sirf maal list se hatega."
        confirmLabel="Haan, delete"
        cancelLabel="Rehne do"
        onConfirm={() => delTarget && deleteProduct(delTarget)}
        onClose={() => setDelTarget(null)}
      />
    </div>
  );
}

function IconBtn({ onClick, title, color, children }) {
  const colors = {
    emerald: "text-emerald-600 hover:bg-emerald-50",
    amber: "text-amber-600 hover:bg-amber-50",
    slate: "text-slate-500 hover:bg-slate-100",
    red: "text-red-600 hover:bg-red-50",
  };
  return (
    <button onClick={onClick} title={title} className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${colors[color]}`}>
      {children}
    </button>
  );
}

// Mobile ke bade tap-buttons (icon + label)
function MobAction({ onClick, color, children }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700 active:bg-emerald-100",
    amber: "bg-amber-50 text-amber-700 active:bg-amber-100",
    slate: "bg-slate-100 text-slate-600 active:bg-slate-200",
    red: "bg-rose-50 text-rose-600 active:bg-rose-100",
  };
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 text-[11px] font-medium transition ${colors[color]}`}
    >
      {children}
    </button>
  );
}
