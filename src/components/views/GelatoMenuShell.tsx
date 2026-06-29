import Link from "next/link";
import type { ReactNode } from "react";
import { CartNavButton } from "@/components/cart/CartNavButton";

type GelatoMenuShellProps = {
  children: ReactNode;
};

export function GelatoMenuShell({ children }: GelatoMenuShellProps) {
  return (
    <div className="min-h-screen bg-cream-white text-oxford-black">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-ochre/20 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-royal-blue font-serif text-lg text-light-beige">
              M
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-ochre">
                Macarena
              </p>
              <p className="font-serif text-lg text-royal-blue">Gelato Menu</p>
            </div>
          </div>
          <nav className="hidden items-center gap-3 text-sm font-sans md:flex">
            <Link href="/" className="text-royal-blue hover:text-wine-red">
              Inicio
            </Link>
            <span className="text-wine-red">Menu</span>
            <CartNavButton />
          </nav>
          <div className="md:hidden">
            <CartNavButton />
          </div>
        </div>
      </header>

      <main className="pt-[81px]">
        <section className="relative overflow-hidden bg-royal-blue pt-24 text-light-beige">
          <div className="absolute -left-24 top-8 h-56 w-56 rounded-full bg-terracotta/40 blur-3xl" />
          <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-ochre/40 blur-3xl" />
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="text-sm uppercase tracking-[0.4em] text-light-beige/85">
                Menu de sabores
              </p>
              <h1 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">
                Gelato artesanal con alma mexicana
              </h1>
              <p className="mt-4 font-sans text-base leading-relaxed text-light-beige/90">
                Una seleccion curada de sabores clasicos, modernos y sorbetes
                frescos.
              </p>
            </div>
            <div className="w-full max-w-sm rounded-3xl border border-light-beige/20 bg-white/10 p-6 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.3em] text-light-beige/85">
                Informacion
              </p>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-light-beige/85">Presentaciones</span>
                  <span className="font-data font-medium">
                    1/2 litro / 1 litro
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-light-beige/85">
                    Tiempo ideal de consumo
                  </span>
                  <span className="font-data font-medium">6-8 minutos</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-light-beige/85">Disponibilidad</span>
                  <span className="font-medium">Mensual</span>
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-light-beige/30 px-4 py-3 text-xs text-light-beige/85">
                Todos los sabores se preparan en lotes pequenos para mantener la
                textura cremosa y el perfil aromatico.
              </div>
            </div>
          </div>
        </section>

        {children}

        <section className="border-t border-ochre/10 bg-white/80">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-serif text-2xl text-royal-blue">
                Necesitas un menu especial?
              </h3>
              <p className="mt-2 text-sm text-oxford-black/70">
                Podemos preparar versiones sin lactosa o con menos azucar bajo
                pedido previo.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="https://ig.me/m/macarenagelateria"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-royal-blue px-5 py-3 text-sm text-light-beige"
              >
                Solicitar cotizacion
              </Link>
              <Link
                href="/"
                className="rounded-full border border-royal-blue/30 px-5 py-3 text-sm text-royal-blue"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
