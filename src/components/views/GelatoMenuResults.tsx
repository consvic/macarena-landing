"use client";

import { Check, Leaf } from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
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
import { cn, foldAccents } from "@/lib/utils";

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
    const query = foldAccents(searchQuery.trim());
    if (!query) {
      return flavors;
    }

    return flavors.filter((flavor) => {
      const haystack = foldAccents(
        [
          flavor.name,
          flavor.description,
          flavor.category,
          flavor.base,
          ...flavor.tags,
        ].join(" "),
      );

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
    <section className="container mx-auto px-6 py-16">
      <h2 className="font-serif text-3xl font-bold text-royal-blue md:text-4xl">
        Sabores disponibles
      </h2>
      <p className="mt-3 max-w-[52ch] leading-relaxed text-oxford-black/75">
        Usa el buscador para encontrar sabores rápidamente.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <label
            className="block text-sm font-medium text-royal-blue"
            htmlFor="flavor-search"
          >
            Buscar sabor
          </label>
          <input
            id="flavor-search"
            type="search"
            spellCheck={false}
            placeholder="Pistache, sorbetes, cacao…"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="mt-2 h-12 w-full rounded-full border border-ochre/40 bg-white px-5 text-sm text-oxford-black outline-none transition-[border-color,box-shadow] duration-200 focus-visible:border-royal-blue focus-visible:ring-2 focus-visible:ring-royal-blue/20"
          />
        </div>
        <p
          aria-live="polite"
          className="shrink-0 rounded-full border border-royal-blue/25 px-4 py-2 text-center text-sm text-royal-blue sm:mt-7"
        >
          <span className="font-data">{filteredFlavors.length}</span> sabores
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredFlavors.map((flavor, index) => {
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
              style={{ "--enter-index": index } as CSSProperties}
              className="menu-card-enter group relative flex h-full flex-col overflow-hidden rounded-3xl border border-ochre/20 bg-white"
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
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-oxford-black/70">
                      {flavor.category}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <h3 className="font-serif text-2xl text-royal-blue">
                        {flavor.name}
                      </h3>
                      {isVeganFlavor ? (
                        <div className="relative inline-flex items-center">
                          <button
                            type="button"
                            aria-label={`Sabor vegano: ${flavor.name}`}
                            aria-describedby={`vegan-tip-${flavor.name.replace(/\s+/g, "-")}`}
                            className="group/vegan inline-flex rounded-full text-royal-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
                          >
                            <Leaf className="size-3.5" aria-hidden="true" />
                            <span
                              id={`vegan-tip-${flavor.name.replace(/\s+/g, "-")}`}
                              className="pointer-events-none absolute top-full left-1/2 z-10 mt-2 w-52 -translate-x-1/2 rounded-lg border border-royal-blue/15 bg-white px-3 py-2 text-left text-xs leading-snug text-oxford-black/80 opacity-0 shadow-lg shadow-royal-blue/10 transition-opacity duration-200 group-hover/vegan:opacity-100 group-focus-visible/vegan:opacity-100 group-focus/vegan:opacity-100"
                            >
                              {flavor.allergens}
                            </span>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-royal-blue/20 px-3 py-1 font-data text-sm text-royal-blue">
                    {formatMXN(itemPrice)}
                  </span>
                </div>

                <p className="text-sm leading-relaxed text-oxford-black/75">
                  {flavor.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {flavor.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-cream-white px-3 py-1 text-xs text-oxford-black/75"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex flex-col gap-3 pt-2">
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
                        aria-label={`Seleccionar presentación para ${flavor.name}`}
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
                        "relative h-11 w-32 overflow-visible rounded-full bg-royal-blue px-4 text-light-beige transition-[transform,background-color,color] duration-150 ease-out-strong hover:bg-royal-blue/90 active:scale-[0.97]",
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
        <p className="mt-8 rounded-3xl border border-ochre/20 bg-white p-6 text-center text-sm text-oxford-black/75">
          No encontramos sabores con ese término. Prueba con otro nombre.
        </p>
      ) : null}
    </section>
  );
}
