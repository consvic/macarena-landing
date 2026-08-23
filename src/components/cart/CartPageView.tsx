"use client";

import { Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { NumericNoteText } from "@/components/NumericNoteText";
import { useCart } from "@/components/providers/CartProvider";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader, SiteHeaderCta } from "@/components/site/SiteHeader";
import { Button } from "@/components/ui/button";
import { formatMXN } from "@/lib/pricing";
import type { CartItem } from "@/lib/types";

type CartLine = {
  key: string;
  flavorName: string;
  presentation: CartItem["presentation"];
  price: number;
  /** Every cart entry in this line, newest last; used to add or drop one unit. */
  itemIds: string[];
};

/** Collapses repeat additions of the same flavor + presentation into one line. */
function groupCartItems(items: CartItem[]): CartLine[] {
  const lines = new Map<string, CartLine>();

  for (const item of items) {
    const key = `${item.flavorName}|${item.presentation}|${item.price}`;
    const line = lines.get(key);
    if (line) {
      line.itemIds.push(item.id);
      continue;
    }

    lines.set(key, {
      key,
      flavorName: item.flavorName,
      presentation: item.presentation,
      price: item.price,
      itemIds: [item.id],
    });
  }

  return [...lines.values()];
}

export function CartPageView() {
  const {
    items,
    addItem,
    removeItem,
    formattedTotalPrice,
    itemsCount,
    clearCart,
  } = useCart();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailError, setShowEmailError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const emailIsValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email],
  );
  const cartLines = useMemo(() => groupCartItems(items), [items]);
  const hasCartItems = itemsCount > 0;
  const canSubmitOrder = hasCartItems && emailIsValid && !isSubmitting;
  const emailErrorId = "checkout-email-error";

  async function handleCreateOrder() {
    if (!canSubmitOrder) {
      setShowEmailError(!emailIsValid);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const customerEmail = email.trim().toLowerCase();
    const customerPhone = phone.trim();

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerEmail,
          ...(customerPhone ? { customerPhone } : {}),
          items: cartLines.map((line) => ({
            flavorName: line.flavorName,
            presentation: line.presentation,
            quantity: line.itemIds.length,
            unitPrice: line.price,
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
      setPhone("");
      setShowEmailError(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Error al crear el pedido.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-cream-white text-oxford-black">
      <SiteHeader
        action={<SiteHeaderCta href="/menu">Ver menú</SiteHeaderCta>}
      />

      <main className="container mx-auto max-w-4xl px-6 py-16">
        <h1 className="font-serif text-4xl font-bold text-royal-blue md:text-5xl">
          Tu pedido
        </h1>

        <div className="mt-8 space-y-4">
          {cartLines.length === 0 ? (
            <div className="rounded-3xl border border-ochre/20 bg-white p-8 text-center">
              <p className="text-oxford-black/75">Tu carrito está vacío.</p>
              <Link
                href="/menu"
                className="mt-5 inline-block rounded-full bg-royal-blue px-8 py-3 text-base font-medium text-light-beige transition-[background-color,transform] duration-200 hover:bg-royal-blue/90 hover:-translate-y-px active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
              >
                Ver menú
              </Link>
            </div>
          ) : (
            cartLines.map((line) => {
              const quantity = line.itemIds.length;

              return (
                <article
                  key={line.key}
                  className="rounded-3xl border border-ochre/20 bg-white p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="font-serif text-xl text-royal-blue">
                        {line.flavorName}
                      </h2>
                      <p className="text-sm text-oxford-black/75">
                        <NumericNoteText text={line.presentation} />
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 rounded-full border border-royal-blue/20 p-1">
                        <button
                          type="button"
                          aria-label={`Quitar un ${line.flavorName} de ${line.presentation}`}
                          className="inline-flex size-9 items-center justify-center rounded-full text-royal-blue transition-[background-color,transform] duration-150 ease-out-strong hover:bg-royal-blue/10 active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
                          onClick={() =>
                            removeItem(line.itemIds[line.itemIds.length - 1])
                          }
                        >
                          <Minus className="size-4" aria-hidden="true" />
                        </button>
                        <span
                          aria-live="polite"
                          className="min-w-8 text-center font-data text-sm text-royal-blue"
                        >
                          {quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Agregar otro ${line.flavorName} de ${line.presentation}`}
                          className="inline-flex size-9 items-center justify-center rounded-full text-royal-blue transition-[background-color,transform] duration-150 ease-out-strong hover:bg-royal-blue/10 active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
                          onClick={() =>
                            addItem({
                              flavorName: line.flavorName,
                              presentation: line.presentation,
                              price: line.price,
                            })
                          }
                        >
                          <Plus className="size-4" aria-hidden="true" />
                        </button>
                      </div>

                      <span className="animate-value-tick font-data text-sm text-royal-blue">
                        {formatMXN(line.price * quantity)}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="mt-8 rounded-3xl border border-royal-blue/20 bg-white p-6">
          <div className="flex items-center justify-between text-sm text-oxford-black/75">
            <span>Productos</span>
            <span className="animate-value-tick font-data" key={itemsCount}>
              {itemsCount}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg text-royal-blue">Total</span>
            <span
              className="animate-value-tick font-data text-2xl text-royal-blue"
              key={formattedTotalPrice}
            >
              {formattedTotalPrice}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="checkout-email"
                className="block text-sm font-medium text-royal-blue"
              >
                Email para confirmar pedido
              </label>
              <input
                id="checkout-email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                aria-invalid={showEmailError && !emailIsValid}
                aria-describedby={
                  showEmailError && !emailIsValid ? emailErrorId : undefined
                }
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (showEmailError) {
                    setShowEmailError(false);
                  }
                }}
                onBlur={() => setShowEmailError(email.trim().length > 0)}
                placeholder="cliente@correo.com"
                className="h-11 w-full rounded-full border border-ochre/40 bg-white px-4 font-data text-sm outline-none transition-[border-color,box-shadow] duration-200 focus-visible:border-royal-blue focus-visible:ring-2 focus-visible:ring-royal-blue/20 aria-[invalid=true]:border-wine-red"
              />
              {showEmailError && !emailIsValid ? (
                <p id={emailErrorId} className="text-sm text-wine-red">
                  Escribe un correo válido, por ejemplo cliente@correo.com
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label
                htmlFor="checkout-phone"
                className="block text-sm font-medium text-royal-blue"
              >
                Teléfono (opcional)
              </label>
              <input
                id="checkout-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+52 55 0000 0000"
                className="h-11 w-full rounded-full border border-ochre/40 bg-white px-4 font-data text-sm outline-none transition-[border-color,box-shadow] duration-200 focus-visible:border-royal-blue focus-visible:ring-2 focus-visible:ring-royal-blue/20"
              />
            </div>
            <Button
              type="button"
              disabled={!canSubmitOrder}
              className="h-11 w-full rounded-full bg-royal-blue text-light-beige transition-[background-color,transform] duration-150 ease-out-strong hover:bg-royal-blue/90 active:scale-[0.98]"
              onClick={handleCreateOrder}
            >
              {isSubmitting ? "Creando pedido…" : "Realizar pedido"}
            </Button>
            <div aria-live="polite">
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

      <SiteFooter />
    </div>
  );
}
