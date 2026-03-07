export type Flavor = {
  _id?: string;
  name: string;
  description: string;
  category: string;
  base: string;
  intensity: string;
  tags: string[];
  price: string;
  notes: string[];
  allergens: string;
  gradient: string;
};

export const PRESENTATION_OPTIONS = ["1/2 litro", "1 litro"] as const;
export type PresentationOption = (typeof PRESENTATION_OPTIONS)[number];

export type CartItem = {
  id: string;
  flavorName: string;
  presentation: PresentationOption;
  price: number;
};

export type OrderStatus = "pending_confirmation" | "confirmed" | "cancelled";
