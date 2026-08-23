import Link from "next/link";
import type { ReactNode } from "react";
import { CartNavButton } from "@/components/cart/CartNavButton";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

type GelatoMenuShellProps = {
  children: ReactNode;
};

const menuFacts = [
  { label: "Presentaciones", value: "1/2 litro y 1 litro", isData: true },
  { label: "Tiempo ideal de consumo", value: "6-8 minutos", isData: true },
  { label: "Disponibilidad", value: "Mensual", isData: false },
];

export function GelatoMenuShell({ children }: GelatoMenuShellProps) {
  return (
    <div className="min-h-dvh bg-cream-white text-oxford-black">
      <SiteHeader
        secondaryLink={{ href: "/#philosophy", label: "Nuestra historia" }}
        action={<CartNavButton />}
      />

      <main>
        <section className="bg-royal-blue">
          <div className="container mx-auto grid gap-10 px-6 py-16 md:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-light-beige/85">
                Menú de sabores
              </p>
              <h1 className="mt-4 font-serif text-4xl font-bold leading-[1.05] text-light-beige [text-wrap:balance] md:text-5xl">
                Gelato artesanal con alma mexicana
              </h1>
              <p className="mt-6 max-w-[46ch] font-sans text-lg leading-relaxed text-light-beige/90">
                Una selección curada de sabores clásicos, modernos y sorbetes
                frescos.
              </p>
            </div>

            <dl className="divide-y divide-light-beige/15 border-t border-light-beige/25">
              {menuFacts.map((fact) => (
                <div
                  key={fact.label}
                  className="flex items-baseline justify-between gap-6 py-3"
                >
                  <dt className="text-sm text-light-beige/85">{fact.label}</dt>
                  <dd
                    className={`text-right text-sm font-medium text-light-beige ${
                      fact.isData ? "font-data" : ""
                    }`}
                  >
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {children}

        <section className="border-t border-ochre/20 bg-light-beige/40">
          <div className="container mx-auto flex flex-col gap-6 px-6 py-14 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-serif text-2xl font-bold text-royal-blue md:text-3xl">
                ¿Necesitas un menú especial?
              </h2>
              <p className="mt-3 max-w-[52ch] leading-relaxed text-oxford-black/75">
                Podemos preparar versiones sin lactosa o con menos azúcar bajo
                pedido previo.
              </p>
            </div>
            <Link
              href="https://ig.me/m/macarenagelateria"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-full bg-royal-blue px-8 py-3 text-center text-base font-medium text-light-beige transition-[background-color,transform] duration-200 hover:bg-royal-blue/90 hover:-translate-y-px active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
            >
              Solicitar cotización
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
