import Link from "next/link";
import { getAdminStats, listAdminOrders } from "@/lib/admin/services";
import { formatMXN } from "@/lib/pricing";

export default async function AdminResumenPage() {
  const [stats, recentOrders] = await Promise.all([
    getAdminStats({}),
    listAdminOrders({ page: 1, limit: 5 }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.35em] text-ochre">
          Resumen
        </p>
        <h2 className="mt-2 font-serif text-4xl text-royal-blue">
          Operación diaria
        </h2>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-royal-blue/20 bg-white p-5">
          <p className="text-sm text-oxford-black/70">Pedidos</p>
          <p className="mt-2 font-numeric text-3xl text-royal-blue">
            {stats.summary.totalOrders}
          </p>
        </article>
        <article className="rounded-3xl border border-royal-blue/20 bg-white p-5">
          <p className="text-sm text-oxford-black/70">Ingresos</p>
          <p className="mt-2 font-numeric text-3xl text-royal-blue">
            {formatMXN(stats.summary.totalRevenue)}
          </p>
        </article>
        <article className="rounded-3xl border border-royal-blue/20 bg-white p-5">
          <p className="text-sm text-oxford-black/70">Promedio por pedido</p>
          <p className="mt-2 font-numeric text-3xl text-royal-blue">
            {formatMXN(stats.summary.averageSpendPerOrder)}
          </p>
        </article>
        <article className="rounded-3xl border border-royal-blue/20 bg-white p-5">
          <p className="text-sm text-oxford-black/70">Promedio litros/pedido</p>
          <p className="mt-2 font-numeric text-3xl text-royal-blue">
            {stats.summary.averageLitersPerOrder.toFixed(2)}L
          </p>
        </article>
      </section>

      <section className="rounded-3xl border border-ochre/20 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl text-royal-blue">
            Últimos pedidos
          </h3>
          <Link
            className="text-sm text-ochre hover:text-wine-red"
            href="/admin/pedidos"
          >
            Ver todos
          </Link>
        </div>
        <ul className="mt-5 space-y-3">
          {recentOrders.data.map((order) => (
            <li
              key={order._id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ochre/15 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-royal-blue">
                  {order.customerName}
                </p>
                <p className="text-xs text-oxford-black/65">
                  {order.customerEmail}
                </p>
              </div>
              <div className="text-right">
                <p className="font-numeric text-sm text-royal-blue">
                  {formatMXN(order.totalPrice)}
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-ochre">
                  {order.status}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
