"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import flavors from "@/lib/flavors.json";

export default function GelatoMenuPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFlavors = useMemo(() => {
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
        ...flavor.notes,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-cream-white text-oxford-black">
      <header className="border-b border-ochre/20 bg-white/80 backdrop-blur">
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
          <nav className="hidden items-center gap-6 text-sm font-sans md:flex">
            <Link href="/" className="text-royal-blue hover:text-wine-red">
              Inicio
            </Link>
            <span className="text-wine-red">Menu</span>
            <button
              type="button"
              className="rounded-full border border-ochre/40 px-4 py-2 text-ochre"
              aria-disabled="true"
            >
              Pedido proximamente
            </button>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-royal-blue text-light-beige">
        <div className="absolute -left-24 top-8 h-56 w-56 rounded-full bg-terracotta/40 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-ochre/40 blur-3xl" />
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.4em] text-light-beige/70">
              Menu de sabores
            </p>
            <h1 className="mt-4 text-4xl font-serif leading-tight md:text-5xl">
              Gelato artesanal con alma mexicana
            </h1>
            <p className="mt-4 text-base font-sans leading-relaxed text-light-beige/80">
              Una seleccion curada de sabores clasicos, firmados y sorbetes
              frescos. Por ahora el menu es solo visual.
            </p>
          </div>
          <div className="w-full max-w-sm rounded-3xl border border-light-beige/20 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.3em] text-light-beige/60">
              Informacion
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-light-beige/70">Porcion</span>
                <span className="font-medium font-numeric">120 ml</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-light-beige/70">Tiempo ideal</span>
                <span className="font-medium font-numeric">6-8 minutos</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-light-beige/70">Disponibilidad</span>
                <span className="font-medium">Diaria</span>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-light-beige/30 px-4 py-3 text-xs text-light-beige/70">
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
              Usa el buscador para encontrar sabores rapidamente. El menu es
              solo de lectura por ahora.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-full border border-ochre/30 bg-white px-4 py-2 text-sm text-ochre">
              Ordenar por: Popular
            </div>
          </div>
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
            <div className="rounded-full border border-royal-blue/30 px-4 py-2 text-sm text-royal-blue">
              <span className="font-numeric">{filteredFlavors.length}</span>{" "}
              sabores
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredFlavors.map((flavor) => (
            <article
              key={flavor.name}
              className="group relative overflow-hidden rounded-3xl border border-ochre/20 bg-white"
            >
              <div
                className={`relative h-36 bg-gradient-to-br ${flavor.gradient}`}
              >
                <div className="absolute right-5 top-5 rounded-full bg-white/70 px-3 py-1 text-xs text-royal-blue">
                  {flavor.base}
                </div>
                <div className="absolute -bottom-10 left-6 h-24 w-24 rounded-full bg-white/70 shadow-lg" />
                <div className="absolute -bottom-6 left-10 h-16 w-16 rounded-full bg-white shadow" />
              </div>

              <div className="space-y-4 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-ochre">
                      {flavor.category}
                    </p>
                    <h3 className="mt-2 text-xl font-serif text-royal-blue">
                      {flavor.name}
                    </h3>
                  </div>
                  <span className="rounded-full border border-royal-blue/20 px-3 py-1 text-sm text-royal-blue font-numeric">
                    {flavor.price}
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

                <div className="rounded-2xl border border-ochre/10 bg-cream-white/70 p-4 text-xs text-oxford-black/70">
                  <div className="flex items-center justify-between">
                    <span>Intensidad</span>
                    <span className="font-medium text-royal-blue">
                      {flavor.intensity}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {flavor.notes.map((note) => (
                      <span
                        key={note}
                        className={`rounded-full border border-ochre/30 px-2 py-1 ${
                          /\\d/.test(note) ? "font-numeric" : ""
                        }`}
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-oxford-black/60">
                  <span>{flavor.allergens}</span>
                  <button
                    type="button"
                    className="rounded-full border border-royal-blue/30 px-4 py-2 text-royal-blue"
                    aria-disabled="true"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </article>
          ))}
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
            <button
              type="button"
              className="rounded-full bg-royal-blue px-5 py-3 text-sm text-light-beige"
              aria-disabled="true"
            >
              Solicitar cotizacion
            </button>
            <Link
              href="/"
              className="rounded-full border border-royal-blue/30 px-5 py-3 text-sm text-royal-blue"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
