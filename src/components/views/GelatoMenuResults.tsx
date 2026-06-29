"use client";

import { Check, Leaf } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { cn } from "@/lib/utils";

const ADDED_FEEDBACK_DURATION_MS = 2000;

type GelatoMenuResultsProps = {
  flavors: Flavor[];
};

export function GelatoMenuResults({ flavors }: GelatoMenuResultsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPresentationByFlavor, setSelectedPresentationByFlavor] =
    useState<Record<string, PresentationOption>>({});
  const [addedFeedbackByFlavor, setAddedFeedbackByFlavor] = useState<
    Record<string, number>
  >({});
  const addedFeedbackTimers = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});
  const { addItem } = useCart();

  useEffect(() => {
    return () => {
      for (const timer of Object.values(addedFeedbackTimers.current)) {
        clearTimeout(timer);
      }
    };
  }, []);

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
    return selectedPresentationByFlavor[flavorName] ?? "1 litro";
  };

  const showAddedFeedback = (flavorName: string) => {
    setAddedFeedbackByFlavor((previous) => ({
      ...previous,
      [flavorName]: (previous[flavorName] ?? 0) + 1,
    }));

    const existingTimer = addedFeedbackTimers.current[flavorName];
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    addedFeedbackTimers.current[flavorName] = setTimeout(() => {
      setAddedFeedbackByFlavor((previous) => {
        if (!previous[flavorName]) {
          return previous;
        }

        const next = { ...previous };
        delete next[flavorName];
        return next;
      });
      delete addedFeedbackTimers.current[flavorName];
    }, ADDED_FEEDBACK_DURATION_MS);
  };

  const handleAddFlavor = ({
    flavorName,
    presentation,
    price,
  }: {
    flavorName: string;
    presentation: PresentationOption;
    price: number;
  }) => {
    addItem({
      flavorName,
      presentation,
      price,
    });
    showAddedFeedback(flavorName);
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-serif text-3xl text-royal-blue">
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
            className="w-full rounded-full border border-ochre/30 bg-white px-4 py-3 text-sm text-oxford-black shadow-sm outline-none transition focus-visible:border-royal-blue focus-visible:ring-2 focus-visible:ring-royal-blue/20"
          />
          <div className="min-w-[118px] rounded-full border border-royal-blue/30 px-4 py-2 text-center text-sm text-royal-blue">
            <span className="font-data">{filteredFlavors.length}</span> sabores
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
          const addedFeedbackCount = addedFeedbackByFlavor[flavor.name];
          const isAdded = Boolean(addedFeedbackCount);

          return (
            <article
              key={flavor.name}
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-ochre/20 bg-white"
            >
              <div
                className={`relative h-52 min-h-52 bg-gradient-to-br md:h-56 md:min-h-56 ${flavor.gradient}`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-75"
                  style={{
                    backgroundImage: `url(${encodeURI(flavor.coverImage)})`,
                  }}
                />
                <div className="absolute right-5 top-5 rounded-full bg-white/70 px-3 py-1 text-xs text-royal-blue">
                  {flavor.base}
                </div>
              </div>

              <div className="flex h-full flex-col gap-4 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-ochre">
                      {flavor.category}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <h3 className="font-serif text-2xl text-royal-blue">
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
                  <span className="rounded-full border border-royal-blue/20 px-3 py-1 font-data text-sm text-royal-blue">
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
                      aria-label={
                        isAdded
                          ? `${flavor.name} agregado al carrito`
                          : `Agregar ${flavor.name} al carrito`
                      }
                      className={cn(
                        "relative h-11 w-32 overflow-visible rounded-full bg-royal-blue px-4 text-light-beige transition-all duration-200 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] hover:bg-royal-blue/90 active:scale-95",
                        isAdded && "bg-ochre text-royal-blue hover:bg-ochre/90",
                        isAdded &&
                          (addedFeedbackCount % 2 === 0
                            ? "cart-add-feedback cart-add-feedback-even"
                            : "cart-add-feedback cart-add-feedback-odd"),
                      )}
                      onClick={() =>
                        handleAddFlavor({
                          flavorName: flavor.name,
                          presentation: selectedPresentation,
                          price: itemPrice,
                        })
                      }
                    >
                      {isAdded ? (
                        <Check className="size-4" aria-hidden="true" />
                      ) : null}
                      <span aria-live="polite">
                        {isAdded ? "Agregado" : "Agregar"}
                      </span>
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
  );
}
