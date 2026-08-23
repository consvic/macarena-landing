import { expect, test } from "@playwright/test";

const pendingOrder = {
  _id: "order-e2e-1",
  customerName: "Ana Gomez",
  customerEmail: "ana@example.com",
  status: "pending_confirmation",
  totalPrice: 320,
  itemCount: 1,
  createdAt: "2026-08-23T12:00:00.000Z",
  items: [
    {
      _id: "item-e2e-1",
      flavorName: "Pistache",
      presentation: "1 litro",
      quantity: 1,
      unitPrice: 320,
      subtotal: 320,
    },
  ],
};

test("shows progress while confirming an order", async ({ page }) => {
  let finishStatusUpdate!: () => void;
  const statusUpdateGate = new Promise<void>((resolve) => {
    finishStatusUpdate = resolve;
  });

  await page.route("**/api/admin/orders?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [pendingOrder],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    });
  });
  await page.route("**/api/admin/orders/order-e2e-1/status", async (route) => {
    await statusUpdateGate;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...pendingOrder, status: "confirmed" }),
    });
  });

  await page.goto("/admin/pedidos");

  const statusSelect = page.getByRole("combobox", {
    name: "Cambiar estado del pedido de Ana Gomez",
  });
  await expect(statusSelect).toHaveValue("pending_confirmation");
  await statusSelect.selectOption("confirmed");

  await expect(page.getByRole("status")).toHaveText(
    "Actualizando estado de Ana Gomez",
  );
  await expect(statusSelect).toBeDisabled();

  finishStatusUpdate();

  await expect(statusSelect).toHaveValue("confirmed");
  await expect(statusSelect).toBeEnabled();
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("filters, inspects, paginates, cancels, and imports orders", async ({
  page,
}) => {
  await page.route("**/api/admin/orders?*", async (route) => {
    const url = new URL(route.request().url());
    const pageNumber = Number(url.searchParams.get("page") ?? "1");
    const order =
      pageNumber === 2
        ? { ...pendingOrder, _id: "order-e2e-2", customerName: "Bea Ruiz" }
        : pendingOrder;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [order],
        pagination: { page: pageNumber, limit: 20, total: 2, totalPages: 2 },
      }),
    });
  });
  await page.route("**/api/admin/orders/order-e2e-1/status", async (route) => {
    expect(route.request().postDataJSON()).toEqual({ status: "cancelled" });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...pendingOrder, status: "cancelled" }),
    });
  });
  await page.route("**/api/admin/orders/import", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ importedOrders: 1, importedItems: 2, errors: [] }),
    });
  });

  await page.goto("/admin/pedidos");
  await page.getByText("Ver detalle").click();
  await expect(page.getByText("Pistache")).toBeVisible();

  const searchRequest = page.waitForRequest((request) =>
    request.url().includes("search=Ana"),
  );
  await page.getByLabel("Cliente o email").fill("Ana");
  await searchRequest;

  const statusRequest = page.waitForRequest((request) =>
    request.url().includes("status=confirmed"),
  );
  const statusFilter = page.locator("select").first();
  await statusFilter.selectOption("confirmed");
  await statusRequest;
  await page.getByLabel("Fecha desde").fill("2026-08-01");
  await page.getByLabel("Fecha hasta").fill("2026-08-23");

  await page.getByRole("button", { name: "Limpiar filtros" }).click();
  await expect(page.getByLabel("Cliente o email")).toHaveValue("");
  await expect(statusFilter).toHaveValue("");
  await expect(page.getByLabel("Fecha desde")).toHaveValue("");
  await expect(page.getByLabel("Fecha hasta")).toHaveValue("");

  await page.getByRole("button", { name: "Siguiente" }).click();
  await expect(page.getByText("Bea Ruiz", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Anterior" }).click();
  await expect(page.getByText("Ana Gomez", { exact: true })).toBeVisible();

  await page
    .getByRole("button", { name: "Cancelar pedido de Ana Gomez" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "¿Cancelar pedido?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Volver" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page
    .getByRole("button", { name: "Cancelar pedido de Ana Gomez" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancelar pedido" })
    .click();
  await expect(
    page.getByRole("combobox", {
      name: "Cambiar estado del pedido de Ana Gomez",
    }),
  ).toHaveValue("cancelled");

  await page.getByLabel("Archivo CSV de pedidos históricos").setInputFiles({
    name: "orders.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("external_order_id,ordered_at\norder-1,2026-08-23"),
  });
  await page.getByRole("button", { name: "Importar archivo" }).click();
  await expect(
    page.getByText("Importación completa: 1 pedidos y 2 renglones."),
  ).toBeVisible();
});
