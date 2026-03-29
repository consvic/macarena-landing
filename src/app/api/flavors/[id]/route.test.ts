import { beforeEach, describe, expect, it, vi } from "vitest";

const connectToDatabaseMock = vi.fn();
const findOneMock = vi.fn();

vi.mock("@/lib/db/mongoose", () => ({
  connectToDatabase: () => connectToDatabaseMock(),
}));

vi.mock("@/models/Flavor", () => ({
  FlavorModel: {
    findOne: (...args: unknown[]) => findOneMock(...args),
  },
}));

describe("GET /api/flavors/[id]", () => {
  beforeEach(() => {
    connectToDatabaseMock.mockReset();
    findOneMock.mockReset();
  });

  it("only returns flavors that exist", async () => {
    const leanMock = vi.fn().mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      name: "Mango",
      exists: true,
    });

    findOneMock.mockReturnValue({ lean: leanMock });

    const { GET } = await import("@/app/api/flavors/[id]/route");
    const response = await GET(new Request("http://localhost/api/flavors/id"), {
      params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }),
    });

    expect(connectToDatabaseMock).toHaveBeenCalledTimes(1);
    expect(findOneMock).toHaveBeenCalledWith({
      _id: "507f1f77bcf86cd799439011",
      exists: true,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ name: "Mango", exists: true }),
    );
  });

  it("returns 404 when the flavor does not exist or is filtered out", async () => {
    const leanMock = vi.fn().mockResolvedValue(null);

    findOneMock.mockReturnValue({ lean: leanMock });

    const { GET } = await import("@/app/api/flavors/[id]/route");
    const response = await GET(new Request("http://localhost/api/flavors/id"), {
      params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      message: "Flavor not found",
    });
  });
});
