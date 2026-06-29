import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminOrdersPage } from "@/components/admin/AdminOrdersPage";
import type { OrderStatus } from "@/lib/types";

type TestOrder = {
  _id: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  totalPrice: number;
  itemCount: number;
  createdAt: string;
};

const pendingOrder = {
  _id: "order-1",
  customerName: "Ana Gomez",
  customerEmail: "ana@example.com",
  status: "pending_confirmation",
  totalPrice: 320,
  itemCount: 2,
  createdAt: "2026-06-28T12:00:00.000Z",
} satisfies TestOrder;

function ordersResponse(data: TestOrder[]) {
  return {
    data,
    pagination: {
      page: 1,
      limit: 20,
      total: data.length,
      totalPages: 1,
    },
  };
}

function jsonResponse(payload: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
    status: 200,
    ...init,
  });
}

function patchStatusCalls(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.filter(
    ([url, init]) =>
      String(url) === "/api/admin/orders/order-1/status" &&
      (init as RequestInit | undefined)?.method === "PATCH",
  );
}

function mockAdminOrdersFetch(initialOrders: TestOrder[]) {
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url === "/api/admin/orders?page=1&limit=20") {
      return Promise.resolve(jsonResponse(ordersResponse(initialOrders)));
    }

    if (
      url === "/api/admin/orders/order-1/status" &&
      init?.method === "PATCH"
    ) {
      return Promise.resolve(jsonResponse({}));
    }

    return Promise.resolve(
      jsonResponse({ message: "Not found" }, { status: 404 }),
    );
  });
}

describe("AdminOrdersPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("requires confirmation before cancelling an order", async () => {
    const user = userEvent.setup();
    const fetchMock = mockAdminOrdersFetch([pendingOrder]);

    vi.stubGlobal("fetch", fetchMock);

    render(<AdminOrdersPage />);

    await screen.findByText("Ana Gomez");

    await user.click(screen.getByRole("button", { name: /^Cancelar$/ }));

    expect(
      screen.getByRole("dialog", { name: "Cancelar pedido?" }),
    ).toBeInTheDocument();
    expect(patchStatusCalls(fetchMock)).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Volver" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Cancelar$/ }));
    await user.click(screen.getByRole("button", { name: "Cancelar pedido" }));

    await waitFor(() => {
      expect(patchStatusCalls(fetchMock)).toHaveLength(1);
    });

    const patchCall = patchStatusCalls(fetchMock)[0];

    expect(JSON.parse(String(patchCall?.[1]?.body))).toEqual({
      status: "cancelled",
    });
  });

  it("advances orders through confirmed, paid, and delivered states", async () => {
    const user = userEvent.setup();
    const fetchMock = mockAdminOrdersFetch([pendingOrder]);

    vi.stubGlobal("fetch", fetchMock);

    render(<AdminOrdersPage />);

    await screen.findByText("Ana Gomez");

    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    await screen.findByRole("button", { name: "Pagado" });

    await user.click(screen.getByRole("button", { name: "Pagado" }));
    await screen.findByRole("button", { name: "Entregado" });

    await user.click(screen.getByRole("button", { name: "Entregado" }));

    await waitFor(() => {
      expect(patchStatusCalls(fetchMock)).toHaveLength(3);
    });

    expect(
      patchStatusCalls(fetchMock).map(([, init]) =>
        JSON.parse(String((init as RequestInit | undefined)?.body)),
      ),
    ).toEqual([
      { status: "confirmed" },
      { status: "paid" },
      { status: "delivered" },
    ]);
    expect(
      screen.queryByRole("button", { name: "Entregado" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Cancelar$/ }),
    ).not.toBeInTheDocument();
  });
});
