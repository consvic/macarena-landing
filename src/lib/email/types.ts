export type OrderEmailItem = {
  flavorName: string;
  presentation: string;
  quantity: number;
  subtotal: number;
};

export type OrderEmailPayload = {
  _id: string;
  customerName: string;
  customerEmail: string;
  status: string;
  totalPrice: number;
  currency: string;
  items: OrderEmailItem[];
  createdAt?: string;
};
