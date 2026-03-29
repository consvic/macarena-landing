import { describe, expect, it } from "vitest";
import { formatMXN, resolveFlavorPrice } from "@/lib/pricing";

describe("resolveFlavorPrice", () => {
  const price = {
    halfLiter: 150,
    liter: 280,
  };

  it("returns half liter price", () => {
    expect(resolveFlavorPrice(price, "1/2 litro")).toBe(150);
  });

  it("returns liter price", () => {
    expect(resolveFlavorPrice(price, "1 litro")).toBe(280);
  });
});

describe("formatMXN", () => {
  it("formats amount in mexican peso", () => {
    expect(formatMXN(150)).toContain("150");
    expect(formatMXN(150)).toContain("$");
  });
});
