import { renderHook } from "@testing-library/react";
import { act, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider, useCart } from "@/components/providers/CartProvider";

function wrapper({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

const STORAGE_KEY = "macarena:cart:v1";

describe("CartProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts with an empty cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toEqual([]);
    expect(result.current.itemsCount).toBe(0);
    expect(result.current.totalPrice).toBe(0);
  });

  it("adds an item to the cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        flavorName: "Mango",
        presentation: "1/2 litro",
        price: 150,
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].flavorName).toBe("Mango");
    expect(result.current.items[0].price).toBe(150);
    expect(result.current.items[0].id).toBeDefined();
    expect(result.current.totalPrice).toBe(150);
  });

  it("removes an item from the cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        flavorName: "Mango",
        presentation: "1/2 litro",
        price: 150,
      });
    });

    const itemId = result.current.items[0].id;

    act(() => {
      result.current.removeItem(itemId);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it("clears all items", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        flavorName: "Mango",
        presentation: "1/2 litro",
        price: 150,
      });
      result.current.addItem({
        flavorName: "Coco",
        presentation: "1 litro",
        price: 280,
      });
    });

    expect(result.current.items).toHaveLength(2);

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
  });

  it("hydrates cart from localStorage", () => {
    const savedCart = [
      { id: "saved-1", flavorName: "Mango", presentation: "1/2 litro", price: 150 },
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCart));

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toEqual(savedCart);
    expect(result.current.totalPrice).toBe(150);
  });

  it("persists cart to localStorage after adding items", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        flavorName: "Mango",
        presentation: "1/2 litro",
        price: 150,
      });
    });

    const stored = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "[]",
    );
    expect(stored).toHaveLength(1);
    expect(stored[0].flavorName).toBe("Mango");
  });

  it("does not overwrite saved cart with empty array on mount", () => {
    const savedCart = [
      { id: "saved-1", flavorName: "Mango", presentation: "1/2 litro", price: 150 },
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCart));

    renderHook(() => useCart(), { wrapper });

    const stored = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "[]",
    );
    expect(stored).toHaveLength(1);
    expect(stored[0].flavorName).toBe("Mango");
  });

  it("recovers from corrupt localStorage data", () => {
    window.localStorage.setItem(STORAGE_KEY, "not-valid-json{{{");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to restore cart"),
    );
    warnSpy.mockRestore();
  });

  it("throws when useCart is used outside CartProvider", () => {
    expect(() => {
      renderHook(() => useCart());
    }).toThrow("useCart must be used inside CartProvider");
  });
});
