"use client";

import { Leaf } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CartNavButton } from "@/components/cart/CartNavButton";
import { NumericNoteText } from "@/components/NumericNoteText";
import { useCart } from "@/components/providers/CartProvider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { formatMXN, resolveFlavorPrice } from "@/lib/pricing";
import {
  type Flavor,
  PRESENTATION_OPTIONS,
  type PresentationOption,
} from "@/lib/types";

type GelatoMenuPageProps = {
  flavors: Flavor[];
};

export default function GelatoMenuPage({ flavors }: GelatoMenuPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPresentationByFlavor, setSelectedPresentationByFlavor] =
    useState<Record<string, PresentationOption>>({});
  const { addItem } = useCart();

  const filteredFlavors = (() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return flavors;
    }

    return flavors.filter((flavor) => {
      const haystack = [
        flavor.name,
        flavor.description,
        flavor.category,
        flavor.base,
        ...flavor.tags,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  })();

  const resolvePresentation = (flavorName: string): PresentationOption => {
    return selectedPresentationByFlavor[flavorName] ?? "1/2 litro";
  };

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
              <h1 className="mt-4 text-4xl font-serif leading-tight md:text-5xl">
                Gelato artesanal con alma mexicana
              </h1>
              <p className="mt-4 text-base font-sans leading-relaxed text-light-beige/90">
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
                  <span className="font-medium font-numeric">
                    1/2 litro / 1 litro
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-light-beige/85">
                    Tiempo ideal de consumo
                  </span>
                  <span className="font-medium font-numeric">6-8 minutos</span>
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

        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-serif text-royal-blue">
                Sabores disponibles
              </h2>
              <p className="mt-2 max-w-xl text-sm text-oxford-black/70">
                Usa el buscador para encontrar sabores rapidamente.
              </p>
            </div>
            <p className="text-sm text-ochre">Mostrando sabores destacados</p>
          </div>

          <div className="mt-8 rounded-3xl border border-ochre/20 bg-white/70 p-5">
            <label
              className="text-xs uppercase tracking-[0.35em] text-ochre"
              htmlFor="flavor-search"
            >
              Buscar sabor
            </label>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                id="flavor-search"
                type="search"
                placeholder="Pistacho, sorbetes, cacao..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-full border border-ochre/30 bg-white px-4 py-3 text-sm text-oxford-black shadow-sm outline-none transition focus:border-royal-blue focus:ring-2 focus:ring-royal-blue/20"
              />
              <div className="min-w-[118px] rounded-full border border-royal-blue/30 px-4 py-2 text-center text-sm text-royal-blue">
                <span className="font-numeric">{filteredFlavors.length}</span>{" "}
                sabores
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredFlavors.map((flavor) => {
              const selectedPresentation = resolvePresentation(flavor.name);
              const itemPrice = resolveFlavorPrice(
                flavor.price,
                selectedPresentation,
              );
              const isVeganFlavor = flavor.allergens
                .toLowerCase()
                .includes("sin lacteos");

              return (
                <article
                  key={flavor.name}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-ochre/20 bg-white"
                >
                  <div
                    className={`relative min-h-52 h-52 md:min-h-56 md:h-56 bg-gradient-to-br ${flavor.gradient}`}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-35"
                      style={{ backgroundImage: `url(${encodeURI(flavor.coverImage)})` }}
                    />
                    <div className="absolute right-5 top-5 rounded-full bg-white/70 px-3 py-1 text-xs text-royal-blue">
                      {flavor.base}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 p-6 h-full">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-ochre">
                          {flavor.category}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <h3 className="text-2xl font-serif text-royal-blue">
                            {flavor.name}
                          </h3>
                          {isVeganFlavor ? (
                            <div className="relative inline-flex items-center">
                              <button
                                type="button"
                                aria-label={`Sabor vegano: ${flavor.name}`}
                                className="group/vegan inline-flex text-royal-blue"
                              >
                                <Leaf className="size-3.5" />
                                <span className="pointer-events-none absolute top-full left-1/2 z-10 mt-2 w-52 -translate-x-1/2 rounded-md border border-ochre/20 bg-white/40 px-2 py-1 text-left text-[11px] text-oxford-black opacity-0 shadow-sm backdrop-blur-[6px] transition-opacity group-hover/vegan:opacity-100 group-focus-visible/vegan:opacity-100">
                                  {flavor.allergens}
                                </span>
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <span className="rounded-full border border-royal-blue/20 px-3 py-1 text-sm text-royal-blue font-numeric">
                        {formatMXN(itemPrice)}
                      </span>
                    </div>

                    <p className="text-sm text-oxford-black/70">
                      {flavor.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {flavor.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-cream-white px-3 py-1 text-xs text-oxford-black/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto flex flex-col gap-3 pt-2 text-xs text-oxford-black/60">
                      <div className="grid grid-cols-[1fr_auto] gap-3">
                        <Select
                          value={selectedPresentation}
                          onValueChange={(value) =>
                            setSelectedPresentationByFlavor((previous) => ({
                              ...previous,
                              [flavor.name]: value as PresentationOption,
                            }))
                          }
                        >
                          <SelectTrigger
                            aria-label={`Seleccionar presentacion para ${flavor.name}`}
                            className="h-11 rounded-full border-royal-blue/20 text-sm text-royal-blue"
                          >
                            <span className="truncate">
                              <NumericNoteText text={selectedPresentation} />
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            {PRESENTATION_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                <NumericNoteText text={option} />
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          type="button"
                          aria-label={`Agregar ${flavor.name} al carrito`}
                          className="h-11 rounded-full bg-royal-blue px-4 text-light-beige hover:bg-royal-blue/90"
                          onClick={() =>
                            addItem({
                              flavorName: flavor.name,
                              presentation: selectedPresentation,
                              price: itemPrice,
                            })
                          }
                        >
                          Agregar
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredFlavors.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-ochre/20 bg-white p-6 text-center text-sm text-oxford-black/70">
              No encontramos sabores con ese termino. Prueba con otro nombre.
            </div>
          ) : null}
        </section>

        <section className="border-t border-ochre/10 bg-white/80">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-serif text-royal-blue">
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
