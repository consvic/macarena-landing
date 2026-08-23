import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminFlavorsPage } from "@/components/admin/AdminFlavorsPage";

const FLAVOR = {
  _id: "507f1f77bcf86cd799439011",
  name: "Mango",
  description: "Mango maduro",
  category: "Frutal",
  base: "Agua",
  tags: ["fruta"],
  price: { halfLiter: 150, liter: 280 },
  allergens: "Sin lácteos",
  gradient: "from-ochre to-wine-red",
  coverImage: "/mango.png",
  isVisibleOnSite: true,
  isArchived: false,
};

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("AdminFlavorsPage production demand", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows today's demand and stops new orders from the same row", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/admin/flavors") {
        return Promise.resolve(jsonResponse([FLAVOR]));
      }
      if (url === "/api/admin/production-demand") {
        return Promise.resolve(
          jsonResponse({
            date: "2026-08-22",
            entries: [
              {
                flavorId: FLAVOR._id,
                flavorName: "Mango",
                pendingOrders: 2,
                pendingLiters: 1,
                committedOrders: 5,
                committedLiters: 4,
              },
            ],
          }),
        );
      }
      if (url.endsWith("/visibility") && init?.method === "PATCH") {
        return Promise.resolve(
          jsonResponse({ ...FLAVOR, isVisibleOnSite: false }),
        );
      }
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminFlavorsPage />);

    expect(await screen.findByText("Pendientes: 2 · 1.0L")).toBeInTheDocument();
    expect(screen.getByText("Comprometidos: 5 · 4.0L")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Detener pedidos" }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Aceptar pedidos" }),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/admin/flavors/${FLAVOR._id}/visibility`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ isVisibleOnSite: false }),
      }),
    );
  });
});
