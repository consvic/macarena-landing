import Link from "next/link";
import type React from "react";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

const sections = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/sabores", label: "Sabores" },
  { href: "/admin/analisis", label: "Análisis" },
];

export function AdminLayoutShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-cream-white text-oxford-black">
      <div className="border-b border-ochre/20 bg-light-beige/50 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.68rem] uppercase tracking-[0.25em] text-ochre sm:text-xs sm:tracking-[0.35em]">
              Macarena
            </p>
            <h1 className="font-serif text-2xl text-royal-blue sm:text-3xl">
              Portal Interno
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <p className="hidden text-sm text-oxford-black/70 md:block">
              Gestión de pedidos y catálogo
            </p>
            <AdminLogoutButton />
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:gap-8 sm:px-6 sm:py-8 lg:grid-cols-[240px_1fr]">
        <aside className="-mx-4 border-y border-ochre/20 bg-white/85 px-4 py-3 sm:mx-0 sm:rounded-3xl sm:border sm:bg-white sm:p-4 lg:self-start">
          <nav className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
            {sections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="inline-flex min-h-11 shrink-0 items-center rounded-2xl px-4 py-2 text-sm text-royal-blue transition hover:bg-royal-blue/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-blue/30 lg:flex"
              >
                {section.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
