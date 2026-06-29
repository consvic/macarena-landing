import type { ReactNode } from "react";

const SUMMARY_CARDS = [0, 1, 2, 3] as const;
const ORDER_ROWS = [0, 1, 2, 3] as const;
const FLAVOR_ROWS = [0, 1, 2] as const;
const ANALYTICS_LISTS = [0, 1, 2] as const;

function SkeletonLine({ className }: { className: string }) {
  return <div className={`rounded-full bg-cream-white ${className}`} />;
}

function SkeletonCard({ children }: { children: ReactNode }) {
  return (
    <article className="rounded-2xl border border-ochre/15 bg-white p-4 sm:rounded-3xl sm:p-5">
      {children}
    </article>
  );
}

export function AdminSummaryStatsLoading() {
  return (
    <section
      aria-label="Cargando resumen"
      aria-busy="true"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {SUMMARY_CARDS.map((card) => (
        <SkeletonCard key={card}>
          <SkeletonLine className="h-4 w-20" />
          <SkeletonLine className="mt-4 h-8 w-28 bg-royal-blue/10" />
        </SkeletonCard>
      ))}
    </section>
  );
}

export function AdminRecentOrdersLoading() {
  return (
    <section
      aria-label="Cargando ultimos pedidos"
      aria-busy="true"
      className="rounded-2xl border border-ochre/20 bg-white p-4 sm:rounded-3xl sm:p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-serif text-2xl text-royal-blue sm:text-3xl">
          Últimos pedidos
        </h3>
        <SkeletonLine className="h-4 w-16 bg-ochre/15" />
      </div>
      <div className="mt-5 space-y-3">
        {ORDER_ROWS.slice(0, 3).map((row) => (
          <div
            className="flex flex-col gap-3 rounded-2xl border border-ochre/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            key={row}
          >
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonLine className="h-4 w-36 bg-royal-blue/10" />
              <SkeletonLine className="h-3 w-48" />
            </div>
            <div className="space-y-2 sm:w-28">
              <SkeletonLine className="h-4 w-24 bg-royal-blue/10 sm:ml-auto" />
              <SkeletonLine className="h-3 w-20 bg-ochre/15 sm:ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AdminOrdersResultsLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Cargando pedidos"
      className="space-y-3"
    >
      <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(9rem,1fr)_auto_auto_auto] gap-3 px-2 md:grid">
        <SkeletonLine className="h-3 w-20" />
        <SkeletonLine className="h-3 w-16" />
        <SkeletonLine className="h-3 w-14" />
        <SkeletonLine className="h-3 w-16" />
        <SkeletonLine className="h-3 w-20" />
      </div>
      {ORDER_ROWS.map((row) => (
        <div
          className="rounded-2xl border border-ochre/15 px-4 py-4 md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(9rem,1fr)_auto_auto_auto] md:items-center md:gap-3 md:px-3 md:py-3"
          key={row}
        >
          <div className="min-w-0 space-y-2">
            <SkeletonLine className="h-4 w-36 bg-royal-blue/10" />
            <SkeletonLine className="h-3 w-48" />
          </div>
          <div className="mt-4 md:mt-0">
            <SkeletonLine className="h-4 w-36" />
          </div>
          <div className="mt-4 md:mt-0">
            <SkeletonLine className="h-4 w-20 bg-royal-blue/10" />
          </div>
          <div className="mt-4 md:mt-0">
            <SkeletonLine className="h-8 w-24 bg-royal-blue/10" />
          </div>
          <div className="mt-4 flex gap-2 md:mt-0">
            <SkeletonLine className="h-9 w-20 bg-ochre/15" />
            <SkeletonLine className="h-9 w-20 bg-wine-red/10" />
          </div>
        </div>
      ))}
    </section>
  );
}

export function AdminFlavorsResultsLoading() {
  return (
    <ul aria-busy="true" aria-label="Cargando sabores" className="space-y-3">
      {FLAVOR_ROWS.map((row) => (
        <li className="rounded-2xl border border-ochre/15 px-4 py-4" key={row}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonLine className="h-6 w-40 bg-royal-blue/10" />
              <SkeletonLine className="h-3 w-28 bg-ochre/15" />
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
              <SkeletonLine className="h-9 w-full bg-royal-blue/10 sm:w-20" />
              <SkeletonLine className="h-9 w-full bg-wine-red/10 sm:w-20" />
            </div>
          </div>
          <SkeletonLine className="mt-4 h-3 w-full" />
          <SkeletonLine className="mt-2 h-3 w-4/5" />
          <SkeletonLine className="mt-3 h-3 w-44" />
        </li>
      ))}
    </ul>
  );
}

export function AdminAnalyticsResultsLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Cargando analisis"
      className="space-y-8"
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {SUMMARY_CARDS.map((card) => (
          <SkeletonCard key={card}>
            <SkeletonLine className="h-4 w-28" />
            <SkeletonLine className="mt-4 h-8 w-24 bg-royal-blue/10" />
          </SkeletonCard>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        {ANALYTICS_LISTS.map((list) => (
          <SkeletonCard key={list}>
            <SkeletonLine className="h-7 w-44 bg-royal-blue/10" />
            <div className="mt-4 space-y-2">
              {ORDER_ROWS.map((row) => (
                <div className="rounded-xl bg-cream-white px-3 py-3" key={row}>
                  <SkeletonLine className="h-4 w-4/5 bg-white/80" />
                  <SkeletonLine className="mt-2 h-3 w-1/2 bg-white/80" />
                </div>
              ))}
            </div>
          </SkeletonCard>
        ))}
      </section>
    </section>
  );
}
