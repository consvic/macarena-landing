import type { PresentationOption } from "@/lib/types";

export function parsePrice(price: string) {
  const normalized = Number.parseFloat(price.replace(/[^\d.]/g, ""));
  return Number.isNaN(normalized) ? 0 : normalized;
}

export function presentationMultiplier(option: PresentationOption) {
  return option === "1 litro" ? 2 : 1;
}

export function formatMXN(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(amount);
}
