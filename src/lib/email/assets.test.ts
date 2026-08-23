import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveEmailAssetUrl } from "@/lib/email/assets";

describe("resolveEmailAssetUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses the deployed Macarena URL by default", () => {
    vi.stubEnv("EMAIL_ASSET_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");

    expect(resolveEmailAssetUrl("/MacaAzul1.png")).toBe(
      "https://www.macarenagelateria.com/MacaAzul1.png",
    );
  });

  it("allows an explicit asset URL override", () => {
    vi.stubEnv("EMAIL_ASSET_BASE_URL", "https://assets.example.com");

    expect(resolveEmailAssetUrl("/MacaAzul1.png")).toBe(
      "https://assets.example.com/MacaAzul1.png",
    );
  });
});
