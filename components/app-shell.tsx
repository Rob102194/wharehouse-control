import Link from "next/link";
import type { ReactNode } from "react";
import {
  canAccessAdmin,
  canAccessHistory,
  canAccessOperations,
  canAccessStock,
} from "@/lib/permissions";
import type { Profile } from "@/types/profile";

type AppShellProps = {
  children: ReactNode;
  profile: Profile;
  onSignOut: () => Promise<void>;
};

export function AppShell({ children, profile, onSignOut }: AppShellProps) {
  const links = [
    canAccessOperations(profile.role) ? { href: "/operations", label: "Operaciones" } : null,
    canAccessStock(profile.role) ? { href: "/stock", label: "Stock" } : null,
    canAccessHistory(profile.role) ? { href: "/history", label: "Historial" } : null,
    canAccessAdmin(profile.role) ? { href: "/admin", label: "Administracion" } : null,
  ].filter((item): item is { href: string; label: string } => item !== null);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">MVP</p>
            <h1 className="text-lg font-semibold text-slate-900">Warehouse Control</h1>
            <p className="text-xs text-slate-500">{profile.full_name ?? profile.username}</p>
          </div>
          <div className="flex items-center gap-2">
            <nav className="flex gap-2 text-sm">
              {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-1.5 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <form action={onSignOut}>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                Cerrar sesion
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
