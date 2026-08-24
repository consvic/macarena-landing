"use client";

import { ChevronDown } from "lucide-react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AdminFlavorsResultsLoading } from "@/components/admin/AdminLoadingStates";
import { AdminLotsPanel } from "@/components/admin/AdminLotsPanel";
import { formatMXN } from "@/lib/pricing";
import {
  FLAVOR_BASES,
  type FlavorBase,
  PRESENTATION_OPTIONS,
  type PresentationOption,
} from "@/lib/types";

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
  availablePresentations: PresentationOption[];
  allergens: string;
  gradient: string;
  coverImage: string;
  isVisibleOnSite: boolean;
  isArchived: boolean;
  inventoryManaged?: boolean;
  availableQuantities?: { halfLiter: number; liter: number };
};

type ProductionDemandEntry = {
  flavorId?: string;
  flavorName: string;
  pendingOrders: number;
  pendingLiters: number;
  committedOrders: number;
  committedLiters: number;
};

type ProductionDemandResponse = {
  date: string;
  entries: ProductionDemandEntry[];
};

type FlavorFormState = {
  name: string;
  description: string;
  category: string;
  base: FlavorBase;
  tags: string;
  halfLiter: string;
  liter: string;
  availablePresentations: PresentationOption[];
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
  availablePresentations: [...PRESENTATION_OPTIONS],
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
    availablePresentations: flavor.availablePresentations,
    allergens: flavor.allergens,
    gradient: flavor.gradient,
    coverImage: flavor.coverImage,
  };
}

