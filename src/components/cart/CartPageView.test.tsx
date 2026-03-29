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
});
