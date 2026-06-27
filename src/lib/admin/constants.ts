export const MEXICO_CITY_UTC_OFFSET = "-06:00";
export const ADMIN_SESSION_COOKIE_NAME = "macarena_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

export const ORDER_IMPORT_HEADERS = [
  "external_order_id",
  "ordered_at",
  "customer_name",
  "customer_email",
  "customer_phone",
  "status",
  "currency",
  "notes",
  "flavor_id",
  "flavor_name",
  "presentation",
  "quantity",
  "unit_price",
] as const;

export type OrderImportHeader = (typeof ORDER_IMPORT_HEADERS)[number];
