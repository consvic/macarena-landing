import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GelatoMenuPage from "@/components/views/GelatoMenuPage";
import type { Flavor } from "@/lib/types";

const addItemMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/cart/CartNavButton", () => ({
  CartNavButton: () => <a href="/menu/cart">Carrito</a>,
}));

vi.mock("@/components/providers/CartProvider", () => ({
  useCart: () => ({
    addItem: addItemMock,
  }),
}));

const flavors: Flavor[] = [
  {
    name: "Pistache",
    description: "Cremoso con nuez tostada.",
    category: "Clasico",
    base: "Crema",
    tags: ["nuez"],
    price: {
      halfLiter: 150,
      liter: 280,
    },
    allergens: "Contiene leche y nuez.",
    gradient: "from-ochre/20 to-royal-blue/20",
    coverImage: "/flavor-images/pistache.png",
    exists: true,
  },
];

describe("GelatoMenuPage", () => {
  afterEach(() => {
    addItemMock.mockReset();
    vi.useRealTimers();
  });

  it("shows temporary added feedback after adding a flavor", () => {
    vi.useFakeTimers();

    const { unmount } = render(<GelatoMenuPage flavors={flavors} />);

    const button = screen.getByRole("button", {
      name: "Agregar Pistache al carrito",
    });

    fireEvent.click(button);

    expect(addItemMock).toHaveBeenCalledWith({
      flavorName: "Pistache",
      presentation: "1 litro",
      price: 280,
    });
    expect(button).toHaveTextContent("Agregado");

    act(() => {
      vi.advanceTimersByTime(1999);
    });

    expect(button).toHaveTextContent("Agregado");

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(button).toHaveTextContent("Agregar");

    unmount();
  });
});
