export type PriceByPresentation = {
  halfLiter: number;
  liter: number;
};

export const FLAVOR_BASES = ["Agua", "Crema"] as const;
export type FlavorBase = (typeof FLAVOR_BASES)[number];

export type Flavor = {
  _id?: string;
  name: string;
  description: string;
  category: string;
  base: FlavorBase;
  tags: string[];
  price: PriceByPresentation;
  allergens: string;
  gradient: string;
  coverImage: string;
  exists: boolean;
  isVisibleOnSite?: boolean;
  isArchived?: boolean;
  updatedBy?: string;
};

export const PRESENTATION_OPTIONS = ["1/2 litro", "1 litro"] as const;
export type PresentationOption = (typeof PRESENTATION_OPTIONS)[number];

export type CartItem = {
  id: string;
  flavorName: string;
  presentation: PresentationOption;
  price: number;
};

export const ORDER_STATUSES = [
  "pending_confirmation",
  "confirmed",
  "paid",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS = {
  pending_confirmation: "pendiente",
  confirmed: "confirmado",
  paid: "pagado",
  delivered: "entregado",
  cancelled: "cancelado",
} satisfies Record<OrderStatus, string>;

export function formatOrderStatus(status: OrderStatus) {
  return ORDER_STATUS_LABELS[status];
}

export type IncomingOrderItem = {
  flavorId?: string;
  flavorName: string;
  presentation: string;
  quantity: number;
  unitPrice: number;
};
