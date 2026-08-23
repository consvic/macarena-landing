import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartPageView } from "@/components/cart/CartPageView";

const useCartMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/providers/CartProvider", () => ({
  useCart: () => useCartMock(),
}));

describe("CartPageView checkout validation", () => {
  beforeEach(() => {
    useCartMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("keeps order button disabled when cart is empty", async () => {
    useCartMock.mockReturnValue({
      items: [],
      itemsCount: 0,
      formattedTotalPrice: "$0.00",
      removeItem: vi.fn(),
      clearCart: vi.fn(),
    });

    render(<CartPageView />);

    const input = screen.getByLabelText("Email para confirmar pedido");
    await userEvent.type(input, "cliente@correo.com");

    expect(
      screen.getByRole("button", { name: "Realizar pedido" }),
    ).toBeDisabled();
  });

  it("enables order button only with items and valid email", async () => {
    useCartMock.mockReturnValue({
      items: [
        {
          id: "1",
          flavorName: "Mango Maracuya",
          presentation: "1/2 litro",
          price: 150,
        },
      ],
      itemsCount: 1,
      formattedTotalPrice: "$150.00",
      removeItem: vi.fn(),
      clearCart: vi.fn(),
    });

    render(<CartPageView />);

    const button = screen.getByRole("button", { name: "Realizar pedido" });
    expect(button).toBeDisabled();

    const input = screen.getByLabelText("Email para confirmar pedido");
    await userEvent.type(input, "correo-invalido");
    expect(button).toBeDisabled();

    await userEvent.clear(input);
    await userEvent.type(input, "cliente@correo.com");
    expect(button).toBeEnabled();
  });

  it("sends the optional phone number when creating an order", async () => {
    const clearCart = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ _id: "pedido-123", totalPrice: 150 }),
    });
    vi.stubGlobal("fetch", fetchMock);
    useCartMock.mockReturnValue({
      items: [
        {
          id: "1",
          flavorName: "Mango Maracuya",
          presentation: "1/2 litro",
          price: 150,
        },
      ],
      itemsCount: 1,
      formattedTotalPrice: "$150.00",
      removeItem: vi.fn(),
      clearCart,
    });

    render(<CartPageView />);

    await userEvent.type(
      screen.getByLabelText("Email para confirmar pedido"),
      "Cliente@Correo.com",
    );
    await userEvent.type(
      screen.getByLabelText("Telefono (opcional)"),
      "  +52 55 1234 5678  ",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Realizar pedido" }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/orders",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          customerEmail: "cliente@correo.com",
          customerPhone: "+52 55 1234 5678",
          items: [
            {
              flavorName: "Mango Maracuya",
              presentation: "1/2 litro",
              quantity: 1,
              unitPrice: 150,
            },
          ],
        }),
      }),
    );
    expect(clearCart).toHaveBeenCalled();
  });

  it("shows payment instructions after creating an order", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ _id: "pedido-123", totalPrice: 150 }),
      }),
    );
    useCartMock.mockReturnValue({
      items: [
        {
          id: "1",
          flavorName: "Mango Maracuya",
          presentation: "1/2 litro",
          price: 150,
        },
      ],
      itemsCount: 1,
      formattedTotalPrice: "$150.00",
      removeItem: vi.fn(),
      clearCart: vi.fn(),
    });

    render(
      <CartPageView
        paymentDetails={{
          accountName: "Macarena Gelateria",
          bankClabe: "123456789012345678",
          bankReference: "PEDIDO-MACARENA",
          receiptPhone: "+52 55 1234 5678",
        }}
      />,
    );

    await userEvent.type(
      screen.getByLabelText("Email para confirmar pedido"),
      "cliente@correo.com",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Realizar pedido" }),
    );

    expect(
      screen.getByRole("heading", { name: "¡Gracias por tu pedido!" }),
    ).toBeInTheDocument();
    expect(screen.getByText("$150.00")).toBeInTheDocument();
    expect(screen.getByText("123456789012345678")).toBeInTheDocument();
    expect(screen.getByText("+52 55 1234 5678")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Enviar comprobante por WhatsApp" }),
    ).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/525512345678?text="),
    );
  });
});
