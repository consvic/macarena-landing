import { formatOrderStatus, type OrderStatus } from "@/lib/types";

// Tints track the operational flow: ochre needs attention, royal-blue is in
// progress, solid royal-blue is paid, muted is finished, wine-red is cancelled.
const STATUS_STYLES = {
  pending_confirmation: "bg-ochre/25 text-oxford-black",
  confirmed: "bg-royal-blue/10 text-royal-blue",
  paid: "bg-royal-blue text-light-beige",
  delivered: "bg-oxford-black/10 text-oxford-black/80",
  cancelled: "bg-wine-red/10 text-wine-red",
} satisfies Record<OrderStatus, string>;

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {formatOrderStatus(status)}
    </span>
  );
}
