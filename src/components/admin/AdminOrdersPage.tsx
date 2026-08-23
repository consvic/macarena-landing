"use client";

import { ChevronDown, Trash2 } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AdminOrdersResultsLoading } from "@/components/admin/AdminLoadingStates";
import { formatMXN } from "@/lib/pricing";
import {
  formatOrderStatus,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/lib/types";

type AdminOrder = {
  _id: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  totalPrice: number;
  itemCount: number;
  createdAt: string;
  customerPhone?: string;
  notes?: string;
  items: Array<{
    _id: string;
    flavorName: string;
    presentation: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
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
  const [orderPendingCancellation, setOrderPendingCancellation] =
    useState<AdminOrder | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const confirmCancellationButtonRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (!orderPendingCancellation) {
      return;
    }

    confirmCancellationButtonRef.current?.focus();
  }, [orderPendingCancellation]);

  useEffect(() => {
    if (!orderPendingCancellation) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !updatingOrderId) {
        setOrderPendingCancellation(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [orderPendingCancellation, updatingOrderId]);

  async function updateStatus(orderId: string, status: OrderStatus) {
    setUpdatingOrderId(orderId);
    setErrorMessage(null);

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
      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Error desconocido",
      );
      return false;
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function confirmCancellation() {
    if (!orderPendingCancellation) {
      return;
    }

    const updated = await updateStatus(
      orderPendingCancellation._id,
      "cancelled",
    );

    if (updated) {
      setOrderPendingCancellation(null);
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
          <p className="text-[0.68rem] uppercase tracking-[0.25em] text-ochre sm:text-xs sm:tracking-[0.35em]">
            Pedidos
          </p>
          <h2 className="mt-2 font-serif text-3xl text-royal-blue sm:text-4xl">
            Historial y estado
          </h2>
        </div>
      </header>

      <section className="rounded-2xl border border-ochre/20 bg-white p-4 sm:rounded-3xl sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="grid gap-2 sm:col-span-2 xl:col-span-1">
            <span className="text-xs text-oxford-black/65">
              Cliente o email
            </span>
            <input
              type="search"
              placeholder="Nombre o correo"
              value={filters.search}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  search: event.target.value,
                  page: 1,
                }))
              }
              className="min-h-11 w-full rounded-2xl border border-ochre/30 px-3 py-2 text-sm outline-none focus-visible:border-royal-blue focus-visible:ring-2 focus-visible:ring-royal-blue/20"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs text-oxford-black/65">
              Estado del pedido
            </span>
            <span className="relative block">
              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    status: event.target.value,
                    page: 1,
                  }))
                }
                className="min-h-11 w-full appearance-none rounded-2xl border border-ochre/30 py-2 pr-11 pl-4 text-sm outline-none focus-visible:border-royal-blue focus-visible:ring-2 focus-visible:ring-royal-blue/20"
              >
                <option value="">Todos los estados</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {formatOrderStatus(status)}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-royal-blue"
              />
            </span>
          </label>

          <label className="grid gap-2">
            <span className="text-xs text-oxford-black/65">Fecha desde</span>
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
              className="min-h-11 w-full rounded-2xl border border-ochre/30 px-3 py-2 text-sm outline-none focus-visible:border-royal-blue focus-visible:ring-2 focus-visible:ring-royal-blue/20"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs text-oxford-black/65">Fecha hasta</span>
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
              className="min-h-11 w-full rounded-2xl border border-ochre/30 px-3 py-2 text-sm outline-none focus-visible:border-royal-blue focus-visible:ring-2 focus-visible:ring-royal-blue/20"
            />
          </label>

          <button
            type="button"
            className="min-h-11 self-end rounded-2xl border border-royal-blue/40 bg-royal-blue px-3 py-2 text-sm text-light-beige focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-blue/30"
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

      <section className="rounded-2xl border border-ochre/20 bg-white p-4 sm:rounded-3xl sm:p-5">
        {errorMessage ? (
          <p className="mb-3 rounded-xl bg-wine-red/10 px-3 py-2 text-sm text-wine-red">
            {errorMessage}
          </p>
        ) : null}

        {isLoading ? (
          <AdminOrdersResultsLoading />
        ) : (
          <div className="space-y-3">
            <div className="hidden px-5 text-xs uppercase tracking-[0.2em] text-oxford-black/50 lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(10.5rem,1fr)_7rem_10rem_5.5rem] lg:gap-4">
              <span>Cliente</span>
              <span>Fecha</span>
              <span className="text-right">Total</span>
              <span>Estado</span>
              <span className="text-center">Acciones</span>
            </div>

            {orders.data.map((order) => {
              return (
                <article
                  key={order._id}
                  className="rounded-2xl border border-ochre/15 px-4 py-4 md:px-5 md:py-4"
                >
                  <div className="lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(10.5rem,1fr)_7rem_10rem_5.5rem] lg:items-center lg:gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-royal-blue">
                        {order.customerName}
                      </p>
                      <p className="break-all font-data text-xs text-oxford-black/60">
                        {order.customerEmail}
                      </p>
                      {order.customerPhone ? (
                        <p className="mt-1 font-data text-xs text-oxford-black/60">
                          {order.customerPhone}
                        </p>
                      ) : null}
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-3 lg:contents">
                      <div className="min-w-0">
                        <dt className="text-[0.68rem] uppercase tracking-[0.16em] text-oxford-black/45 lg:hidden">
                          Fecha
                        </dt>
                        <dd className="break-words font-data text-sm text-oxford-black/70">
                          {new Date(order.createdAt).toLocaleString("es-MX")}
                        </dd>
                      </div>

                      <div className="min-w-0 lg:text-right">
                        <dt className="text-[0.68rem] uppercase tracking-[0.16em] text-oxford-black/45 lg:hidden">
                          Total
                        </dt>
                        <dd className="break-words font-data text-sm text-royal-blue">
                          {formatMXN(order.totalPrice)}
                        </dd>
                      </div>

                      <div className="col-span-2 min-w-0 lg:col-span-1">
                        <dt className="text-[0.68rem] uppercase tracking-[0.16em] text-oxford-black/45 lg:hidden">
                          Estado
                        </dt>
                        <dd>
                          <label className="relative block">
                            <span className="sr-only">
                              Cambiar estado del pedido de {order.customerName}
                            </span>
                            <select
                              aria-label={`Cambiar estado del pedido de ${order.customerName}`}
                              className="mt-1 min-h-11 w-full appearance-none rounded-full border-0 bg-royal-blue/10 py-2 pr-10 pl-4 text-sm text-royal-blue outline-none focus-visible:ring-2 focus-visible:ring-royal-blue/25 lg:mt-0 lg:min-h-9 lg:text-xs"
                              disabled={Boolean(updatingOrderId)}
                              value={order.status}
                              onChange={(event) =>
                                updateStatus(
                                  order._id,
                                  event.target.value as OrderStatus,
                                )
                              }
                            >
                              {ORDER_STATUSES.filter(
                                (status) =>
                                  status !== "cancelled" ||
                                  status === order.status,
                              ).map((status) => (
                                <option key={status} value={status}>
                                  {formatOrderStatus(status)}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              aria-hidden="true"
                              className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-royal-blue"
                            />
                          </label>
                        </dd>
                      </div>
                    </dl>

                    {order.status !== "cancelled" ? (
                      <button
                        type="button"
                        aria-label={`Cancelar pedido de ${order.customerName}`}
                        title="Cancelar pedido"
                        className="mt-4 inline-flex size-11 items-center justify-center rounded-full text-wine-red transition-colors hover:bg-wine-red/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-red/25 disabled:opacity-40 lg:mt-0 lg:justify-self-center"
                        disabled={Boolean(updatingOrderId)}
                        onClick={() => setOrderPendingCancellation(order)}
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </button>
                    ) : (
                      <span className="hidden lg:block" />
                    )}
                  </div>

                  <details className="group mt-4 border-t border-ochre/15">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm text-ochre outline-none focus-visible:ring-2 focus-visible:ring-royal-blue/25 [&::-webkit-details-marker]:hidden">
                      <span>Ver detalle</span>
                      <span className="flex items-center gap-2">
                        <span className="font-data text-xs text-oxford-black/55">
                          {order.itemCount}{" "}
                          {order.itemCount === 1 ? "producto" : "productos"}
                        </span>
                        <ChevronDown
                          aria-hidden="true"
                          className="size-4 transition-transform duration-200 group-open:rotate-180"
                        />
                      </span>
                    </summary>

                    <div className="pb-1">
                      {order.items.length > 0 ? (
                        <ul className="divide-y divide-ochre/10 border-t border-ochre/10">
                          {order.items.map((item) => (
                            <li
                              className="grid gap-1 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4"
                              key={item._id}
                            >
                              <p className="min-w-0 text-royal-blue">
                                {item.flavorName}
                                <span className="font-data text-oxford-black/60">
                                  {` · ${item.presentation} · ${item.quantity} pza.`}
                                </span>
                              </p>
                              <p className="font-data text-oxford-black/70">
                                {formatMXN(item.subtotal)}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="border-t border-ochre/10 py-3 text-sm text-oxford-black/55">
                          Sin detalle de productos disponible.
                        </p>
                      )}
                      {order.notes ? (
                        <p className="mt-3 rounded-xl bg-cream-white px-3 py-2 text-sm text-oxford-black/70">
                          <span className="text-royal-blue">Nota:</span>{" "}
                          {order.notes}
                        </p>
                      ) : null}
                    </div>
                  </details>
                </article>
              );
            })}

            {orders.data.length === 0 ? (
              <p className="rounded-2xl bg-cream-white px-4 py-4 text-sm text-oxford-black/65">
                No hay pedidos para los filtros seleccionados.
              </p>
            ) : null}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 text-sm text-oxford-black/70 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-data">
            Página {orders.pagination.page} de {orders.pagination.totalPages} ·{" "}
            {orders.pagination.total} pedidos
          </p>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex">
            <button
              type="button"
              disabled={orders.pagination.page <= 1}
              className="min-h-11 rounded-xl border border-ochre/30 px-3 py-2 disabled:opacity-40"
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
              className="min-h-11 rounded-xl border border-ochre/30 px-3 py-2 disabled:opacity-40"
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

      {orderPendingCancellation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-oxford-black/45 px-4 py-6">
          <div
            aria-describedby="cancel-order-dialog-description"
            aria-labelledby="cancel-order-dialog-title"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-wine-red/20 bg-white p-5 shadow-2xl shadow-oxford-black/20 sm:p-6"
            role="dialog"
          >
            <p className="text-[0.68rem] uppercase tracking-[0.2em] text-wine-red">
              Confirmación
            </p>
            <h3
              className="mt-2 font-serif text-2xl text-royal-blue"
              id="cancel-order-dialog-title"
            >
              ¿Cancelar pedido?
            </h3>
            <p
              className="mt-3 text-sm leading-6 text-oxford-black/70"
              id="cancel-order-dialog-description"
            >
              Vas a cambiar el pedido de{" "}
              <span className="font-medium text-oxford-black">
                {orderPendingCancellation.customerName}
              </span>{" "}
              a cancelado. Esta acción afecta el estado visible del pedido.
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-cream-white px-4 py-3 text-sm">
              <div className="min-w-0">
                <dt className="text-[0.68rem] uppercase tracking-[0.16em] text-oxford-black/45">
                  Email
                </dt>
                <dd className="break-all font-data text-oxford-black/70">
                  {orderPendingCancellation.customerEmail}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[0.68rem] uppercase tracking-[0.16em] text-oxford-black/45">
                  Total
                </dt>
                <dd className="font-data text-royal-blue">
                  {formatMXN(orderPendingCancellation.totalPrice)}
                </dd>
              </div>
            </dl>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={Boolean(updatingOrderId)}
                className="min-h-11 rounded-xl border border-ochre/30 px-4 py-2 text-sm text-royal-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-blue/30 disabled:opacity-50"
                onClick={() => setOrderPendingCancellation(null)}
              >
                Volver
              </button>
              <button
                type="button"
                disabled={Boolean(updatingOrderId)}
                className="min-h-11 rounded-xl border border-wine-red/40 bg-wine-red px-4 py-2 text-sm text-light-beige focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-red/30 disabled:opacity-50"
                onClick={confirmCancellation}
                ref={confirmCancellationButtonRef}
              >
                {updatingOrderId === orderPendingCancellation._id
                  ? "Cancelando"
                  : "Cancelar pedido"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="rounded-2xl border border-royal-blue/20 bg-light-beige/30 p-4 sm:rounded-3xl sm:p-5">
        <h3 className="font-serif text-2xl text-royal-blue sm:text-3xl">
          Importar CSV (histórico)
        </h3>
        <p className="mt-2 text-sm text-oxford-black/70">
          Solo crea pedidos históricos nuevos. Formato documentado:{" "}
          <code className="break-all font-data">docs/orders-csv-import.md</code>
        </p>

        <form
          onSubmit={handleImportSubmit}
          className="mt-4 grid gap-3 sm:flex sm:flex-wrap sm:items-center"
        >
          <input
            type="file"
            name="file"
            aria-label="Archivo CSV de pedidos históricos"
            accept=".csv,text/csv"
            className="min-h-11 w-full min-w-0 rounded-2xl border border-ochre/30 bg-white px-3 py-2 font-data text-sm sm:w-auto"
          />
          <button
            type="submit"
            disabled={isImporting}
            className="min-h-11 rounded-2xl bg-royal-blue px-4 py-2 text-sm text-light-beige disabled:opacity-50 sm:w-auto"
          >
            {isImporting ? "Importando" : "Importar archivo"}
          </button>
        </form>

        {importMessage ? (
          <p className="mt-3 font-data text-sm text-royal-blue">
            {importMessage}
          </p>
        ) : null}

        {importErrors.length > 0 ? (
          <ul className="mt-3 max-h-48 space-y-2 overflow-auto rounded-2xl bg-white px-3 py-3 font-data text-xs text-wine-red">
            {importErrors.map((error) => (
              <li
                className="break-words"
                key={`${error.row}-${error.column}-${error.message}`}
              >
                Fila {error.row} · {error.column}: {error.message}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
