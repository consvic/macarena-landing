import { expect, test } from "@playwright/test";

function stats(dateFrom: string, dateTo: string, totalOrders: number) {
  return {
    range: { dateFrom, dateTo },
    summary: {
      totalOrders,
      totalRevenue: totalOrders * 320,
      averageSpendPerOrder: 320,
      averageLitersPerOrder: 1,
    },
    topFlavors: [
      {
        flavorName: "Pistache",
        quantity: totalOrders,
        liters: 1,
        revenue: 320,
      },
    ],
    frequentBuyers: [
      {
        buyerKey: "ana@example.com",
        displayName: "Ana Gomez",
        orderCount: totalOrders,
        totalSpent: totalOrders * 320,
        liters: totalOrders,
      },
    ],
    topSpenders: [
      {
        buyerKey: "ana@example.com",
        displayName: "Ana Gomez",
        orderCount: totalOrders,
        totalSpent: totalOrders * 320,
        liters: totalOrders,
      },
    ],
  };
}

test("reloads analytics when the date range changes", async ({ page }) => {
  await page.route("**/api/admin/stats?*", async (route) => {
    const url = new URL(route.request().url());
    const dateFrom = url.searchParams.get("dateFrom") ?? "2026-08-01";
    const dateTo = url.searchParams.get("dateTo") ?? "2026-08-23";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        stats(dateFrom, dateTo, dateFrom === "2026-08-10" ? 7 : 3),
      ),
    });
  });

  await page.goto("/admin/analisis");

  const dateFrom = page.getByLabel("Fecha inicial");
  const dateTo = page.getByLabel("Fecha final");
  await expect(dateFrom).toHaveValue("2026-08-01");
  await expect(dateTo).toHaveValue("2026-08-23");
  await expect(page.getByText("Ana Gomez").first()).toBeVisible();

  const filteredRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return (
      url.pathname === "/api/admin/stats" &&
      url.searchParams.get("dateFrom") === "2026-08-10" &&
      url.searchParams.get("dateTo") === "2026-08-20"
    );
  });
  await dateFrom.fill("2026-08-10");
  await dateTo.fill("2026-08-20");
  await filteredRequest;

  await expect(dateFrom).toHaveValue("2026-08-10");
  await expect(dateTo).toHaveValue("2026-08-20");
  await expect(page.getByText("7 pedidos · $2,240.00")).toBeVisible();
});
