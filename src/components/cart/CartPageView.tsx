"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { Button } from "@/components/ui/button";
import { formatMXN } from "@/lib/pricing";

export function CartPageView() {
  const { items, removeItem, formattedTotalPrice, itemsCount, clearCart } =
    useCart();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const emailIsValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email],
  );

  async function handleCreateOrder() {
    if (items.length === 0 || !emailIsValid) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const customerEmail = email.trim().toLowerCase();

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerEmail,
          items: items.map((item) => ({
            flavorName: item.flavorName,
            presentation: item.presentation,
            quantity: 1,
            unitPrice: item.price,
          })),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message ?? "No fue posible crear el pedido.");
      }

      clearCart();
      setSuccessMessage(
        "Pedido creado. Te enviaremos un correo con instrucciones de pago.",
      );
      setEmail("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Error al crear el pedido.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream-white px-6 py-12 text-oxford-black">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-ochre">
              Carrito
            </p>
            <h1 className="mt-2 text-4xl font-serif text-royal-blue">
              Tu pedido
            </h1>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/menu">Volver al menu</Link>
          </Button>
        </div>

        <div className="mt-8 space-y-4">
          {items.length === 0 ? (
            <div className="rounded-3xl border border-ochre/20 bg-white p-6 text-sm text-oxford-black/70">
              Tu carrito esta vacio.
            </div>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-ochre/20 bg-white p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-serif text-royal-blue">
                      {item.flavorName}
                    </h2>
                    <p className="text-sm text-oxford-black/70">
                      {item.presentation}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-numeric text-sm text-royal-blue">
                      {formatMXN(item.price)}
                    </span>
                    <Button
                      variant="ghost"
                      className="h-11 text-wine-red hover:bg-wine-red/10 hover:text-wine-red"
                      onClick={() => removeItem(item.id)}
                    >
                      Quitar
                    </Button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="mt-8 rounded-3xl border border-royal-blue/20 bg-white p-6">
          <div className="flex items-center justify-between text-sm text-oxford-black/70">
            <span>Items</span>
            <span className="font-numeric">{itemsCount}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg text-royal-blue">Total</span>
            <span className="font-numeric text-2xl text-royal-blue">
              {formattedTotalPrice}
            </span>
          </div>

          <div className="mt-6 space-y-3">
            <label
              htmlFor="checkout-email"
              className="block text-xs uppercase tracking-[0.25em] text-ochre"
            >
              Email para confirmar pedido
            </label>
            <input
              id="checkout-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              className="h-11 w-full rounded-full border border-ochre/30 bg-white px-4 text-sm outline-none transition focus:border-royal-blue focus:ring-2 focus:ring-royal-blue/20"
            />
            <Button
              type="button"
              disabled={!emailIsValid || items.length === 0 || isSubmitting}
              className="h-11 w-full rounded-full bg-royal-blue text-light-beige hover:bg-royal-blue/90"
              onClick={handleCreateOrder}
            >
              {isSubmitting ? "Creando pedido..." : "Realizar pedido"}
            </Button>
            {errorMessage ? (
              <p className="text-sm text-wine-red">{errorMessage}</p>
            ) : null}
            {successMessage ? (
              <p className="text-sm text-royal-blue">{successMessage}</p>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
