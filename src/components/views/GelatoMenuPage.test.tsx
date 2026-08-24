import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GelatoMenuPage from "@/components/views/GelatoMenuPage";
import type { Flavor } from "@/lib/types";

const addItemMock = vi.fn();
let cartItems: Array<{
  id: string;
  flavorId: string;
  flavorName: string;
  presentation: "1/2 litro" | "1 litro";
  price: number;
}> = [];

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
    items: cartItems,
  }),
}));

const flavors: Flavor[] = [
  {
    _id: "507f1f77bcf86cd799439011",
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
    cartItems = [];
    vi.useRealTimers();
  });

  it("stops additions at the managed inventory snapshot", () => {
    cartItems = [
      {
        id: "cart-1",
        flavorId: flavors[0]._id,
        flavorName: flavors[0].name,
        presentation: "1 litro",
        price: 280,
      },
    ];

    render(
      <GelatoMenuPage
        flavors={[
          {
            ...flavors[0],
            inventoryManaged: true,
            availableQuantities: { halfLiter: 0, liter: 1 },
            availablePresentations: ["1 litro"],
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Máximo disponible de Pistache en el carrito",
      }),
    ).toBeDisabled();
  });

  it("shows temporary added feedback after adding a flavor", () => {
    vi.useFakeTimers();

    const { unmount } = render(<GelatoMenuPage flavors={flavors} />);

    const button = screen.getByRole("button", {
      name: "Agregar Pistache al carrito",
    });

    fireEvent.click(button);

    expect(addItemMock).toHaveBeenCalledWith({
      flavorId: "507f1f77bcf86cd799439011",
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

  it("defaults to the only presentation a flavor sells", () => {
    render(
      <GelatoMenuPage
        flavors={[
          {
            ...flavors[0],
            name: "Pistache con kataifi",
            price: { halfLiter: 160, liter: 280 },
            availablePresentations: ["1/2 litro"],
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Agregar Pistache con kataifi al carrito",
      }),
    );

    expect(addItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        flavorName: "Pistache con kataifi",
        presentation: "1/2 litro",
        price: 160,
      }),
    );
  });
});
