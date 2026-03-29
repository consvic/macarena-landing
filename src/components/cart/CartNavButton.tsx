"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/components/providers/CartProvider";
import { Button } from "@/components/ui/button";

export function CartNavButton() {
  const { itemsCount } = useCart();

  return (
    <Button
      asChild
      variant="outline"
      className="h-11 rounded-full border-royal-blue/30 px-4 text-royal-blue hover:bg-royal-blue/5"
    >
      <Link href="/menu/cart" aria-label="Ver carrito">
        <ShoppingCart className="size-4" />
        <span className="font-numeric text-[11px] leading-none">
          {itemsCount}
        </span>
      </Link>
    </Button>
  );
}
