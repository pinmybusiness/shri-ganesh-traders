"use client";

// Reusable UI pieces - Minimal & Elegant theme
// (warm paper bg, emerald jewel accent, soft cards, non-tech friendly)

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertTriangle, Search, ChevronDown, Plus } from "lucide-react";

export function Button({ variant = "primary", size = "md", loading = false, className = "", children, disabled, ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 select-none";
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-[15px]",
    xl: "px-6 py-3.5 text-base",
  };
  const variants = {
    primary: "bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/25",
    secondary: "bg-white text-slate-700 border border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50",
    success: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
    danger: "bg-rose-600 text-white shadow-sm shadow-rose-600/20 hover:bg-rose-700",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} disabled={disabled || loading} {...props}>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`w-full appearance-none rounded-xl border border-slate-200 bg-white bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-[length:18px] bg-[right_0.75rem_center] bg-no-repeat px-3.5 py-2.5 pr-10 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({ label, children, hint }) {
  return (
    <div>
      {label && <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function Card({ className = "", hover = false, children }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${
        hover ? "transition hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(15,23,42,0.07)]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({ color = "slate", children }) {
  const colors = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10",
    red: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/10",
    amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/10",
    accent: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

// Har page ke top pe consistent header - title + subtitle + action
export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        <h1 className="display text-3xl leading-tight text-slate-900">{title}</h1>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  // Escape se band + background scroll lock (jab tak modal khula hai)
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="animate-overlay fixed inset-0 z-50 flex items-end justify-center bg-slate-900/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="animate-scale-in w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Band karo"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// window.confirm ki jagah - saaf Hindi buttons, non-tech friendly
export function ConfirmDialog({ open, title = "Pakka?", message, confirmLabel = "Haan", cancelLabel = "Nahi", danger = false, onConfirm, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="animate-overlay fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true">
      <div className="animate-scale-in w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${danger ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {message && <p className="mt-1.5 text-sm text-slate-500">{message}</p>}
        <div className="mt-6 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>{cancelLabel}</Button>
          <Button variant={danger ? "danger" : "primary"} className="flex-1" onClick={() => { onConfirm?.(); onClose?.(); }}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-emerald-600" />
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`shimmer rounded-lg bg-slate-200/70 ${className}`} />;
}

// List rows ka skeleton - real layout jaisa dikhta hai (jump nahi hota)
export function ListSkeleton({ rows = 5, className = "" }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-3.5">
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, hint, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 px-6 py-16 text-center">
      {icon && <div className="mb-3 text-slate-300">{icon}</div>}
      <p className="font-medium text-slate-600">{title}</p>
      {hint && <p className="mt-1 text-sm text-slate-400">{hint}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

// Searchable dropdown - type karke dhoondo, arrow keys + Enter se select.
// options: [{ value, label, sub, right, keywords }]
export function Combobox({
  options = [],
  value,
  onChange,
  onCommit,            // pick hone ke baad (e.g. next field pe focus)
  onCreateNew,         // (query) => void — "naya add karo" dabane pe
  createLabel = "Naya add karo",
  placeholder = "Dhoondo...",
  emptyText = "Kuch nahi mila",
  inputRef,
  autoFocus = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const wrapRef = useRef(null);
  const localRef = useRef(null);
  const ref = inputRef || localRef;
  const listRef = useRef(null);

  const selected = options.find((o) => o.value === value) || null;
  const query = q.trim().toLowerCase();
  const filtered = query
    ? options.filter((o) => `${o.label} ${o.keywords || ""}`.toLowerCase().includes(query))
    : options;

  useEffect(() => {
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // highlighted option ko view me rakho
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[hi];
    el?.scrollIntoView({ block: "nearest" });
  }, [hi, open]);

  function choose(o) {
    if (!o) return;
    onChange?.(o.value);
    setQ("");
    setOpen(false);
    setHi(0);
    onCommit?.(o);
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHi((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (open && filtered[hi]) {
        e.preventDefault();
        choose(filtered[hi]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          ref={ref}
          autoFocus={autoFocus}
          value={open ? q : selected?.label ?? ""}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setHi(0);
          }}
          onFocus={() => {
            setOpen(true);
            setQ("");
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pl-9 pr-9 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
        />
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>

      {open && (
        <div
          ref={listRef}
          className="absolute z-40 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <p className="px-3.5 py-3 text-sm text-slate-400">{emptyText}</p>
          ) : (
            filtered.map((o, i) => (
              <button
                type="button"
                key={o.value || "__none"}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHi(i)}
                onClick={() => choose(o)}
                className={`flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm transition ${
                  i === hi ? "bg-emerald-50" : "hover:bg-slate-50"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-slate-800">{o.label}</span>
                  {o.sub && <span className="block truncate text-xs text-slate-400">{o.sub}</span>}
                </span>
                {o.right && <span className="tnum shrink-0 text-xs font-medium text-slate-500">{o.right}</span>}
              </button>
            ))
          )}

          {onCreateNew && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setOpen(false);
                onCreateNew(q.trim());
              }}
              className="flex w-full items-center gap-2 border-t border-slate-100 px-3.5 py-2.5 text-left text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
            >
              <Plus size={16} /> {q.trim() ? `"${q.trim()}" — naya add karo` : createLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
