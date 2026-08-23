"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/components/providers/CartProvider";

export function CartNavButton() {
  const { itemsCount } = useCart();

  return (
    <Link
      href="/menu/cart"
      aria-label={
        itemsCount === 1
          ? "Ver carrito, 1 producto"
          : `Ver carrito, ${itemsCount} productos`
      }
      className="inline-flex items-center gap-2 rounded-full bg-light-beige px-4 py-2 text-sm font-medium text-royal-blue transition-[background-color,transform] duration-200 hover:bg-cream-white active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-light-beige"
    >
      <ShoppingCart className="size-4" aria-hidden="true" />
      <span className="font-data text-sm leading-none">{itemsCount}</span>
    </Link>
  );
}
