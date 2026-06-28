"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FLAVOR_BASES, type FlavorBase } from "@/lib/types";

type AdminFlavor = {
  _id: string;
  name: string;
  description: string;
  category: string;
  base: FlavorBase;
  tags: string[];
  price: {
    halfLiter: number;
    liter: number;
  };
  allergens: string;
  gradient: string;
  coverImage: string;
  isVisibleOnSite: boolean;
  isArchived: boolean;
};

type FlavorFormState = {
  name: string;
  description: string;
  category: string;
  base: FlavorBase;
  tags: string;
  halfLiter: string;
  liter: string;
  allergens: string;
  gradient: string;
  coverImage: string;
};

const EMPTY_FORM: FlavorFormState = {
  name: "",
  description: "",
  category: "",
  base: "Agua",
  tags: "",
  halfLiter: "",
  liter: "",
  allergens: "",
  gradient: "",
  coverImage: "",
};

function flavorToForm(flavor: AdminFlavor): FlavorFormState {
  return {
    name: flavor.name,
    description: flavor.description,
    category: flavor.category,
    base: flavor.base,
    tags: flavor.tags.join(", "),
    halfLiter: String(flavor.price.halfLiter),
    liter: String(flavor.price.liter),
    allergens: flavor.allergens,
    gradient: flavor.gradient,
    coverImage: flavor.coverImage,
  };
}

