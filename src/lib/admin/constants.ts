export const ADMIN_AUTH_REALM = "Macarena Admin";
export const MEXICO_CITY_UTC_OFFSET = "-06:00";

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
