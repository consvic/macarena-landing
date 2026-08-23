"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { NumericNoteText } from "@/components/NumericNoteText";
import { useCart } from "@/components/providers/CartProvider";
import { Button } from "@/components/ui/button";
import { formatMXN } from "@/lib/pricing";

type PaymentDetails = {
  accountName: string;
  bankClabe: string;
  bankReference: string;
  receiptPhone: string;
};

type OrderConfirmation = {
  _id: string;
  totalPrice: number;
};

const EMPTY_PAYMENT_DETAILS: PaymentDetails = {
  accountName: "",
  bankClabe: "",
  bankReference: "",
  receiptPhone: "",
};

export function CartPageView({
  paymentDetails = EMPTY_PAYMENT_DETAILS,
}: {
  paymentDetails?: PaymentDetails;
}) {
  const { items, removeItem, formattedTotalPrice, itemsCount, clearCart } =
    useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderConfirmation, setOrderConfirmation] =
    useState<OrderConfirmation | null>(null);
  const confirmationHeadingRef = useRef<HTMLHeadingElement>(null);

  const emailIsValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email],
  );
  const hasCartItems = itemsCount > 0;
  const canSubmitOrder =
    hasCartItems && name.trim().length > 0 && emailIsValid && !isSubmitting;

  useEffect(() => {
    if (orderConfirmation) {
      confirmationHeadingRef.current?.focus();
    }
  }, [orderConfirmation]);

  async function handleCreateOrder() {
    if (!canSubmitOrder) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const customerName = name.trim();
    const customerEmail = email.trim().toLowerCase();
    const customerPhone = phone.trim();

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          customerEmail,
          ...(customerPhone ? { customerPhone } : {}),
          items: items.map((item) => ({
            flavorId: item.flavorId,
            flavorName: item.flavorName,
            presentation: item.presentation,
            quantity: 1,
          })),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message ?? "No fue posible crear el pedido.");
      }

      const order = (await response.json()) as OrderConfirmation;
      setOrderConfirmation(order);
      clearCart();
      setName("");
      setEmail("");
      setPhone("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Error al crear el pedido.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (orderConfirmation) {
    const whatsappPhone = paymentDetails.receiptPhone.replace(/\D/g, "");
    const whatsappMessage = encodeURIComponent(
      `Hola, quiero enviar el comprobante de pago de mi pedido ${orderConfirmation._id} por ${formatMXN(orderConfirmation.totalPrice)}.`,
    );

    return (
      <main className="min-h-screen bg-cream-white px-6 py-12 text-oxford-black">
        <section className="mx-auto max-w-2xl rounded-3xl border border-royal-blue/20 bg-white p-6 sm:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-ochre">
            Pedido recibido
          </p>
          <h1
            ref={confirmationHeadingRef}
            tabIndex={-1}
            className="mt-2 text-4xl font-serif text-royal-blue"
          >
            ¡Gracias por tu pedido!
          </h1>
          <p className="mt-4 text-oxford-black/70">
            Para confirmarlo, realiza la transferencia por el siguiente total:
          </p>

          <div className="mt-6 rounded-3xl bg-light-beige p-6">
            <p className="text-sm text-oxford-black/70">Total a transferir</p>
            <p className="mt-1 font-data text-3xl text-royal-blue">
              {formatMXN(orderConfirmation.totalPrice)}
            </p>

            <dl className="mt-6 space-y-4 border-t border-ochre/20 pt-6">
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-ochre">
                  Beneficiario
                </dt>
                <dd className="mt-1">{paymentDetails.accountName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-ochre">
                  CLABE
                </dt>
                <dd className="mt-1 font-data">{paymentDetails.bankClabe}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-ochre">
                  Referencia
                </dt>
                <dd className="mt-1 font-data">
                  {paymentDetails.bankReference || orderConfirmation._id}
                </dd>
              </div>
            </dl>
          </div>

          <p className="mt-6 text-oxford-black/70">
            Una vez realizado el pago, envíanos tu comprobante
            {paymentDetails.receiptPhone ? (
              <>
                {" "}
                por WhatsApp al{" "}
                <span className="font-data font-medium text-royal-blue">
                  {paymentDetails.receiptPhone}
                </span>
              </>
            ) : (
              " respondiendo al correo de tu pedido"
            )}
            . Una vez que validemos el pago, podremos confirmar tu pedido.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {whatsappPhone ? (
              <Button
                asChild
                className="h-11 rounded-full bg-royal-blue text-light-beige hover:bg-royal-blue/90"
              >
                <a
                  href={`https://wa.me/${whatsappPhone}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Enviar comprobante por WhatsApp
                </a>
              </Button>
            ) : null}
            <Button asChild variant="outline" className="h-11 rounded-full">
              <Link href="/menu">Volver al menú</Link>
            </Button>
          </div>
        </section>
      </main>
    );
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
                      <NumericNoteText text={item.presentation} />
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-data text-sm text-royal-blue">
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
            <span className="font-data">{itemsCount}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg text-royal-blue">Total</span>
            <span className="font-data text-2xl text-royal-blue">
              {formattedTotalPrice}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="checkout-name"
                className="block text-xs uppercase tracking-[0.25em] text-ochre"
              >
                Nombre para el pedido
              </label>
              <input
                id="checkout-name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nombre completo"
                className="h-11 w-full rounded-full border border-ochre/30 bg-white px-4 text-sm outline-none transition focus-visible:border-royal-blue focus-visible:ring-2 focus-visible:ring-royal-blue/20"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="checkout-email"
                className="block text-xs uppercase tracking-[0.25em] text-ochre"
              >
                Email para confirmar pedido
              </label>
              <input
                id="checkout-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="cliente@correo.com"
                className="h-11 w-full rounded-full border border-ochre/30 bg-white px-4 font-data text-sm outline-none transition focus-visible:border-royal-blue focus-visible:ring-2 focus-visible:ring-royal-blue/20"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="checkout-phone"
                className="block text-xs uppercase tracking-[0.25em] text-ochre"
              >
                Telefono (opcional)
              </label>
              <input
                id="checkout-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="55 0000 0000"
                className="h-11 w-full rounded-full border border-ochre/30 bg-white px-4 font-data text-sm outline-none transition focus-visible:border-royal-blue focus-visible:ring-2 focus-visible:ring-royal-blue/20"
              />
            </div>
            <Button
              type="button"
              disabled={!canSubmitOrder}
              className="h-11 w-full rounded-full bg-royal-blue text-light-beige hover:bg-royal-blue/90"
              onClick={handleCreateOrder}
            >
              {isSubmitting ? "Creando pedido" : "Realizar pedido"}
            </Button>
            {errorMessage ? (
              <p className="text-sm text-wine-red">{errorMessage}</p>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
