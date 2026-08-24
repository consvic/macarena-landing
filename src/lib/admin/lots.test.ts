import { beforeEach, describe, expect, it, vi } from "vitest";

const connectMock = vi.fn();
const findFlavorMock = vi.fn();
const leanFlavorMock = vi.fn();
const createLotMock = vi.fn();
const updateFlavorMock = vi.fn();
const findOneAndUpdateLotMock = vi.fn();
const leanAdjustedLotMock = vi.fn();
const existsLotMock = vi.fn();
const withTransactionMock = vi.fn();
const endSessionMock = vi.fn();

vi.mock("@/lib/db/mongoose", () => ({
  connectToDatabase: () => connectMock(),
}));

vi.mock("@/models/Flavor", () => ({
  FlavorModel: {
    findOne: (...args: unknown[]) => findFlavorMock(...args),
    updateOne: (...args: unknown[]) => updateFlavorMock(...args),
  },
}));

vi.mock("@/models/Lot", () => ({
  LotModel: {
    create: (...args: unknown[]) => createLotMock(...args),
    findOneAndUpdate: (...args: unknown[]) => findOneAndUpdateLotMock(...args),
    exists: (...args: unknown[]) => existsLotMock(...args),
  },
}));

const FLAVOR_ID = "507f1f77bcf86cd799439011";
const LOT_ID = "507f191e810c19729de860ea";
const session = {
  withTransaction: withTransactionMock,
  endSession: endSessionMock,
};
const lot = {
  _id: LOT_ID,
  flavorId: FLAVOR_ID,
  packed: { halfLiter: 3, liter: 2 },
  remaining: { halfLiter: 3, liter: 2 },
  adjustments: [],
  createdBy: "admin@macarena.mx",
  createdAt: new Date("2026-08-23T12:00:00Z"),
  updatedAt: new Date("2026-08-23T12:00:00Z"),
};

describe("admin lot services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMock.mockResolvedValue({
      startSession: () => Promise.resolve(session),
    });
    withTransactionMock.mockImplementation((callback: () => unknown) =>
      callback(),
    );
    findFlavorMock.mockReturnValue({ lean: leanFlavorMock });
    leanFlavorMock.mockResolvedValue({ _id: FLAVOR_ID });
    createLotMock.mockResolvedValue([{ toObject: () => lot }]);
    updateFlavorMock.mockResolvedValue({ modifiedCount: 1 });
    findOneAndUpdateLotMock.mockReturnValue({ lean: leanAdjustedLotMock });
  });

  it.each([
    [{ halfLiter: "", liter: "" }, "At least one container is required"],
    [{ halfLiter: -1, liter: 0 }, "Lot quantities cannot be negative"],
    [{ halfLiter: 1.5, liter: 0 }, "halfLiter must be an integer"],
  ])("rejects invalid packed quantities", async (input, message) => {
    const { createAdminLot } = await import("@/lib/admin/lots");
    await expect(
      createAdminLot(FLAVOR_ID, input, "admin@macarena.mx"),
    ).rejects.toThrow(message);
    expect(createLotMock).not.toHaveBeenCalled();
  });

  it("creates the first lot and permanently enables inventory", async () => {
    const { createAdminLot } = await import("@/lib/admin/lots");
    await expect(
      createAdminLot(
        FLAVOR_ID,
        { halfLiter: "3", liter: "2" },
        "admin@macarena.mx",
      ),
    ).resolves.toEqual(expect.objectContaining({ packed: lot.packed }));
    expect(updateFlavorMock).toHaveBeenCalledWith(
      { _id: FLAVOR_ID },
      {
        $set: {
          inventoryManaged: true,
          updatedBy: "admin@macarena.mx",
        },
      },
      { session },
    );
  });

  it("rejects adjustments that would make stock negative", async () => {
    leanAdjustedLotMock.mockResolvedValue(null);
    existsLotMock.mockResolvedValue({ _id: LOT_ID });
    const { adjustAdminLot } = await import("@/lib/admin/lots");

    await expect(
      adjustAdminLot(
        LOT_ID,
        { halfLiter: -4, liter: 0, reason: "Conteo físico" },
        "admin@macarena.mx",
      ),
    ).rejects.toThrow("Insufficient lot inventory");
    expect(findOneAndUpdateLotMock).toHaveBeenCalledWith(
      { _id: LOT_ID, "remaining.halfLiter": { $gte: 4 } },
      expect.objectContaining({
        $inc: { "remaining.halfLiter": -4, "remaining.liter": 0 },
      }),
      { new: true, runValidators: true },
    );
  });
});
