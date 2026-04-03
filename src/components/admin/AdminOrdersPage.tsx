"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { formatMXN } from "@/lib/pricing";
import { ORDER_STATUSES } from "@/lib/types";

type AdminOrder = {
  _id: string;
  customerName: string;
  customerEmail: string;
  status: string;
  totalPrice: number;
  itemCount: number;
  createdAt: string;
};

type OrdersResponse = {
  data: AdminOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const DEFAULT_RESPONSE: OrdersResponse = {
  data: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  },
};

export function AdminOrdersPage() {
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    page: 1,
  });
  const [orders, setOrders] = useState<OrdersResponse>(DEFAULT_RESPONSE);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<
    Array<{ row: number; column: string; message: string }>
  >([]);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(filters.page));
    params.set("limit", "20");

    if (filters.search.trim()) {
      params.set("search", filters.search.trim());
    }

    if (filters.status) {
      params.set("status", filters.status);
    }

    if (filters.dateFrom) {
      params.set("dateFrom", filters.dateFrom);
    }

    if (filters.dateTo) {
      params.set("dateTo", filters.dateTo);
    }

    return params.toString();
  }, [filters]);

  useEffect(() => {
    let active = true;

    async function fetchOrders() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await fetch(`/api/admin/orders?${query}`, {
          cache: "no-store",
        });

        const payload = (await response.json()) as
          | OrdersResponse
          | { message?: string };
        if (!response.ok) {
          throw new Error(
            (payload as { message?: string }).message ??
              "No se pudo cargar pedidos",
          );
        }

        if (!active) {
          return;
        }

        setOrders(payload as OrdersResponse);
      } catch (error) {
        if (!active) {
          return;
        }
        setErrorMessage(
          error instanceof Error ? error.message : "Error desconocido",
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    fetchOrders();

    return () => {
      active = false;
    };
  }, [query]);

  async function updateStatus(orderId: string, status: string) {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo actualizar estado");
      }

      setOrders((previous) => ({
        ...previous,
        data: previous.data.map((order) =>
          order._id === orderId ? { ...order, status } : order,
        ),
      }));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Error desconocido",
      );
    }
  }

  async function handleImportSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setImportMessage(null);
    setImportErrors([]);

    const form = event.currentTarget;
    const input = form.elements.namedItem("file") as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!file) {
      setImportMessage("Selecciona un archivo CSV antes de importar.");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);

    setIsImporting(true);
    try {
      const response = await fetch("/api/admin/orders/import", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        message?: string;
        importedOrders?: number;
        importedItems?: number;
        errors?: Array<{ row: number; column: string; message: string }>;
      };

      if (!response.ok) {
        setImportErrors(payload.errors ?? []);
        throw new Error(payload.message ?? "Importación fallida");
      }

      setImportMessage(
        `Importación completa: ${payload.importedOrders ?? 0} pedidos y ${payload.importedItems ?? 0} renglones.`,
      );
      setFilters((previous) => ({ ...previous, page: 1 }));
      form.reset();
    } catch (error) {
      setImportMessage(
        error instanceof Error ? error.message : "Error desconocido",
      );
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-ochre">
            Pedidos
          </p>
          <h2 className="mt-2 font-serif text-4xl text-royal-blue">
            Historial y estado
          </h2>
        </div>
      </header>

      <section className="rounded-3xl border border-ochre/20 bg-white p-5">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <input
            type="search"
            placeholder="Buscar por cliente o email"
            value={filters.search}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                search: event.target.value,
                page: 1,
              }))
            }
            className="rounded-2xl border border-ochre/30 px-3 py-2 text-sm outline-none focus:border-royal-blue"
          />

          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                status: event.target.value,
                page: 1,
              }))
            }
            className="rounded-2xl border border-ochre/30 px-3 py-2 text-sm outline-none focus:border-royal-blue"
          >
            <option value="">Todos los estados</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                dateFrom: event.target.value,
                page: 1,
              }))
            }
            className="rounded-2xl border border-ochre/30 px-3 py-2 text-sm outline-none focus:border-royal-blue"
          />

          <input
            type="date"
            value={filters.dateTo}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                dateTo: event.target.value,
                page: 1,
              }))
            }
            className="rounded-2xl border border-ochre/30 px-3 py-2 text-sm outline-none focus:border-royal-blue"
          />

          <button
            type="button"
            className="rounded-2xl border border-royal-blue/40 bg-royal-blue px-3 py-2 text-sm text-light-beige"
            onClick={() =>
              setFilters({
                search: "",
                status: "",
                dateFrom: "",
                dateTo: "",
                page: 1,
              })
            }
          >
            Limpiar filtros
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-ochre/20 bg-white p-5">
        {errorMessage ? (
          <p className="mb-3 rounded-xl bg-wine-red/10 px-3 py-2 text-sm text-wine-red">
            {errorMessage}
          </p>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-oxford-black/70">Cargando pedidos...</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-[1.2fr_1fr_auto_auto_auto] gap-2 px-2 text-xs uppercase tracking-[0.2em] text-oxford-black/50">
              <span>Cliente</span>
              <span>Fecha</span>
              <span>Total</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>

            {orders.data.map((order) => (
              <article
                key={order._id}
                className="grid grid-cols-[1.2fr_1fr_auto_auto_auto] items-center gap-2 rounded-2xl border border-ochre/15 px-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-royal-blue">
                    {order.customerName}
                  </p>
                  <p className="text-xs text-oxford-black/60">
                    {order.customerEmail}
                  </p>
                </div>

                <p className="text-sm text-oxford-black/70">
                  {new Date(order.createdAt).toLocaleString("es-MX")}
                </p>

                <p className="font-numeric text-sm text-royal-blue">
                  {formatMXN(order.totalPrice)}
                </p>

                <span className="rounded-full bg-royal-blue/10 px-3 py-1 text-xs text-royal-blue">
                  {order.status}
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-ochre/30 px-2 py-1 text-xs text-ochre"
                    onClick={() => updateStatus(order._id, "confirmed")}
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-wine-red/30 px-2 py-1 text-xs text-wine-red"
                    onClick={() => updateStatus(order._id, "cancelled")}
                  >
                    Cancelar
                  </button>
                </div>
              </article>
            ))}

            {orders.data.length === 0 ? (
              <p className="rounded-2xl bg-cream-white px-4 py-4 text-sm text-oxford-black/65">
                No hay pedidos para los filtros seleccionados.
              </p>
            ) : null}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-sm text-oxford-black/70">
          <p>
            Página {orders.pagination.page} de {orders.pagination.totalPages} ·{" "}
            {orders.pagination.total} pedidos
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={orders.pagination.page <= 1}
              className="rounded-xl border border-ochre/30 px-3 py-1 disabled:opacity-40"
              onClick={() =>
                setFilters((previous) => ({
                  ...previous,
                  page: Math.max(1, previous.page - 1),
                }))
              }
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={orders.pagination.page >= orders.pagination.totalPages}
              className="rounded-xl border border-ochre/30 px-3 py-1 disabled:opacity-40"
              onClick={() =>
                setFilters((previous) => ({
                  ...previous,
                  page: previous.page + 1,
                }))
              }
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-royal-blue/20 bg-light-beige/30 p-5">
        <h3 className="font-serif text-2xl text-royal-blue">
          Importar CSV (histórico)
        </h3>
        <p className="mt-2 text-sm text-oxford-black/70">
          Solo crea pedidos históricos nuevos. Usa el formato documentado en{" "}
          <code>docs/orders-csv-import.md</code>.
        </p>

        <form
          onSubmit={handleImportSubmit}
          className="mt-4 flex flex-wrap items-center gap-3"
        >
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            className="rounded-2xl border border-ochre/30 bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={isImporting}
            className="rounded-2xl bg-royal-blue px-4 py-2 text-sm text-light-beige disabled:opacity-50"
          >
            {isImporting ? "Importando..." : "Importar archivo"}
          </button>
        </form>

        {importMessage ? (
          <p className="mt-3 text-sm text-royal-blue">{importMessage}</p>
        ) : null}

        {importErrors.length > 0 ? (
          <ul className="mt-3 max-h-48 space-y-2 overflow-auto rounded-2xl bg-white px-3 py-3 text-xs text-wine-red">
            {importErrors.map((error) => (
              <li key={`${error.row}-${error.column}-${error.message}`}>
                Fila {error.row} · {error.column}: {error.message}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
