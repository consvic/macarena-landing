import { describe, expect, it } from "vitest";
import {
  buildBackfillPlan,
  buildRecentOrdersFilter,
  parseCliArgs,
  parseInventoryInput,
} from "./backfill-lot-inventory.mjs";

const PISTACHE_ID = "507f1f77bcf86cd799439011";
const VAINILLA_ID = "507f191e810c19729de860ea";

const inventory = parseInventoryInput([
  { name: "Pistache con kataifi", halfLiter: 9, liter: 0 },
  { name: "Vainilla", halfLiter: 3, liter: 5 },
]);

const activeFlavors = [
  {
    _id: PISTACHE_ID,
    name: "Pistache con Kataifi",
    inventoryManaged: false,
  },
  { _id: VAINILLA_ID, name: "Vainilla", inventoryManaged: false },
];

describe("lot inventory backfill script", () => {
  it("is a dry run unless --apply is explicit", () => {
    expect(parseCliArgs([])).toEqual({ apply: false, inputPath: null });
    expect(parseCliArgs(["--apply"])).toEqual({
      apply: true,
      inputPath: null,
    });
    expect(parseCliArgs(["--dry-run"])).toEqual({
      apply: false,
      inputPath: null,
    });
    expect(() => parseCliArgs(["--dry-run", "--apply"])).toThrow(
      "Choose either --dry-run or --apply",
    );
  });

  it("matches names case-insensitively and deducts recent order items", () => {
    const plan = buildBackfillPlan({
      inventory,
      activeFlavors,
      existingLotFlavorIds: new Set(),
      recentOrderItems: [
        {
          _id: "item-1",
          flavorId: PISTACHE_ID,
          flavorName: "Pistache con Kataifi",
          presentation: "1/2 litro",
          quantity: 2,
        },
        {
          _id: "item-2",
          flavorId: VAINILLA_ID,
          flavorName: "Vainilla",
          presentation: "1 litro",
          quantity: 1,
        },
      ],
    });

    expect(plan).toEqual([
      expect.objectContaining({
        flavorId: PISTACHE_ID,
        packed: { halfLiter: 9, liter: 0 },
        deducted: { halfLiter: 2, liter: 0 },
        remaining: { halfLiter: 7, liter: 0 },
        orderItems: [{ _id: "item-1", quantity: 2 }],
      }),
      expect.objectContaining({
        flavorId: VAINILLA_ID,
        packed: { halfLiter: 3, liter: 5 },
        deducted: { halfLiter: 0, liter: 1 },
        remaining: { halfLiter: 3, liter: 4 },
        orderItems: [{ _id: "item-2", quantity: 1 }],
      }),
    ]);
  });

  it("fails instead of creating negative remaining inventory", () => {
    expect(() =>
      buildBackfillPlan({
        inventory,
        activeFlavors,
        existingLotFlavorIds: new Set(),
        recentOrderItems: [
          {
            _id: "item-1",
            flavorId: PISTACHE_ID,
            flavorName: "Pistache con kataifi",
            presentation: "1/2 litro",
            quantity: 10,
          },
        ],
      }),
    ).toThrow("recent orders exceed packed inventory");
  });

  it("rejects already-managed flavors and existing lots", () => {
    expect(() =>
      buildBackfillPlan({
        inventory,
        activeFlavors: [
          { ...activeFlavors[0], inventoryManaged: true },
          activeFlavors[1],
        ],
        existingLotFlavorIds: new Set(),
        recentOrderItems: [],
      }),
    ).toThrow("Flavor already uses inventory");

    expect(() =>
      buildBackfillPlan({
        inventory,
        activeFlavors,
        existingLotFlavorIds: new Set([PISTACHE_ID]),
        recentOrderItems: [],
      }),
    ).toThrow("Flavor already has a lot");
  });

  it("targets the rolling createdAt window and excludes imported orders", () => {
    const start = new Date("2026-08-22T12:00:00.000Z");
    const end = new Date("2026-08-23T12:00:00.000Z");

    expect(buildRecentOrdersFilter(start, end)).toEqual({
      createdAt: { $gte: start, $lte: end },
      status: {
        $in: ["pending_confirmation", "confirmed", "paid", "delivered"],
      },
      $or: [
        { externalOrderId: { $exists: false } },
        { externalOrderId: null },
        { externalOrderId: "" },
      ],
    });
  });

  it("validates the inventory input", () => {
    expect(() =>
      parseInventoryInput([{ name: "Vainilla", halfLiter: 0, liter: 0 }]),
    ).toThrow("must include at least one container");
    expect(() =>
      parseInventoryInput([
        { name: "Vainilla", halfLiter: 1, liter: 0 },
        { name: "vainilla", halfLiter: 1, liter: 0 },
      ]),
    ).toThrow("Duplicate inventory flavor");
  });
});
