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
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type IncomingOrderItem = {
  flavorId?: string;
  flavorName: string;
  presentation: string;
  quantity: number;
  unitPrice: number;
};
