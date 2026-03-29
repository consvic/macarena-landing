import type { OrderStatus, PresentationOption } from "@/lib/types";

export type OrderEmailItem = {
  flavorName: string;
  presentation: PresentationOption | string;
  quantity: number;
  subtotal: number;
};

export type OrderEmailPayload = {
  _id: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  totalPrice: number;
  currency: string;
  items: OrderEmailItem[];
  createdAt?: string;
};
