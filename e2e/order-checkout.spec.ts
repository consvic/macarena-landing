import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "macarena:cart:v1",
      JSON.stringify([
        {
          id: "cart-item-1",
          flavorId: "507f1f77bcf86cd799439011",
          flavorName: "Mango Maracuya",
          presentation: "1/2 litro",
          price: 150,
        },
      ]),
    );
  });
});

test("submits checkout and shows payment instructions without creating an order", async ({
  page,
}) => {
  const orderRequest = page.waitForRequest(
    (request) =>
      request.url().endsWith("/api/orders") && request.method() === "POST",
  );
  await page.route("**/api/orders", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ _id: "pedido-e2e-123", totalPrice: 150 }),
    });
  });

  await page.goto("/menu/cart");
  await expect(page.getByRole("heading", { name: "Tu pedido" })).toBeVisible();
  await expect(page.getByText("Mango Maracuya")).toBeVisible();

  await page.getByLabel("Nombre para el pedido").fill("Ana López");
  await page
    .getByLabel("Email para confirmar pedido")
    .fill("Cliente@Correo.com");
  await page.getByLabel("Telefono (opcional)").fill("+52 55 9876 5432");
  await page.getByRole("button", { name: "Realizar pedido" }).click();

  expect((await orderRequest).postDataJSON()).toEqual({
    customerName: "Ana López",
    customerEmail: "cliente@correo.com",
    customerPhone: "+52 55 9876 5432",
    items: [
      {
        flavorId: "507f1f77bcf86cd799439011",
        flavorName: "Mango Maracuya",
        presentation: "1/2 litro",
        quantity: 1,
      },
    ],
  });

  await expect(
    page.getByRole("heading", { name: "¡Gracias por tu pedido!" }),
  ).toBeFocused();
  await expect(page.getByText("$150.00")).toBeVisible();
  await expect(page.getByText("123456789012345678")).toBeVisible();
  await expect(page.getByText("+52 55 1234 5678")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Enviar comprobante por WhatsApp" }),
  ).toHaveAttribute(
    "href",
    /https:\/\/wa\.me\/525512345678\?text=.*pedido-e2e-123.*150/,
  );
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("macarena:cart:v1")))
    .toBe("[]");
});

test("keeps the cart intact when order creation fails", async ({ page }) => {
  await page.route("**/api/orders", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "No fue posible crear el pedido." }),
    });
  });

  await page.goto("/menu/cart");
  await page.getByLabel("Nombre para el pedido").fill("Ana López");
  await page
    .getByLabel("Email para confirmar pedido")
    .fill("cliente@correo.com");
  await page.getByRole("button", { name: "Realizar pedido" }).click();

  await expect(page.getByText("No fue posible crear el pedido.")).toBeVisible();
  await expect(page.getByText("Mango Maracuya")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Realizar pedido" }),
  ).toBeEnabled();
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem("macarena:cart:v1") ?? "null"),
      ),
    )
    .toEqual([
      {
        id: "cart-item-1",
        flavorId: "507f1f77bcf86cd799439011",
        flavorName: "Mango Maracuya",
        presentation: "1/2 litro",
        price: 150,
      },
    ]);
});

test("lists every item that became unavailable at checkout", async ({
  page,
}) => {
  await page.route("**/api/orders", async (route) => {
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Algunos sabores ya no tienen disponibilidad suficiente.",
        unavailableItems: [
          {
            flavorId: "507f1f77bcf86cd799439011",
            flavorName: "Mango Maracuya",
            presentation: "1/2 litro",
          },
        ],
      }),
    });
  });

  await page.goto("/menu/cart");
  await page.getByLabel("Nombre para el pedido").fill("Ana López");
  await page
    .getByLabel("Email para confirmar pedido")
    .fill("cliente@correo.com");
  await page.getByRole("button", { name: "Realizar pedido" }).click();

  await expect(page.getByText("1/2 litro de Mango Maracuya")).toBeVisible();
  await expect(page.getByText("Mango Maracuya").first()).toBeVisible();
});
