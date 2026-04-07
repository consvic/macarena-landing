"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMXN } from "@/lib/pricing";

type StatsResponse = {
  range: {
    dateFrom: string;
    dateTo: string;
  };
  summary: {
    totalOrders: number;
    totalRevenue: number;
    averageSpendPerOrder: number;
    averageLitersPerOrder: number;
  };
  topFlavors: Array<{
    flavorName: string;
    quantity: number;
    liters: number;
    revenue: number;
  }>;
  frequentBuyers: Array<{
    buyerKey: string;
    displayName: string;
    orderCount: number;
    totalSpent: number;
    liters: number;
  }>;
  topSpenders: Array<{
    buyerKey: string;
    displayName: string;
    orderCount: number;
    totalSpent: number;
    liters: number;
  }>;
};

export function AdminAnalyticsPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("topN", "10");
    if (dateFrom) {
      params.set("dateFrom", dateFrom);
    }
    if (dateTo) {
      params.set("dateTo", dateTo);
    }
    return params.toString();
  }, [dateFrom, dateTo]);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await fetch(`/api/admin/stats?${query}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as
          | StatsResponse
          | { message?: string };
        if (!response.ok) {
          throw new Error(
            (payload as { message?: string }).message ??
              "No se pudo cargar análisis",
          );
        }

        if (!active) {
          return;
        }

        const parsed = payload as StatsResponse;
        setStats(parsed);
        setDateFrom((previous) => previous || parsed.range.dateFrom);
        setDateTo((previous) => previous || parsed.range.dateTo);
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

    loadStats();

    return () => {
      active = false;
    };
  }, [query]);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.35em] text-ochre">
          Análisis
        </p>
        <h2 className="mt-2 font-serif text-4xl text-royal-blue">
          Tendencias y compradores
        </h2>
      </header>

      <section className="rounded-3xl border border-ochre/20 bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="rounded-2xl border border-ochre/30 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="rounded-2xl border border-ochre/30 px-3 py-2 text-sm"
          />
          <p className="text-sm text-oxford-black/65">
            Zona horaria: America/Mexico_City
          </p>
        </div>
      </section>

      {errorMessage ? (
        <p className="rounded-2xl bg-wine-red/10 px-4 py-3 text-sm text-wine-red">
          {errorMessage}
        </p>
      ) : null}

      {isLoading || !stats ? (
        <p className="rounded-2xl bg-white px-4 py-6 text-sm text-oxford-black/70">
          Cargando análisis...
        </p>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl border border-royal-blue/20 bg-white p-5">
              <p className="text-sm text-oxford-black/65">Pedidos</p>
              <p className="mt-2 font-numeric text-3xl text-royal-blue">
                {stats.summary.totalOrders}
              </p>
            </article>
            <article className="rounded-3xl border border-royal-blue/20 bg-white p-5">
              <p className="text-sm text-oxford-black/65">Ingresos</p>
              <p className="mt-2 font-numeric text-3xl text-royal-blue">
                {formatMXN(stats.summary.totalRevenue)}
              </p>
            </article>
            <article className="rounded-3xl border border-royal-blue/20 bg-white p-5">
              <p className="text-sm text-oxford-black/65">
                Promedio por pedido
              </p>
              <p className="mt-2 font-numeric text-3xl text-royal-blue">
                {formatMXN(stats.summary.averageSpendPerOrder)}
              </p>
            </article>
            <article className="rounded-3xl border border-royal-blue/20 bg-white p-5">
              <p className="text-sm text-oxford-black/65">
                Promedio litros/pedido
              </p>
              <p className="mt-2 font-numeric text-3xl text-royal-blue">
                {stats.summary.averageLitersPerOrder.toFixed(2)}L
              </p>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <article className="rounded-3xl border border-ochre/20 bg-white p-5">
              <h3 className="font-serif text-2xl text-royal-blue">
                Sabores más comprados
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {stats.topFlavors.map((entry) => (
                  <li
                    key={entry.flavorName}
                    className="flex items-center justify-between gap-3 rounded-xl bg-cream-white px-3 py-2"
                  >
                    <span>{entry.flavorName}</span>
                    <span className="font-numeric text-royal-blue">
                      {entry.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-3xl border border-ochre/20 bg-white p-5">
              <h3 className="font-serif text-2xl text-royal-blue">
                Compradores frecuentes
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {stats.frequentBuyers.map((entry) => (
                  <li
                    key={entry.buyerKey}
                    className="rounded-xl bg-cream-white px-3 py-2"
                  >
                    <p className="text-royal-blue">{entry.displayName}</p>
                    <p className="text-xs text-oxford-black/65">
                      {entry.orderCount} pedidos · {formatMXN(entry.totalSpent)}
                    </p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-3xl border border-ochre/20 bg-white p-5">
              <h3 className="font-serif text-2xl text-royal-blue">
                Mayor gasto
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {stats.topSpenders.map((entry) => (
                  <li
                    key={entry.buyerKey}
                    className="rounded-xl bg-cream-white px-3 py-2"
                  >
                    <p className="text-royal-blue">{entry.displayName}</p>
                    <p className="text-xs text-oxford-black/65">
                      {formatMXN(entry.totalSpent)} · {entry.liters.toFixed(1)}L
                    </p>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        </>
      )}
    </div>
  );
}