export function AdminFlavorsPage() {
  const [flavors, setFlavors] = useState<AdminFlavor[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FlavorFormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedFlavor = useMemo(
    () => flavors.find((flavor) => flavor._id === selectedId) ?? null,
    [flavors, selectedId],
  );

  const loadFlavors = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/flavors", { cache: "no-store" });
      const payload = (await response.json()) as
        | AdminFlavor[]
        | { message?: string };
      if (!response.ok) {
        throw new Error(
          (payload as { message?: string }).message ??
            "No se pudo cargar sabores",
        );
      }
      setFlavors(payload as AdminFlavor[]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlavors();
  }, [loadFlavors]);

  useEffect(() => {
    if (!selectedFlavor) {
      setForm(EMPTY_FORM);
      return;
    }

    setForm(flavorToForm(selectedFlavor));
  }, [selectedFlavor]);

  async function saveFlavor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const body = {
        name: form.name,
        description: form.description,
        category: form.category,
        base: form.base,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        price: {
          halfLiter: Number(form.halfLiter),
          liter: Number(form.liter),
        },
        allergens: form.allergens,
        gradient: form.gradient,
        coverImage: form.coverImage,
      };

      const endpoint = selectedId
        ? `/api/admin/flavors/${selectedId}`
        : "/api/admin/flavors";
      const method = selectedId ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = (await response.json()) as
        | AdminFlavor
        | { message?: string };
      if (!response.ok) {
        throw new Error(
          (payload as { message?: string }).message ??
            "No se pudo guardar sabor",
        );
      }

      const flavor = payload as AdminFlavor;
      setFlavors((previous) => {
        if (!selectedId) {
          return [flavor, ...previous];
        }

        return previous.map((entry) =>
          entry._id === flavor._id ? flavor : entry,
        );
      });

      if (!selectedId) {
        setSelectedId(flavor._id);
      }

      setMessage(selectedId ? "Sabor actualizado" : "Sabor creado");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateVisibility(
    flavor: AdminFlavor,
    isVisibleOnSite: boolean,
  ) {
    try {
      const response = await fetch(
        `/api/admin/flavors/${flavor._id}/visibility`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isVisibleOnSite }),
        },
      );

      const payload = (await response.json()) as
        | AdminFlavor
        | { message?: string };
      if (!response.ok) {
        throw new Error(
          (payload as { message?: string }).message ??
            "No se pudo cambiar visibilidad",
        );
      }

      const updated = payload as AdminFlavor;
      setFlavors((previous) =>
        previous.map((entry) => (entry._id === updated._id ? updated : entry)),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    }
  }

  async function updateArchived(flavor: AdminFlavor, isArchived: boolean) {
    try {
      const response = await fetch(`/api/admin/flavors/${flavor._id}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived }),
      });

      const payload = (await response.json()) as
        | AdminFlavor
        | { message?: string };
      if (!response.ok) {
        throw new Error(
          (payload as { message?: string }).message ??
            "No se pudo actualizar archivo",
        );
      }

      const updated = payload as AdminFlavor;
      setFlavors((previous) =>
        previous.map((entry) => (entry._id === updated._id ? updated : entry)),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[0.68rem] uppercase tracking-[0.25em] text-ochre sm:text-xs sm:tracking-[0.35em]">
          Sabores
        </p>
        <h2 className="mt-2 font-serif text-3xl text-royal-blue sm:text-4xl">
          Catálogo interno
        </h2>
      </header>

      {message ? (
        <p className="rounded-2xl bg-royal-blue/10 px-4 py-3 text-sm text-royal-blue">
          {message}
        </p>
      ) : null}

      <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,1fr)]">
        <article className="min-w-0 rounded-2xl border border-ochre/20 bg-white p-4 sm:rounded-3xl sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-serif text-2xl text-royal-blue sm:text-3xl">
              Sabores registrados
            </h3>
            <button
              type="button"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-ochre/30 px-3 py-2 text-sm text-ochre focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-blue/30 sm:w-auto"
              onClick={() => {
                setSelectedId(null);
                setForm(EMPTY_FORM);
              }}
            >
              Nuevo sabor
            </button>
          </div>

          {isLoading ? (
            <p className="text-sm text-oxford-black/70">Cargando sabores</p>
          ) : (
            <ul className="space-y-3">
              {flavors.map((flavor) => (
                <li
                  key={flavor._id}
                  className="rounded-2xl border border-ochre/15 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-blue/30"
                      onClick={() => setSelectedId(flavor._id)}
                    >
                      <p className="break-words font-serif text-xl text-royal-blue">
                        {flavor.name}
                      </p>
                      <p className="break-words text-xs uppercase tracking-[0.16em] text-ochre sm:tracking-[0.2em]">
                        {flavor.category}
                      </p>
                    </button>

                    <div className="grid w-full grid-cols-2 gap-2 text-sm sm:flex sm:w-auto sm:flex-wrap sm:text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          updateVisibility(flavor, !flavor.isVisibleOnSite)
                        }
                        disabled={flavor.isArchived}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-royal-blue/30 px-3 py-2 text-royal-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-blue/30 disabled:opacity-40 sm:min-h-9 sm:px-3 sm:py-1.5"
                      >
                        {flavor.isVisibleOnSite ? "Ocultar" : "Mostrar"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateArchived(flavor, !flavor.isArchived)
                        }
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-wine-red/30 px-3 py-2 text-wine-red focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-red/25 sm:min-h-9 sm:px-3 sm:py-1.5"
                      >
                        {flavor.isArchived ? "Restaurar" : "Archivar"}
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 break-words text-sm text-oxford-black/65">
                    {flavor.description}
                  </p>
                  <p className="mt-2 break-words font-data text-xs text-oxford-black/60">
                    Visible: {flavor.isVisibleOnSite ? "Sí" : "No"} · Archivado:{" "}
                    {flavor.isArchived ? "Sí" : "No"}
                  </p>
                </li>
              ))}

              {flavors.length === 0 ? (
                <li className="rounded-2xl bg-cream-white px-4 py-5 text-sm text-oxford-black/65">
                  No hay sabores registrados.
                </li>
              ) : null}
            </ul>
          )}
        </article>

        <article className="min-w-0 rounded-2xl border border-ochre/20 bg-white p-4 sm:rounded-3xl sm:p-5">
          <h3 className="font-serif text-2xl text-royal-blue sm:text-3xl">
            {selectedId ? "Editar sabor" : "Crear sabor"}
          </h3>

          <form className="mt-4 space-y-3" onSubmit={saveFlavor}>
            <input
              required
              aria-label="Nombre del sabor"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Nombre"
              className="min-h-11 w-full rounded-2xl border border-ochre/30 px-3 py-2 text-sm"
            />
            <input
              required
              aria-label="Categoría del sabor"
              value={form.category}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, category: event.target.value }))
              }
              placeholder="Categoría"
              className="min-h-11 w-full rounded-2xl border border-ochre/30 px-3 py-2 text-sm"
            />
            <textarea
              required
              aria-label="Descripción del sabor"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              placeholder="Descripción"
              className="min-h-24 w-full rounded-2xl border border-ochre/30 px-3 py-2 text-sm"
            />

            <select
              aria-label="Base del sabor"
              value={form.base}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  base: event.target.value as FlavorBase,
                }))
              }
              className="min-h-11 w-full rounded-2xl border border-ochre/30 px-3 py-2 text-sm"
            >
              {FLAVOR_BASES.map((base) => (
                <option key={base} value={base}>
                  {base}
                </option>
              ))}
            </select>

            <input
              required
              aria-label="Tags del sabor separados por coma"
              value={form.tags}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, tags: event.target.value }))
              }
              placeholder="Tags separados por coma"
              className="min-h-11 w-full rounded-2xl border border-ochre/30 px-3 py-2 text-sm"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                required
                type="number"
                min="0"
                aria-label="Precio de medio litro"
                value={form.halfLiter}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    halfLiter: event.target.value,
                  }))
                }
                placeholder="Precio 1/2 litro"
                className="min-h-11 w-full rounded-2xl border border-ochre/30 px-3 py-2 text-sm"
              />
              <input
                required
                type="number"
                min="0"
                aria-label="Precio de un litro"
                value={form.liter}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, liter: event.target.value }))
                }
                placeholder="Precio 1 litro"
                className="min-h-11 w-full rounded-2xl border border-ochre/30 px-3 py-2 text-sm"
              />
            </div>

            <input
              required
              aria-label="Alérgenos del sabor"
              value={form.allergens}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, allergens: event.target.value }))
              }
              placeholder="Alérgenos"
              className="min-h-11 w-full rounded-2xl border border-ochre/30 px-3 py-2 text-sm"
            />
            <input
              required
              aria-label="Clase de gradiente del sabor"
              value={form.gradient}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, gradient: event.target.value }))
              }
              placeholder="Clase de gradiente (ej. from-ochre/20 to-terracotta/50)"
              className="min-h-11 w-full rounded-2xl border border-ochre/30 px-3 py-2 text-sm"
            />
            <input
              required
              aria-label="Ruta de imagen del sabor"
              value={form.coverImage}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, coverImage: event.target.value }))
              }
              placeholder="Ruta de imagen"
              className="min-h-11 w-full rounded-2xl border border-ochre/30 px-3 py-2 text-sm"
            />

            <button
              type="submit"
              disabled={isSaving}
              className="min-h-11 w-full rounded-2xl bg-royal-blue px-4 py-2 text-sm text-light-beige disabled:opacity-50"
            >
              {isSaving
                ? "Guardando"
                : selectedId
                  ? "Actualizar sabor"
                  : "Crear sabor"}
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}
