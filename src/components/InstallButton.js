"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

// PWA install button. Chrome/Edge me "beforeinstallprompt" aata hai — usse
// hum apna button dikhate hain (taaki user ko browser menu me dhoondna na pade).
export default function InstallButton({ compact = false, className = "" }) {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !deferred) return null;

  async function install() {
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  if (compact) {
    return (
      <button
        onClick={install}
        title="App install karo"
        aria-label="App install karo"
        className={`rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50 ${className}`}
      >
        <Download size={18} />
      </button>
    );
  }

  return (
    <button
      onClick={install}
      className={`flex w-full items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 ${className}`}
    >
      <Download size={18} /> App Install karo
    </button>
  );
}
