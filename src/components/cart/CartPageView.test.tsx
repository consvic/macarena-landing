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
      addItem: vi.fn(),
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
      addItem: vi.fn(),
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
      json: () => Promise.resolve({}),
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
      addItem: vi.fn(),
      removeItem: vi.fn(),
      clearCart,
    });

    render(<CartPageView />);

    await userEvent.type(
      screen.getByLabelText("Email para confirmar pedido"),
      "Cliente@Correo.com",
    );
    await userEvent.type(
      screen.getByLabelText("Teléfono (opcional)"),
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

  it("groups repeats of the same flavor and presentation into one line", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", fetchMock);
    useCartMock.mockReturnValue({
      items: [
        {
          id: "1",
          flavorName: "Mango Maracuya",
          presentation: "1 litro",
          price: 280,
        },
        {
          id: "2",
          flavorName: "Mango Maracuya",
          presentation: "1 litro",
          price: 280,
        },
        {
          id: "3",
          flavorName: "Coco",
          presentation: "1 litro",
          price: 280,
        },
      ],
      itemsCount: 3,
      formattedTotalPrice: "$840.00",
      addItem: vi.fn(),
      removeItem: vi.fn(),
      clearCart: vi.fn(),
    });

    render(<CartPageView />);

    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(2);
    expect(
      screen.getByLabelText("Quitar un Mango Maracuya de 1 litro"),
    ).toBeInTheDocument();

    await userEvent.type(
      screen.getByLabelText("Email para confirmar pedido"),
      "cliente@correo.com",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Realizar pedido" }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/orders",
      expect.objectContaining({
        body: JSON.stringify({
          customerEmail: "cliente@correo.com",
          items: [
            {
              flavorName: "Mango Maracuya",
              presentation: "1 litro",
              quantity: 2,
              unitPrice: 280,
            },
            {
              flavorName: "Coco",
              presentation: "1 litro",
              quantity: 1,
              unitPrice: 280,
            },
          ],
        }),
      }),
    );
  });

  it("shows an inline error for an invalid email on blur", async () => {
    useCartMock.mockReturnValue({
      items: [],
      itemsCount: 0,
      formattedTotalPrice: "$0.00",
      addItem: vi.fn(),
      removeItem: vi.fn(),
      clearCart: vi.fn(),
    });

    render(<CartPageView />);

    const input = screen.getByLabelText("Email para confirmar pedido");
    await userEvent.type(input, "correo-invalido");
    await userEvent.tab();

    expect(await screen.findByText(/Escribe un correo válido/)).toBeVisible();
    expect(input).toHaveAttribute("aria-invalid", "true");
  });
});
