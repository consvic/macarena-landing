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
