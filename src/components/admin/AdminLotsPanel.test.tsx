import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminLotsPanel } from "@/components/admin/AdminLotsPanel";

const FLAVOR_ID = "507f1f77bcf86cd799439011";
const LOT_ID = "507f191e810c19729de860ea";

function response(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const lot = {
  _id: LOT_ID,
  flavorId: FLAVOR_ID,
  packed: { halfLiter: 3, liter: 2 },
  remaining: { halfLiter: 2, liter: 2 },
  adjustments: [],
  createdBy: "admin@macarena.mx",
  createdAt: "2026-08-23T12:00:00.000Z",
};

describe("AdminLotsPanel", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("creates the first lot and refreshes totals", async () => {
    let getCount = 0;
    const onInventoryChange = vi.fn();
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST")
        return Promise.resolve(response({ _id: LOT_ID }, 201));
      getCount += 1;
      return Promise.resolve(
        response(
          getCount === 1
            ? { data: [], totals: { halfLiter: 0, liter: 0 } }
            : { data: [lot], totals: { halfLiter: 2, liter: 2 } },
        ),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AdminLotsPanel
        flavorId={FLAVOR_ID}
        flavorName="Mango"
        onInventoryChange={onInventoryChange}
      />,
    );
    await screen.findByText(/aún usa disponibilidad sin inventario/i);
    await userEvent.type(screen.getByLabelText("Cantidad 1/2 litro"), "3");
    await userEvent.type(screen.getByLabelText("Cantidad 1 litro"), "2");
    await userEvent.click(screen.getByRole("button", { name: "Crear lote" }));

    await screen.findByText("Disponibles: 2 × 1/2 L · 2 × 1 L");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/lots",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          flavorId: FLAVOR_ID,
          halfLiter: "3",
          liter: "2",
        }),
      }),
    );
    expect(onInventoryChange).toHaveBeenCalledWith({ halfLiter: 2, liter: 2 });
  });

  it("submits a signed adjustment with its audit reason", async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") return Promise.resolve(response(lot));
      return Promise.resolve(
        response({ data: [lot], totals: { halfLiter: 2, liter: 2 } }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AdminLotsPanel
        flavorId={FLAVOR_ID}
        flavorName="Mango"
        onInventoryChange={vi.fn()}
      />,
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Ajustar" }),
    );
    await userEvent.type(screen.getByLabelText("Ajuste de medio litro"), "-1");
    await userEvent.type(screen.getByLabelText("Motivo del ajuste"), "Merma");
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar ajuste" }),
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/admin/lots/${LOT_ID}/adjustments`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ halfLiter: "-1", liter: "", reason: "Merma" }),
        }),
      ),
    );
  });
});
