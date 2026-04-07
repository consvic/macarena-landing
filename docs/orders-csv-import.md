# Orders CSV Import (Admin)

This document defines the **strict CSV contract** used by `POST /api/admin/orders/import`.

## Scope

- Imports historical orders from CSV into `Order` and `OrderItem` collections.
- Creates **new** orders only.
- Does **not** update existing orders.
- Import rejects duplicate `external_order_id` values that already exist in the database.

## Required File Format

- Encoding: UTF-8
- Delimiter: comma (`,`) 
- Row model: **one row per order item**
- Header row: required and must match exactly (same order and names)

### Required Headers (fixed order)

```text
external_order_id,ordered_at,customer_name,customer_email,customer_phone,status,currency,notes,flavor_id,flavor_name,presentation,quantity,unit_price
```

## Field Rules

- `external_order_id`: required, non-empty string, used to group item rows into one order
- `ordered_at`: required, format `YYYY-MM-DD HH:mm` (local business time)
- `customer_name`: required
- `customer_email`: required
- `customer_phone`: optional
- `status`: required, one of `pending_confirmation`, `confirmed`, `cancelled`
- `currency`: required, must be `MXN`
- `notes`: optional
- `flavor_id`: optional, when present must be a valid Mongo ObjectId
- `flavor_name`: required
- `presentation`: required, one of `1/2 litro`, `1 litro`
- `quantity`: required, integer >= 1
- `unit_price`: required, number >= 0

## Grouping Rules

Rows with the same `external_order_id` are grouped into a single order.
All grouped rows must have identical values for:

- `ordered_at`
- `customer_name`
- `customer_email`
- `customer_phone`
- `status`
- `currency`
- `notes`

If any grouped row differs in these fields, import fails with validation errors.

## Calculations

- `subtotal` is computed per item as `quantity * unit_price`
- `totalPrice` is the sum of grouped item subtotals
- `itemCount` is the sum of grouped item quantities

## Timezone

- Canonical business timezone: `America/Mexico_City`
- `ordered_at` must represent local business time in that timezone.

## Error Model

Validation failures return HTTP 400 with:

```json
{
  "message": "CSV import validation failed",
  "errors": [
    { "row": 4, "column": "presentation", "message": "presentation must be one of: 1/2 litro, 1 litro" }
  ]
}
```

`row` is 1-based and includes the header row in counting, so first data row is `2`.

## Template

Use the committed template:

- `examples/orders-import-template.csv`