export function AdminFlavorsPage() {
  const [flavors, setFlavors] = useState<AdminFlavor[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<FlavorFormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState<
    string | null
  >(null);
  const [message, setMessage] = useState<string | null>(null);
  const [productionDemand, setProductionDemand] =
    useState<ProductionDemandResponse | null>(null);

  const selectedFlavor = useMemo(
    () => flavors.find((flavor) => flavor._id === selectedId) ?? null,
    [flavors, selectedId],
  );
  const demandByFlavor = useMemo(
    () =>
      new Map(
        (productionDemand?.entries ?? []).map((entry) => [
          entry.flavorId ?? `name:${entry.flavorName}`,
          entry,
        ]),
      ),
    [productionDemand],
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

  const loadProductionDemand = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/production-demand", {
        cache: "no-store",
      });
      const payload = (await response.json()) as
        | ProductionDemandResponse
        | { message?: string };
      if (!response.ok) {
        throw new Error(
          (payload as { message?: string }).message ??
            "No se pudo cargar la producción de hoy",
        );
      }
      setProductionDemand(payload as ProductionDemandResponse);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    }
  }, []);

  const updateSelectedInventory = useCallback(
    (availableQuantities: { halfLiter: number; liter: number }) => {
      if (!selectedId) return;
      setFlavors((previous) =>
        previous.map((flavor) =>
          flavor._id === selectedId
            ? {
                ...flavor,
                inventoryManaged: true,
                availableQuantities,
                availablePresentations: PRESENTATION_OPTIONS.filter(
                  (presentation) =>
                    presentation === "1/2 litro"
                      ? availableQuantities.halfLiter > 0
                      : availableQuantities.liter > 0,
                ),
              }
            : flavor,
        ),
      );
    },
    [selectedId],
  );

  useEffect(() => {
    loadFlavors();
    loadProductionDemand();

    const refreshTimer = window.setInterval(loadProductionDemand, 30_000);
    return () => window.clearInterval(refreshTimer);
  }, [loadFlavors, loadProductionDemand]);

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
        ...(!selectedFlavor?.inventoryManaged
          ? { availablePresentations: form.availablePresentations }
          : {}),
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
          entry._id === flavor._id
            ? {
                ...flavor,
                inventoryManaged: entry.inventoryManaged,
                availableQuantities: entry.availableQuantities,
                availablePresentations: entry.inventoryManaged
                  ? entry.availablePresentations
                  : flavor.availablePresentations,
              }
            : entry,
        );
      });

      if (!selectedId) {
        setSelectedId(flavor._id);
      }

      setIsEditing(false);

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
    if (updatingVisibilityId) return;

    setUpdatingVisibilityId(flavor._id);
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
        previous.map((entry) =>
          entry._id === updated._id
            ? {
                ...updated,
                inventoryManaged: entry.inventoryManaged,
                availableQuantities: entry.availableQuantities,
                availablePresentations: entry.inventoryManaged
                  ? entry.availablePresentations
                  : updated.availablePresentations,
              }
            : entry,
        ),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setUpdatingVisibilityId(null);
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
        previous.map((entry) =>
          entry._id === updated._id
            ? {
                ...updated,
                inventoryManaged: entry.inventoryManaged,
                availableQuantities: entry.availableQuantities,
                availablePresentations: entry.inventoryManaged
                  ? entry.availablePresentations
                  : updated.availablePresentations,
              }
            : entry,
        ),
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

      <section className="overflow-hidden rounded-2xl border border-royal-blue/20 bg-white sm:rounded-3xl">
        <div className="flex flex-col gap-2 border-b border-royal-blue/10 bg-cream-white px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-ochre">
              Producción de hoy
            </p>
            <h3 className="mt-1 font-serif text-2xl text-royal-blue sm:text-3xl">
              Demanda por sabor
            </h3>
          </div>
          <p className="font-data text-sm text-oxford-black/60">
            {productionDemand?.date ?? "Cargando…"}
          </p>
        </div>

        <ul className="divide-y divide-ochre/10">
          {flavors
            .filter((flavor) => !flavor.isArchived)
            .map((flavor) => {
              const demand =
                demandByFlavor.get(flavor._id) ??
                demandByFlavor.get(`name:${flavor.name}`);

              return (
                <li
                  key={flavor._id}
                  className="grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="break-words font-serif text-xl text-royal-blue">
                      {flavor.name}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1 font-data text-sm">
                      <p className="text-oxford-black/65">
                        Pendientes: {demand?.pendingOrders ?? 0} ·{" "}
                        {(demand?.pendingLiters ?? 0).toFixed(1)}L
                      </p>
                      <p className="text-royal-blue">
                        Comprometidos: {demand?.committedOrders ?? 0} ·{" "}
                        {(demand?.committedLiters ?? 0).toFixed(1)}L
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-busy={updatingVisibilityId === flavor._id}
                    onClick={() =>
                      updateVisibility(flavor, !flavor.isVisibleOnSite)
                    }
                    disabled={updatingVisibilityId !== null}
                    className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-blue/30 disabled:cursor-wait disabled:opacity-60 ${
                      flavor.isVisibleOnSite
                        ? "bg-wine-red/10 text-wine-red hover:bg-wine-red/15"
                        : "bg-royal-blue text-light-beige hover:bg-royal-blue/90"
                    }`}
                  >
                    {updatingVisibilityId === flavor._id
                      ? "Actualizando…"
                      : flavor.isVisibleOnSite
                        ? "Detener pedidos"
                        : "Aceptar pedidos"}
                  </button>
                </li>
              );
            })}
        </ul>
      </section>

      <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,1fr)]">
        <article className="flex max-h-[44rem] min-w-0 self-start flex-col overflow-hidden rounded-2xl border border-ochre/20 bg-white p-4 sm:rounded-3xl sm:p-5">
          <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-serif text-2xl text-royal-blue sm:text-3xl">
              Sabores registrados
            </h3>
            <button
              type="button"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-ochre/30 px-3 py-2 text-sm text-ochre focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-blue/30 sm:w-auto"
              onClick={() => {
                setSelectedId(null);
                setForm(EMPTY_FORM);
                setIsEditing(true);
              }}
            >
              Nuevo sabor
            </button>
          </div>

          {isLoading ? (
            <AdminFlavorsResultsLoading />
          ) : (
            <ul className="min-h-0 space-y-3 overflow-y-auto overscroll-contain pr-1">
              {flavors.map((flavor) => (
                <li
                  key={flavor._id}
                  className="rounded-2xl border border-ochre/15 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-blue/30"
                      onClick={() => {
                        setSelectedId(flavor._id);
                        setIsEditing(false);
                      }}
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
                        aria-busy={updatingVisibilityId === flavor._id}
                        onClick={() =>
                          updateVisibility(flavor, !flavor.isVisibleOnSite)
                        }
                        disabled={
                          flavor.isArchived || updatingVisibilityId !== null
                        }
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-royal-blue/30 px-3 py-2 text-royal-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-blue/30 disabled:cursor-wait disabled:opacity-40 sm:min-h-9 sm:px-3 sm:py-1.5"
                      >
                        {updatingVisibilityId === flavor._id
                          ? "Actualizando…"
                          : flavor.isVisibleOnSite
                            ? "Ocultar"
                            : "Mostrar"}
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
                  {flavor.inventoryManaged ? (
                    <p className="mt-1 font-data text-xs text-royal-blue">
                      Inventario: {flavor.availableQuantities?.halfLiter ?? 0} ×
                      1/2 L · {flavor.availableQuantities?.liter ?? 0} × 1 L
                    </p>
                  ) : null}
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
          {selectedFlavor && !isEditing ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-ochre">
                    Detalle del sabor
                  </p>
                  <h3 className="mt-1 font-serif text-2xl text-royal-blue sm:text-3xl">
                    {selectedFlavor.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-royal-blue px-4 py-2 text-sm text-light-beige focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-blue/30"
                >
                  Editar
                </button>
              </div>

              <dl className="mt-6 divide-y divide-ochre/15 text-sm">
                <div className="py-3">
                  <dt className="text-xs uppercase tracking-[0.18em] text-ochre">
                    Descripción
                  </dt>
                  <dd className="mt-1 text-oxford-black/75">
                    {selectedFlavor.description}
                  </dd>
                </div>
                <div className="grid gap-4 py-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em] text-ochre">
                      Categoría
                    </dt>
                    <dd className="mt-1">{selectedFlavor.category}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em] text-ochre">
                      Base
                    </dt>
                    <dd className="mt-1">{selectedFlavor.base}</dd>
                  </div>
                </div>
                <div className="grid gap-4 py-3 sm:grid-cols-2">
                  <div>
                    <dt className="font-data text-xs uppercase tracking-[0.18em] text-ochre">
                      Precio 1/2 litro
                    </dt>
                    <dd className="mt-1 font-data text-lg text-royal-blue">
                      {selectedFlavor.availablePresentations.includes(
                        "1/2 litro",
                      ) ? (
                        formatMXN(selectedFlavor.price.halfLiter)
                      ) : (
                        <span className="text-sm text-oxford-black/50">
                          No disponible
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-data text-xs uppercase tracking-[0.18em] text-ochre">
                      Precio 1 litro
                    </dt>
                    <dd className="mt-1 font-data text-lg text-royal-blue">
                      {selectedFlavor.availablePresentations.includes(
                        "1 litro",
                      ) ? (
                        formatMXN(selectedFlavor.price.liter)
                      ) : (
                        <span className="text-sm text-oxford-black/50">
                          No disponible
                        </span>
                      )}
                    </dd>
                  </div>
                </div>
                <div className="py-3">
                  <dt className="text-xs uppercase tracking-[0.18em] text-ochre">
                    {selectedFlavor.inventoryManaged
                      ? "Inventario disponible"
                      : "Presentaciones a la venta"}
                  </dt>
                  <dd className="mt-1 font-data">
                    {selectedFlavor.inventoryManaged
                      ? `${selectedFlavor.availableQuantities?.halfLiter ?? 0} × 1/2 L · ${selectedFlavor.availableQuantities?.liter ?? 0} × 1 L`
                      : selectedFlavor.availablePresentations.join(" · ")}
                  </dd>
                </div>
                <div className="py-3">
                  <dt className="text-xs uppercase tracking-[0.18em] text-ochre">
                    Etiquetas
                  </dt>
                  <dd className="mt-1">{selectedFlavor.tags.join(", ")}</dd>
                </div>
                <div className="py-3">
                  <dt className="text-xs uppercase tracking-[0.18em] text-ochre">
                    Alérgenos
                  </dt>
                  <dd className="mt-1">{selectedFlavor.allergens}</dd>
                </div>
                <div className="grid gap-4 py-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em] text-ochre">
                      En el sitio
                    </dt>
                    <dd className="mt-1">
                      {selectedFlavor.isVisibleOnSite ? "Visible" : "Oculto"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em] text-ochre">
                      Estado
                    </dt>
                    <dd className="mt-1">
                      {selectedFlavor.isArchived ? "Archivado" : "Activo"}
                    </dd>
                  </div>
                </div>
                <div className="py-3">
                  <dt className="text-xs uppercase tracking-[0.18em] text-ochre">
                    Imagen
                  </dt>
                  <dd className="mt-1 break-all font-data">
                    {selectedFlavor.coverImage}
                  </dd>
                </div>
                <div className="py-3">
                  <dt className="text-xs uppercase tracking-[0.18em] text-ochre">
                    Gradiente
                  </dt>
                  <dd className="mt-1 break-all font-data">
                    {selectedFlavor.gradient}
                  </dd>
                </div>
              </dl>
            </>
          ) : isEditing ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-serif text-2xl text-royal-blue sm:text-3xl">
                  {selectedId ? "Editar sabor" : "Crear sabor"}
                </h3>
                {selectedId ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="min-h-11 rounded-2xl border border-ochre/30 px-4 py-2 text-sm text-ochre"
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>

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
                    setForm((prev) => ({
                      ...prev,
                      category: event.target.value,
                    }))
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

                <span className="relative block">
                  <select
                    aria-label="Base del sabor"
                    value={form.base}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        base: event.target.value as FlavorBase,
                      }))
                    }
                    className="min-h-11 w-full appearance-none rounded-2xl border border-ochre/30 py-2 pr-11 pl-4 text-sm"
                  >
                    {FLAVOR_BASES.map((base) => (
                      <option key={base} value={base}>
                        {base}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-royal-blue"
                  />
                </span>

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
                      setForm((prev) => ({
                        ...prev,
                        liter: event.target.value,
                      }))
                    }
                    placeholder="Precio 1 litro"
                    className="min-h-11 w-full rounded-2xl border border-ochre/30 px-3 py-2 text-sm"
                  />
                </div>

                {!selectedFlavor?.inventoryManaged ? (
                  <fieldset className="rounded-2xl border border-ochre/30 px-3 py-3">
                    <legend className="px-1 text-xs uppercase tracking-[0.18em] text-ochre">
                      Presentaciones a la venta
                    </legend>
                    <div className="mt-1 grid gap-2 sm:grid-cols-2">
                      {PRESENTATION_OPTIONS.map((presentation) => (
                        <label
                          key={presentation}
                          className="flex min-h-11 items-center gap-3 rounded-xl bg-cream-white px-3 font-data text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={form.availablePresentations.includes(
                              presentation,
                            )}
                            onChange={(event) =>
                              setForm((previous) => ({
                                ...previous,
                                availablePresentations: event.target.checked
                                  ? [
                                      ...previous.availablePresentations,
                                      presentation,
                                    ]
                                  : previous.availablePresentations.filter(
                                      (option) => option !== presentation,
                                    ),
                              }))
                            }
                            className="size-4 accent-royal-blue"
                          />
                          {presentation}
                        </label>
                      ))}
                    </div>
                    {form.availablePresentations.length === 0 ? (
                      <p className="mt-2 text-xs text-wine-red">
                        Elige al menos una presentación.
                      </p>
                    ) : null}
                  </fieldset>
                ) : (
                  <p className="rounded-2xl bg-light-beige px-4 py-3 text-sm text-oxford-black/65">
                    Las presentaciones disponibles se calculan desde los lotes.
                  </p>
                )}

                <input
                  required
                  aria-label="Alérgenos del sabor"
                  value={form.allergens}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      allergens: event.target.value,
                    }))
                  }
                  placeholder="Alérgenos"
                  className="min-h-11 w-full rounded-2xl border border-ochre/30 px-3 py-2 text-sm"
                />
                <input
                  required
                  aria-label="Clase de gradiente del sabor"
                  value={form.gradient}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      gradient: event.target.value,
                    }))
                  }
                  placeholder="Clase de gradiente (ej. from-ochre/20 to-terracotta/50)"
                  className="min-h-11 w-full rounded-2xl border border-ochre/30 px-3 py-2 text-sm"
                />
                <input
                  required
                  aria-label="Ruta de imagen del sabor"
                  value={form.coverImage}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      coverImage: event.target.value,
                    }))
                  }
                  placeholder="Ruta de imagen"
                  className="min-h-11 w-full rounded-2xl border border-ochre/30 px-3 py-2 text-sm"
                />

                <button
                  type="submit"
                  disabled={
                    isSaving ||
                    (!selectedFlavor?.inventoryManaged &&
                      form.availablePresentations.length === 0)
                  }
                  className="min-h-11 w-full rounded-2xl bg-royal-blue px-4 py-2 text-sm text-light-beige disabled:opacity-50"
                >
                  {isSaving
                    ? "Guardando"
                    : selectedId
                      ? "Actualizar sabor"
                      : "Crear sabor"}
                </button>
              </form>
            </>
          ) : (
            <div className="flex min-h-64 items-center justify-center text-center text-sm text-oxford-black/60">
              Selecciona un sabor para consultar sus detalles.
            </div>
          )}
        </article>
      </section>

      {selectedFlavor && !selectedFlavor.isArchived ? (
        <AdminLotsPanel
          flavorId={selectedFlavor._id}
          flavorName={selectedFlavor.name}
          onInventoryChange={updateSelectedInventory}
        />
      ) : null}
    </div>
  );
}
