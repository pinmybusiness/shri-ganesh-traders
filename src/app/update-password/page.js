"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import { BUSINESS } from "@/lib/business";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [checking, setChecking] = useState(true);
  const [validLink, setValidLink] = useState(false);

  // Reset link se aaye -> session banao (code exchange), phir password form dikhao
  useEffect(() => {
    (async () => {
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code).catch(() => {});
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setValidLink(!!session);
      setChecking(false);
    })();
  }, [supabase]);

  async function handleUpdate(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password kam se kam 6 character ka ho.");
      return;
    }
    if (password !== confirm) {
      setError("Dono password same nahi hain.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1800);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm animate-in">
        <div className="mb-7 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="Shri Ganesh" className="mx-auto mb-4 h-20 w-20 rounded-2xl shadow-lg shadow-emerald-600/30" />
          <h1 className="hindi text-2xl font-bold text-slate-900">{BUSINESS.nameHindi}</h1>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          {done ? (
            <div className="text-center">
              <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-600" />
              <p className="font-semibold text-slate-900">Password badal gaya ✓</p>
              <p className="mt-1 text-sm text-slate-500">Login page pe le ja rahe hain...</p>
            </div>
          ) : checking ? (
            <p className="py-4 text-center text-sm text-slate-500">Link check ho raha hai...</p>
          ) : !validLink ? (
            <div className="text-center">
              <p className="font-medium text-slate-700">Link invalid ya expire ho gaya.</p>
              <p className="mt-1 text-sm text-slate-500">Dobara &quot;Password bhool gaye?&quot; se reset link lo.</p>
              <Link href="/login" className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:underline">
                ← Login pe wapas
              </Link>
            </div>
          ) : (
            <>
              <h2 className="mb-1 flex items-center justify-center gap-1.5 text-center text-base font-semibold text-slate-900">
                <KeyRound size={18} className="text-emerald-600" /> Naya Password
              </h2>
              <p className="mb-5 text-center text-sm text-slate-500">Apna naya password daalo.</p>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Naya Password</label>
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
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Dobara likho</label>
                  <Input
                    type={showPw ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>
                {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
                <Button type="submit" size="lg" loading={loading} className="w-full">
                  Password Badlo
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
