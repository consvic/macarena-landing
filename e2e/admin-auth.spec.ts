import { expect, test } from "@playwright/test";

test("handles login, navigation, and logout", async ({ page }) => {
  await page.route("**/api/admin/auth/login", async (route) => {
    const credentials = route.request().postDataJSON();
    await route.fulfill({
      status: credentials.password === "correct-password" ? 200 : 401,
      contentType: "application/json",
      body: JSON.stringify(
        credentials.password === "correct-password"
          ? { ok: true }
          : { message: "Unauthorized" },
      ),
    });
  });
  await page.route("**/api/admin/orders?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
      }),
    });
  });
  await page.route("**/api/admin/auth/logout", async (route) => {
    await route.fulfill({ status: 200, body: "{}" });
  });

  await page.goto("/admin/login?next=/admin/pedidos");
  await page.getByLabel("Email").fill("admin@macarena.mx");
  const password = page.getByLabel("Password");
  await password.fill("wrong-password");

  await page.getByRole("button", { name: "Mostrar contraseña" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Ocultar contraseña" }).click();
  await expect(password).toHaveAttribute("type", "password");

  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Credenciales inválidas")).toBeVisible();

  await password.fill("correct-password");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/admin\/pedidos$/);
  await expect(
    page.getByRole("heading", { name: "Historial y estado" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Pedidos" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("link", { name: "Resumen" })).not.toHaveAttribute(
    "aria-current",
    "page",
  );

  await expect(page.getByRole("link", { name: "Resumen" })).toHaveAttribute(
    "href",
    "/admin",
  );
  await expect(page.getByRole("link", { name: "Sabores" })).toHaveAttribute(
    "href",
    "/admin/sabores",
  );
  await expect(page.getByRole("link", { name: "Análisis" })).toHaveAttribute(
    "href",
    "/admin/analisis",
  );

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
});
