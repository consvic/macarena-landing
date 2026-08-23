import {
  PRESENTATION_OPTIONS,
  type PresentationOption,
  type PriceByPresentation,
} from "@/lib/types";

export function getAvailablePresentations(
  availablePresentations?: PresentationOption[],
) {
  return availablePresentations ?? [...PRESENTATION_OPTIONS];
}

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
