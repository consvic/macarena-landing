import Link from "next/link";
import type React from "react";

const sections = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/sabores", label: "Sabores" },
  { href: "/admin/analisis", label: "Análisis" },
];

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-cream-white text-oxford-black">
      <div className="border-b border-ochre/20 bg-light-beige/50 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-ochre">
              Macarena
            </p>
            <h1 className="font-serif text-2xl text-royal-blue">
              Portal Interno
            </h1>
          </div>
          <p className="text-sm text-oxford-black/70">
            Gestión de pedidos y catálogo
          </p>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="self-start rounded-3xl border border-ochre/20 bg-white p-4">
          <nav className="space-y-2">
            {sections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="block rounded-2xl px-4 py-2 text-sm text-royal-blue transition hover:bg-royal-blue/5"
              >
                {section.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
