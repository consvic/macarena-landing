"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

type Quantities = { halfLiter: number; liter: number };

type AdminLot = {
  _id: string;
  packed: Quantities;
  remaining: Quantities;
  createdBy: string;
  createdAt: string;
  adjustments: Array<
    Quantities & {
      reason: string;
      adjustedBy: string;
      adjustedAt: string;
    }
  >;
};

type LotsResponse = { data: AdminLot[]; totals: Quantities };

const EMPTY_QUANTITIES = { halfLiter: "", liter: "" };

export function AdminLotsPanel({
  flavorId,
  flavorName,
  onInventoryChange,
}: {
  flavorId: string;
  flavorName: string;
  onInventoryChange: (totals: Quantities) => void;
}) {
  const [lots, setLots] = useState<AdminLot[]>([]);
  const [newLot, setNewLot] = useState(EMPTY_QUANTITIES);
  const [adjustingLotId, setAdjustingLotId] = useState<string | null>(null);
  const [adjustment, setAdjustment] = useState({
    ...EMPTY_QUANTITIES,
    reason: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadLots = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/lots?flavorId=${encodeURIComponent(flavorId)}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as LotsResponse & {
        message?: string;
      };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudieron cargar los lotes");
      }
      if (!Array.isArray(payload.data)) {
        throw new Error("La respuesta de lotes no es válida");
      }
      setLots(payload.data);
      if (payload.data.length > 0) onInventoryChange(payload.totals);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  }, [flavorId, onInventoryChange]);

  useEffect(() => {
    loadLots();
  }, [loadLots]);

  async function createLot(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/lots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flavorId, ...newLot }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo crear el lote");
      }
      setNewLot(EMPTY_QUANTITIES);
      setMessage("Lote creado");
      await loadLots();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveAdjustment(event: FormEvent) {
    event.preventDefault();
    if (!adjustingLotId) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/admin/lots/${adjustingLotId}/adjustments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(adjustment),
        },
      );
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo ajustar el lote");
      }
      setAdjustingLotId(null);
      setAdjustment({ ...EMPTY_QUANTITIES, reason: "" });
      setMessage("Inventario ajustado");
      await loadLots();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-royal-blue/20 bg-white sm:rounded-3xl">
      <header className="border-b border-royal-blue/10 bg-cream-white px-4 py-5 sm:px-6">
        <p className="text-xs uppercase tracking-[0.25em] text-ochre">
          Lotes e inventario
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
          <h3 className="font-serif text-2xl text-royal-blue sm:text-3xl">
            {flavorName}
          </h3>
          <p className="text-sm text-oxford-black/60">
            Los lotes más antiguos se venden primero.
          </p>
        </div>
      </header>

      {message ? (
        <p className="mx-4 mt-4 rounded-xl bg-royal-blue/10 px-3 py-2 text-sm text-royal-blue sm:mx-6">
          {message}
        </p>
      ) : null}

      <form
        onSubmit={createLot}
        className="grid gap-3 border-b border-ochre/15 px-4 py-5 sm:grid-cols-[1fr_1fr_auto] sm:px-6"
      >
        <label className="text-xs uppercase tracking-[0.16em] text-ochre">
          <span className="font-data">Cantidad 1/2 litro</span>
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={newLot.halfLiter}
            onChange={(event) =>
              setNewLot((value) => ({
                ...value,
                halfLiter: event.target.value,
              }))
            }
            className="mt-2 min-h-11 w-full rounded-xl border border-ochre/30 px-3 font-data text-sm"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.16em] text-ochre">
          <span className="font-data">Cantidad 1 litro</span>
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={newLot.liter}
            onChange={(event) =>
              setNewLot((value) => ({ ...value, liter: event.target.value }))
            }
            className="mt-2 min-h-11 w-full rounded-xl border border-ochre/30 px-3 font-data text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={isSaving}
          className="min-h-11 self-end rounded-xl bg-royal-blue px-5 text-sm text-light-beige disabled:opacity-50"
        >
          {isSaving ? "Guardando…" : "Crear lote"}
        </button>
      </form>

      <div className="px-4 py-5 sm:px-6">
        {isLoading ? (
          <p className="text-sm text-oxford-black/60">Cargando lotes…</p>
        ) : lots.length === 0 ? (
          <p className="text-sm text-oxford-black/60">
            Este sabor aún usa disponibilidad sin inventario. Crea su primer
            lote para comenzar a controlar existencias.
          </p>
        ) : (
          <ol className="space-y-4">
            {lots.map((lot) => (
              <li
                key={lot._id}
                className="border-b border-ochre/15 pb-4 last:border-0"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-data text-xs text-oxford-black/50">
                      {new Date(lot.createdAt).toLocaleString("es-MX")}
                    </p>
                    <p className="mt-1 font-data text-sm text-royal-blue">
                      Disponibles: {lot.remaining.halfLiter} × 1/2 L ·{" "}
                      {lot.remaining.liter} × 1 L
                    </p>
                    <p className="mt-1 font-data text-xs text-oxford-black/55">
                      Empacados: {lot.packed.halfLiter} × 1/2 L ·{" "}
                      {lot.packed.liter} × 1 L
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdjustingLotId(lot._id)}
                    className="min-h-11 rounded-xl border border-royal-blue/25 px-4 text-sm text-royal-blue"
                  >
                    Ajustar
                  </button>
                </div>

                {adjustingLotId === lot._id ? (
                  <form
                    onSubmit={saveAdjustment}
                    className="mt-4 grid gap-3 rounded-2xl bg-light-beige p-4 sm:grid-cols-2"
                  >
                    <input
                      type="number"
                      step="1"
                      aria-label="Ajuste de medio litro"
                      placeholder="Ajuste 1/2 litro (+/-)"
                      value={adjustment.halfLiter}
                      onChange={(event) =>
                        setAdjustment((value) => ({
                          ...value,
                          halfLiter: event.target.value,
                        }))
                      }
                      className="min-h-11 rounded-xl border border-ochre/30 px-3 font-data text-sm"
                    />
                    <input
                      type="number"
                      step="1"
                      aria-label="Ajuste de un litro"
                      placeholder="Ajuste 1 litro (+/-)"
                      value={adjustment.liter}
                      onChange={(event) =>
                        setAdjustment((value) => ({
                          ...value,
                          liter: event.target.value,
                        }))
                      }
                      className="min-h-11 rounded-xl border border-ochre/30 px-3 font-data text-sm"
                    />
                    <input
                      required
                      aria-label="Motivo del ajuste"
                      placeholder="Motivo del ajuste"
                      value={adjustment.reason}
                      onChange={(event) =>
                        setAdjustment((value) => ({
                          ...value,
                          reason: event.target.value,
                        }))
                      }
                      className="min-h-11 rounded-xl border border-ochre/30 px-3 text-sm sm:col-span-2"
                    />
                    <div className="flex gap-2 sm:col-span-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setAdjustingLotId(null)}
                        className="min-h-11 rounded-xl px-4 text-sm text-ochre"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="min-h-11 rounded-xl bg-royal-blue px-4 text-sm text-light-beige disabled:opacity-50"
                      >
                        Guardar ajuste
                      </button>
                    </div>
                  </form>
                ) : null}

                {lot.adjustments.length > 0 ? (
                  <details className="mt-3 text-xs text-oxford-black/60">
                    <summary className="cursor-pointer text-ochre">
                      Historial de ajustes ({lot.adjustments.length})
                    </summary>
                    <ul className="mt-2 space-y-2 pl-3">
                      {lot.adjustments.map((entry, index) => (
                        <li key={`${entry.adjustedAt}:${index}`}>
                          <span className="font-data">
                            {entry.halfLiter > 0 ? "+" : ""}
                            {entry.halfLiter} × 1/2 L ·{" "}
                            {entry.liter > 0 ? "+" : ""}
                            {entry.liter} × 1 L
                          </span>{" "}
                          — {entry.reason}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
