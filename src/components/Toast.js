"use client";

// Chhota toast system - save/delete pe "✓ ho gaya" feedback ke liye.
// Use: const toast = useToast(); toast("Save ho gaya"); toast("Kuch galat hua", "error");

import { createContext, useContext, useCallback, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

const ToastContext = createContext(() => {});

export function useToast() {
  return useContext(ToastContext);
}

let counter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (message, type = "success") => {
      counter += 1;
      const id = counter;
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => remove(id), 2800);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="no-print pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 md:inset-x-auto md:right-4 md:bottom-4 md:items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-scale-in pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-xl border bg-white px-4 py-3 shadow-lg md:w-auto ${
              t.type === "error" ? "border-rose-200" : "border-emerald-200"
            }`}
          >
            {t.type === "error" ? (
              <AlertCircle size={18} className="shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
            )}
            <span className="flex-1 text-sm font-medium text-slate-800">{t.message}</span>
            <button onClick={() => remove(t.id)} aria-label="Band karo" className="text-slate-300 transition hover:text-slate-500">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
