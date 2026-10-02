"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, Users, ReceiptText, LogOut, Plus, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BUSINESS } from "@/lib/business";
import InstallButton from "@/components/InstallButton";
import { useRole } from "@/components/Role";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Stock", icon: Package },
  { href: "/customers", label: "Grahak", icon: Users },
  { href: "/bills", label: "Bills", icon: ReceiptText },
  { href: "/reports", label: "Report", icon: BarChart3, adminOnly: true },
];

function Logo({ size = "h-10 w-10" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/icon.png" alt="Shri Ganesh" className={`${size} shrink-0 rounded-xl object-contain shadow-sm`} />
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin } = useRole();
  const visibleNav = nav.filter((n) => !n.adminOnly || isAdmin);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isActive = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="min-h-screen">
      {/* ===== Desktop sidebar ===== */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/70 bg-white/80 backdrop-blur md:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <Logo />
          <div className="min-w-0">
            <p className="display truncate text-[15px] font-semibold leading-tight text-slate-900">{BUSINESS.name}</p>
            <p className="truncate text-xs text-slate-400">Stock &amp; Billing</p>
          </div>
        </div>

        {/* Prominent CTA - sabse zaroori kaam */}
        <div className="px-3 pb-2">
          <Link
            href="/billing/new"
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/25 transition hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/25"
          >
            <Plus size={18} /> Naya Bill
          </Link>
        </div>

        <p className="px-5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Menu</p>
        <nav className="flex-1 space-y-1 px-3">
          {visibleNav.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-emerald-600" />}
                <Icon size={19} strokeWidth={active ? 2.4 : 2} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <InstallButton className="mb-2" />
          <div className="mb-2 px-2">
            <p className="truncate text-xs font-medium text-slate-600">{BUSINESS.proprietor}</p>
            <p className="truncate text-[11px] text-slate-400">Samastipur, Bihar</p>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut size={19} /> Logout
          </button>
        </div>
      </aside>

      {/* ===== Mobile top header ===== */}
      <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/70 bg-[#f7f6f3]/90 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2.5">
          <Logo size="h-8 w-8" />
          <p className="display text-[15px] font-semibold text-slate-900">{BUSINESS.name}</p>
        </div>
        <div className="flex items-center gap-1">
          <InstallButton compact />
          <button onClick={logout} aria-label="Logout" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ===== Main content ===== */}
      <main className="md:pl-64">
        <div className="mx-auto max-w-5xl px-4 py-7 pb-28 sm:px-6 md:pb-12">{children}</div>
      </main>

      {/* Mobile FAB - Naya Bill (nav se hata, yahan prominent) */}
      {!pathname.startsWith("/billing/new") && (
        <Link
          href="/billing/new"
          className="no-print fixed right-4 z-40 flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition active:scale-95 md:hidden"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 70px)" }}
        >
          <Plus size={20} /> Naya Bill
        </Link>
      )}

      {/* ===== Mobile bottom nav ===== */}
      <nav
        className="no-print fixed inset-x-0 bottom-0 z-30 grid border-t border-slate-200/70 bg-white/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)", gridTemplateColumns: `repeat(${visibleNav.length}, minmax(0, 1fr))` }}
      >
        {visibleNav.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition ${
                active ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-emerald-600" />}
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
