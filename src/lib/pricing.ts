import type { PresentationOption, PriceByPresentation } from "@/lib/types";

export function resolveFlavorPrice(
  price: PriceByPresentation,
  presentation: PresentationOption,
) {
  return presentation === "1 litro" ? price.liter : price.halfLiter;
}

export function formatMXN(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(amount);
}
