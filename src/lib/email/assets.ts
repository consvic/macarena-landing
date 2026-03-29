const EMAIL_ASSET_BASE_URL =
  process.env.EMAIL_ASSET_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

export function resolveEmailAssetUrl(assetPath: string) {
  try {
    return new URL(assetPath, EMAIL_ASSET_BASE_URL).toString();
  } catch {
    return assetPath;
  }
}
