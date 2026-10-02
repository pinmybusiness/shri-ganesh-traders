"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import { BUSINESS } from "@/lib/business";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
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
          <h2 className="mb-5 text-center text-sm font-medium text-slate-500">Login karo aage badhne ke liye</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@email.com" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
            <Button type="submit" size="lg" loading={loading} className="w-full">
              {loading ? "Ho raha hai..." : (<><LogIn size={18} /> Login</>)}
            </Button>
          </form>
        </div>

        <p className="hindi mt-6 text-center text-xs text-slate-400">{BUSINESS.taglineHindi}</p>
      </div>
    </div>
  );
}
