import { expect, test } from "@playwright/test";

const mango = {
  _id: "flavor-e2e-1",
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

test("creates, edits, publishes, and archives flavors", async ({ page }) => {
  let currentMango = { ...mango };

  await page.route("**/api/admin/flavors", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([currentMango]),
      });
      return;
    }

    const body = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ...body,
        _id: "flavor-e2e-2",
        isVisibleOnSite: true,
        isArchived: false,
      }),
    });
  });
  await page.route("**/api/admin/production-demand", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ date: "2026-08-23", entries: [] }),
    });
  });
  await page.route("**/api/admin/flavors/flavor-e2e-1", async (route) => {
    currentMango = {
      ...currentMango,
      ...route.request().postDataJSON(),
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(currentMango),
    });
  });
  await page.route(
    "**/api/admin/flavors/flavor-e2e-1/visibility",
    async (route) => {
      currentMango = {
        ...currentMango,
        ...route.request().postDataJSON(),
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(currentMango),
      });
    },
  );
  await page.route(
    "**/api/admin/flavors/flavor-e2e-1/archive",
    async (route) => {
      currentMango = {
        ...currentMango,
        ...route.request().postDataJSON(),
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(currentMango),
      });
    },
  );

  await page.goto("/admin/sabores");
  await page.getByRole("button", { name: /Mango Frutal/ }).click();
  await expect(page.getByText("Detalle del sabor")).toBeVisible();

  await page.getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("Descripción del sabor").fill("Mango de temporada");
  await page.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByText("Mango maduro").last()).toBeVisible();

  await page.getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("Descripción del sabor").fill("Mango de temporada");
  await page.getByRole("button", { name: "Actualizar sabor" }).click();
  await expect(page.getByText("Sabor actualizado")).toBeVisible();
  await expect(page.getByText("Mango de temporada").last()).toBeVisible();

  await page.getByRole("button", { name: "Detener pedidos" }).click();
  await expect(
    page.getByRole("button", { name: "Aceptar pedidos" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Archivar" }).click();
  await expect(page.getByRole("button", { name: "Restaurar" })).toBeVisible();
  await page.getByRole("button", { name: "Restaurar" }).click();
  await expect(page.getByRole("button", { name: "Archivar" })).toBeVisible();

  await page.getByRole("button", { name: "Nuevo sabor" }).click();
  await page.getByLabel("Nombre del sabor").fill("Limón");
  await page.getByLabel("Categoría del sabor").fill("Cítrico");
  await page.getByLabel("Descripción del sabor").fill("Limón fresco");
  await page.getByLabel("Tags del sabor separados por coma").fill("cítrico");
  await page.getByLabel("Precio de medio litro").fill("140");
  await page.getByLabel("Precio de un litro").fill("260");
  await page.getByLabel("Alérgenos del sabor").fill("Ninguno");
  await page
    .getByLabel("Clase de gradiente del sabor")
    .fill("from-yellow-100 to-green-100");
  await page.getByLabel("Ruta de imagen del sabor").fill("/limon.png");
  await page.getByRole("button", { name: "Crear sabor" }).click();

  await expect(page.getByText("Sabor creado")).toBeVisible();
  await expect(page.getByText("Limón").first()).toBeVisible();
});
