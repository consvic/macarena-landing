"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { formatMXN } from "@/lib/pricing";
import type { CartItem, PresentationOption } from "@/lib/types";

type NewCartItem = {
  flavorName: string;
  presentation: PresentationOption;
  price: number;
};

type CartContextValue = {
  items: CartItem[];
  itemsCount: number;
  totalPrice: number;
  formattedTotalPrice: string;
  addItem: (item: NewCartItem) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
};

const CART_STORAGE_KEY = "macarena:cart:v1";

const CartContext = createContext<CartContextValue | null>(null);

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as CartItem[];
      if (Array.isArray(parsed)) {
        setItems(parsed);
      }
    } catch {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: NewCartItem) => {
    setItems((previous) => [
      ...previous,
      {
        id: createId(),
        ...item,
      },
    ]);
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((previous) => previous.filter((item) => item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemsCount = items.length;
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      itemsCount,
      totalPrice,
      formattedTotalPrice: formatMXN(totalPrice),
      addItem,
      removeItem,
      clearCart,
    }),
    [addItem, clearCart, items, itemsCount, removeItem, totalPrice],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
