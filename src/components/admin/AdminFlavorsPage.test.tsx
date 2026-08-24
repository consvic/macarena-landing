import { act, render, screen, waitFor } from "@testing-library/react";
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
  availablePresentations: ["1/2 litro", "1 litro"],
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

  it("shows flavor details before exposing editable fields", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      if (String(input) === "/api/admin/flavors") {
        return Promise.resolve(jsonResponse([FLAVOR]));
      }
      if (String(input).startsWith("/api/admin/lots?")) {
        return Promise.resolve(
          jsonResponse({ data: [], totals: { halfLiter: 0, liter: 0 } }),
        );
      }
      return Promise.resolve(jsonResponse({ date: "2026-08-22", entries: [] }));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminFlavorsPage />);

    await userEvent.click(
      await screen.findByRole("button", { name: /Mango Frutal/ }),
    );

    expect(screen.getByText("Detalle del sabor")).toBeInTheDocument();
    expect(screen.getByText("Precio 1/2 litro")).toHaveClass("font-data");
    expect(screen.getByText("Precio 1 litro")).toHaveClass("font-data");
    expect(screen.getByText(/150\.00/)).toBeInTheDocument();
    expect(screen.getByText(/280\.00/)).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Nombre del sabor" }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Editar" }));

    expect(
      screen.getByRole("textbox", { name: "Nombre del sabor" }),
    ).toHaveValue("Mango");
  });

  it("hides the stored price for an unavailable presentation", async () => {
    const halfLiterOnlyFlavor = {
      ...FLAVOR,
      availablePresentations: ["1/2 litro"],
    };
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      if (String(input) === "/api/admin/flavors") {
        return Promise.resolve(jsonResponse([halfLiterOnlyFlavor]));
      }
      if (String(input).startsWith("/api/admin/lots?")) {
        return Promise.resolve(
          jsonResponse({ data: [], totals: { halfLiter: 0, liter: 0 } }),
        );
      }
      return Promise.resolve(jsonResponse({ date: "2026-08-22", entries: [] }));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminFlavorsPage />);

    await userEvent.click(
      await screen.findByRole("button", { name: /Mango Frutal/ }),
    );

    expect(screen.getByText(/150\.00/)).toBeInTheDocument();
    expect(screen.queryByText(/280\.00/)).not.toBeInTheDocument();
    expect(screen.getByText("No disponible")).toBeInTheDocument();
  });

  it("disables both visibility controls while showing their loading state", async () => {
    let resolveVisibility!: (response: Response) => void;
    const visibilityResponse = new Promise<Response>((resolve) => {
      resolveVisibility = resolve;
    });
    const hiddenFlavor = { ...FLAVOR, isVisibleOnSite: false };
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/admin/flavors") {
        return Promise.resolve(jsonResponse([hiddenFlavor]));
      }
      if (url === "/api/admin/production-demand") {
        return Promise.resolve(
          jsonResponse({ date: "2026-08-22", entries: [] }),
        );
      }
      if (url.endsWith("/visibility")) {
        return visibilityResponse;
      }
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminFlavorsPage />);

    await userEvent.click(
      await screen.findByRole("button", { name: "Aceptar pedidos" }),
    );

    const loadingButtons = screen.getAllByRole("button", {
      name: "Actualizando…",
    });
    expect(loadingButtons).toHaveLength(2);
    for (const button of loadingButtons) {
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "true");
    }

    await act(async () => {
      resolveVisibility(jsonResponse({ ...FLAVOR, isVisibleOnSite: true }));
    });

    expect(
      await screen.findByRole("button", { name: "Detener pedidos" }),
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: "Ocultar" })).toBeEnabled();
  });
});
