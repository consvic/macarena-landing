import { beforeEach, describe, expect, it, vi } from "vitest";

const connectToDatabaseMock = vi.fn();
const findMock = vi.fn();
const sortMock = vi.fn();
const leanMock = vi.fn();
const findLotsMock = vi.fn();
const leanLotsMock = vi.fn();

vi.mock("@/lib/db/mongoose", () => ({
  connectToDatabase: () => connectToDatabaseMock(),
}));

vi.mock("@/models/Flavor", () => ({
  FlavorModel: {
    find: (...args: unknown[]) => findMock(...args),
  },
}));

vi.mock("@/models/Lot", () => ({
  LotModel: {
    find: (...args: unknown[]) => findLotsMock(...args),
  },
}));

describe("getFlavors", () => {
  beforeEach(() => {
    connectToDatabaseMock.mockReset();
    findMock.mockReset();
    sortMock.mockReset();
    leanMock.mockReset();
    findLotsMock.mockReset();
    leanLotsMock.mockReset();

    findMock.mockReturnValue({ sort: sortMock });
    sortMock.mockReturnValue({ lean: leanMock });
    findLotsMock.mockReturnValue({ lean: leanLotsMock });
    leanLotsMock.mockResolvedValue([]);
  });

  it("only queries visible, non-archived flavors", async () => {
    leanMock.mockResolvedValue([
      {
        _id: "flavor-1",
        name: "Mango",
        description: "desc",
        category: "seasonal",
        base: "agua",
        tags: ["fruit"],
        price: { halfLiter: 150, liter: 280 },
        allergens: "none",
        gradient: "from-a to-b",
        coverImage: "/mango.png",
        exists: true,
      },
    ]);

    const { getFlavors } = await import("@/lib/flavors/getFlavors");
    const flavors = await getFlavors();

    expect(connectToDatabaseMock).toHaveBeenCalledTimes(1);
    expect(findMock).toHaveBeenCalledWith({
      exists: true,
      isArchived: { $ne: true },
    });
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(flavors).toEqual([
      expect.objectContaining({
        name: "Mango",
        exists: true,
      }),
    ]);
  });

  it("derives managed presentations and quantities from lots", async () => {
    leanMock.mockResolvedValue([
      {
        _id: "flavor-1",
        name: "Mango",
        price: { halfLiter: 150, liter: 280 },
        exists: true,
        inventoryManaged: true,
        availablePresentations: ["1/2 litro", "1 litro"],
      },
      {
        _id: "flavor-2",
        name: "Coco",
        price: { halfLiter: 150, liter: 280 },
        exists: true,
        inventoryManaged: true,
      },
    ]);
    leanLotsMock.mockResolvedValue([
      {
        flavorId: "flavor-1",
        remaining: { halfLiter: 2, liter: 0 },
      },
    ]);

    const { getFlavors } = await import("@/lib/flavors/getFlavors");
    const flavors = await getFlavors();

    expect(flavors).toHaveLength(1);
    expect(flavors[0]).toEqual(
      expect.objectContaining({
        name: "Mango",
        inventoryManaged: true,
        availablePresentations: ["1/2 litro"],
        availableQuantities: { halfLiter: 2, liter: 0 },
      }),
    );
  });
});
