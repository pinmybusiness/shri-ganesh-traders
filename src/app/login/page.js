"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Eye, EyeOff, Mail, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import { BUSINESS } from "@/lib/business";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // "login" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email ya password galat hai.");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function handleReset(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email) {
      setError("Pehle apna email daalo.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setInfo("Reset link email pe bhej diya. Email kholo aur link dabao.");
  }

  function switchMode(m) {
    setMode(m);
    setError("");
    setInfo("");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm animate-in">
        <div className="mb-7 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="Shri Ganesh" className="mx-auto mb-4 h-20 w-20 rounded-2xl shadow-lg shadow-emerald-600/30" />
          <h1 className="hindi text-2xl font-bold text-slate-900">{BUSINESS.nameHindi}</h1>
          <p className="display mt-0.5 text-base text-slate-500">{BUSINESS.name}</p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          {mode === "login" ? (
            <>
              <h2 className="mb-5 text-center text-sm font-medium text-slate-500">Login karo aage badhne ke liye</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@email.com" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                  <div className="relative">
                    <Input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      aria-label="Password dikhao/chhupao"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
                <Button type="submit" size="lg" loading={loading} className="w-full">
                  {loading ? "Ho raha hai..." : (<><LogIn size={18} /> Login</>)}
                </Button>
              </form>
              <button
                type="button"
                onClick={() => switchMode("reset")}
                className="mt-4 block w-full text-center text-sm font-medium text-emerald-600 hover:underline"
              >
                Password bhool gaye?
              </button>
            </>
          ) : (
            <>
              <h2 className="mb-1 text-center text-base font-semibold text-slate-900">Password Reset</h2>
              <p className="mb-5 text-center text-sm text-slate-500">Apna email daalo — reset link bhej denge.</p>
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@email.com" />
                </div>
                {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
                {info && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}
                <Button type="submit" size="lg" loading={loading} className="w-full">
                  <Mail size={18} /> Reset link bhejo
                </Button>
              </form>
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="mt-4 inline-flex w-full items-center justify-center gap-1 text-sm font-medium text-slate-500 hover:text-emerald-600"
              >
                <ArrowLeft size={15} /> Wapas login
              </button>
            </>
          )}
        </div>

        <p className="hindi mt-6 text-center text-xs text-slate-400">{BUSINESS.taglineHindi}</p>
      </div>
    </div>
  );
}
