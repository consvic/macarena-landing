import Link from "next/link";
import { getAdminStats, listAdminOrders } from "@/lib/admin/services";
import { formatMXN } from "@/lib/pricing";
import { formatOrderStatus } from "@/lib/types";

export default async function AdminResumenPage() {
  const [stats, recentOrders] = await Promise.all([
    getAdminStats({}),
    listAdminOrders({ page: 1, limit: 5 }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[0.68rem] uppercase tracking-[0.25em] text-ochre sm:text-xs sm:tracking-[0.35em]">
          Resumen
        </p>
        <h2 className="mt-2 font-serif text-3xl text-royal-blue sm:text-4xl">
          Operación diaria
        </h2>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-royal-blue/20 bg-white p-4 sm:rounded-3xl sm:p-5">
          <p className="text-sm text-oxford-black/70">Pedidos</p>
          <p className="mt-2 break-words font-data text-2xl text-royal-blue sm:text-3xl">
            {stats.summary.totalOrders}
          </p>
        </article>
        <article className="rounded-2xl border border-royal-blue/20 bg-white p-4 sm:rounded-3xl sm:p-5">
          <p className="text-sm text-oxford-black/70">Ingresos</p>
          <p className="mt-2 break-words font-data text-2xl text-royal-blue sm:text-3xl">
            {formatMXN(stats.summary.totalRevenue)}
          </p>
        </article>
        <article className="rounded-2xl border border-royal-blue/20 bg-white p-4 sm:rounded-3xl sm:p-5">
          <p className="text-sm text-oxford-black/70">Promedio por pedido</p>
          <p className="mt-2 break-words font-data text-2xl text-royal-blue sm:text-3xl">
            {formatMXN(stats.summary.averageSpendPerOrder)}
          </p>
        </article>
        <article className="rounded-2xl border border-royal-blue/20 bg-white p-4 sm:rounded-3xl sm:p-5">
          <p className="text-sm text-oxford-black/70">Promedio litros/pedido</p>
          <p className="mt-2 break-words font-data text-2xl text-royal-blue sm:text-3xl">
            {stats.summary.averageLitersPerOrder.toFixed(2)}L
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-ochre/20 bg-white p-4 sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-serif text-2xl text-royal-blue sm:text-3xl">
            Últimos pedidos
          </h3>
          <Link
            className="inline-flex min-h-11 items-center text-sm text-ochre hover:text-wine-red focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-blue/30"
            href="/admin/pedidos"
          >
            Ver todos
          </Link>
        </div>
        <ul className="mt-5 space-y-3">
          {recentOrders.data.map((order) => (
            <li
              key={order._id}
              className="flex flex-col items-start gap-3 rounded-2xl border border-ochre/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-royal-blue">
                  {order.customerName}
                </p>
                <p className="break-all font-data text-xs text-oxford-black/65">
                  {order.customerEmail}
                </p>
              </div>
              <div className="w-full text-left sm:w-auto sm:text-right">
                <p className="font-data text-sm text-royal-blue">
                  {formatMXN(order.totalPrice)}
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-ochre sm:tracking-[0.2em]">
                  {formatOrderStatus(order.status)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
