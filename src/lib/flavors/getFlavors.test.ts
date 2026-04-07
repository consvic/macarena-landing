import { beforeEach, describe, expect, it, vi } from "vitest";

const connectToDatabaseMock = vi.fn();
const findMock = vi.fn();
const sortMock = vi.fn();
const leanMock = vi.fn();

vi.mock("@/lib/db/mongoose", () => ({
  connectToDatabase: () => connectToDatabaseMock(),
}));

vi.mock("@/models/Flavor", () => ({
  FlavorModel: {
    find: (...args: unknown[]) => findMock(...args),
  },
}));

describe("getFlavors", () => {
  beforeEach(() => {
    connectToDatabaseMock.mockReset();
    findMock.mockReset();
    sortMock.mockReset();
    leanMock.mockReset();

    findMock.mockReturnValue({ sort: sortMock });
    sortMock.mockReturnValue({ lean: leanMock });
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
});
