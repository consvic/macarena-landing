const DEFAULT_EMAIL_ASSET_BASE_URL = "https://www.macarenagelateria.com";

function getEmailAssetBaseUrl() {
  return (
    process.env.EMAIL_ASSET_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    DEFAULT_EMAIL_ASSET_BASE_URL
  );
}

export function resolveEmailAssetUrl(assetPath: string) {
  try {
    return new URL(assetPath, getEmailAssetBaseUrl()).toString();
  } catch {
    return assetPath;
  }
}
