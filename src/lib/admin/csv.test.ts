import { describe, expect, it } from "vitest";
import {
  assertOrderImportHeaders,
  parseCsv,
  rowToOrderImportObject,
} from "@/lib/admin/csv";

describe("admin csv", () => {
  it("parses header and rows", () => {
    const csv = [
      "external_order_id,ordered_at,customer_name,customer_email,customer_phone,status,currency,notes,flavor_id,flavor_name,presentation,quantity,unit_price",
      "hist-1,2026-03-01 12:30,Ana,ana@example.com,5512345678,pending_confirmation,MXN,,,Mango,1/2 litro,2,150",
    ].join("\n");

    const parsed = parseCsv(csv);

    expect(parsed.headers).toHaveLength(13);
    expect(parsed.rows).toHaveLength(1);
    const objectRow = rowToOrderImportObject(parsed.rows[0] ?? []);
    expect(objectRow.external_order_id).toBe("hist-1");
    expect(objectRow.unit_price).toBe("150");
  });

  it("validates exact header order", () => {
    const badHeaders = [
      "ordered_at",
      "external_order_id",
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
    ];

    expect(() => assertOrderImportHeaders(badHeaders)).toThrowError(
      "Invalid header at position 1",
    );
  });
});
