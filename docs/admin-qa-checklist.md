# Admin Portal QA Checklist

This checklist validates the admin implementation against the approved scope.

## How To Use

- Mark each case as `PASS` or `FAIL`.
- Record evidence (response payload snippets, screenshots, timestamps).
- Run high-priority (`P0`, `P1`) cases before rollout.

---

## P0 - Access Control (Must Pass)

### AUTH-001 Unauthorized page access is blocked
- Priority: P0
- Preconditions: No `Authorization` header.
- Steps:
  1. Open `/admin`.
  2. Open `/admin/pedidos`, `/admin/sabores`, `/admin/analisis`.
- Expected:
  - Browser gets HTTP 401 challenge (`WWW-Authenticate: Basic ...`).
  - No admin UI content is rendered.

### AUTH-002 Unauthorized API access is blocked
- Priority: P0
- Preconditions: No `Authorization` header.
- Steps:
  1. Call `GET /api/admin/orders`.
  2. Call `GET /api/admin/flavors`.
  3. Call `GET /api/admin/stats`.
- Expected:
  - All return `401` with unauthorized response.

### AUTH-003 Valid credentials allow access
- Priority: P0
- Preconditions: At least one `AdminUser` exists in MongoDB (create via `npm run admin:create -- --email ... --password ...`).
- Steps:
  1. Send valid Basic auth credentials.
  2. Open admin pages.
  3. Call admin APIs.
- Expected:
  - Pages load successfully.
  - APIs return `200`/`201`.

### AUTH-004 Header spoof hardening
- Priority: P0
- Preconditions: No valid Basic auth credentials.
- Steps:
  1. Call `GET /api/admin/orders` with only header `x-admin-user: any-value`.
- Expected:
  - Request is rejected (`401`).
  - No admin data returned.

---

## P1 - Orders

### ORD-001 Orders list supports search/filters/pagination
- Priority: P1
- Steps:
  1. Query `/api/admin/orders?page=1&limit=20`.
  2. Add `search`, `status`, `dateFrom`, `dateTo` combinations.
- Expected:
  - Results match applied filters.
  - Pagination metadata is consistent (`total`, `totalPages`, `page`, `limit`).

### ORD-002 Status update persists and records actor
- Priority: P1
- Steps:
  1. Call `PATCH /api/admin/orders/:id/status` with `confirmed`.
  2. Re-fetch order.
- Expected:
  - `status` updates correctly.
  - `updatedBy` equals authenticated admin email.

### ORD-003 Status transition edge cases
- Priority: P1
- Steps:
  1. Set order to `confirmed`.
  2. Then set to `cancelled`.
  3. Then set to `pending_confirmation`.
- Expected:
  - Final status matches last update.
  - `confirmedAt` behavior follows expected product rule (confirm whether it should be cleared or retained).

### ORD-004 Invalid status rejected
- Priority: P1
- Steps:
  1. Send `PATCH /api/admin/orders/:id/status` with invalid status.
- Expected:
  - Response `400` with validation message.

---

## P1 - Flavors (Lifecycle)

### FLV-001 Create flavor
- Priority: P1
- Steps:
  1. Use `POST /api/admin/flavors` with valid payload.
- Expected:
  - `201` returned.
  - Flavor appears in admin list.

### FLV-002 Edit flavor
- Priority: P1
- Steps:
  1. `PATCH /api/admin/flavors/:id` with updated fields.
- Expected:
  - Data updates correctly.
  - `updatedBy` is set.

### FLV-003 Hide flavor from main site
- Priority: P1
- Steps:
  1. `PATCH /api/admin/flavors/:id/visibility` with `isVisibleOnSite=false`.
  2. Open `/menu` and verify listing.
- Expected:
  - Flavor not shown in public menu.

### FLV-004 Archive flavor (soft delete)
- Priority: P1
- Steps:
  1. `PATCH /api/admin/flavors/:id/archive` with `isArchived=true`.
  2. Query public flavor endpoints.
- Expected:
  - Flavor is hidden from public endpoints/menu.
  - Flavor still exists in admin list as archived.

### FLV-005 Restore archived flavor
- Priority: P1
- Steps:
  1. `PATCH /api/admin/flavors/:id/archive` with `isArchived=false`.
  2. Optionally set visibility true.
- Expected:
  - Flavor returns to active lifecycle flow.
  - Visibility can be re-enabled as intended.

---

## P1 - Analytics (`Análisis`)

### ANL-001 Default date window and timezone behavior
- Priority: P1
- Steps:
  1. Call `GET /api/admin/stats` without date params.
- Expected:
  - Range defaults to last 30 days.
  - Boundaries behave consistently with `America/Mexico_City` business dates.

### ANL-002 KPI correctness with known fixture
- Priority: P1
- Steps:
  1. Seed deterministic orders + items fixture.
  2. Call `GET /api/admin/stats?dateFrom=...&dateTo=...`.
- Expected:
  - `totalOrders`, `totalRevenue`, `averageSpendPerOrder`, `averageLitersPerOrder` match expected calculations.

### ANL-003 Rankings correctness
- Priority: P1
- Steps:
  1. Validate `topFlavors`, `frequentBuyers`, and `topSpenders` against fixture.
- Expected:
  - Ordering and totals are correct.
  - Default top list length is 10.

### ANL-004 Buyer grouping fallback logic
- Priority: P1
- Steps:
  1. Include rows with `name+phone`, and rows with missing phone.
- Expected:
  - Primary grouping uses `name+phone`.
  - Missing phone groups by email fallback.

### ANL-005 Cancelled-order inclusion policy
- Priority: P1
- Steps:
  1. Include cancelled orders in fixture.
  2. Verify KPI/rank outputs.
- Expected:
  - Behavior matches product decision (include or exclude cancelled orders).

---

## P1 - CSV Import

### CSV-001 Happy path import
- Priority: P1
- Steps:
  1. Upload a valid file matching `examples/orders-import-template.csv` schema.
- Expected:
  - `201` response with `{ importedOrders, importedItems, totalRevenue }`.
  - Records created in `Order` and `OrderItem`.

### CSV-002 Strict header order enforcement
- Priority: P1
- Steps:
  1. Reorder one header column.
  2. Upload file.
- Expected:
  - `400` with header validation error.

### CSV-003 Field validation
- Priority: P1
- Steps:
  1. Test invalid `ordered_at`, invalid `presentation`, negative `unit_price`, non-integer `quantity`.
- Expected:
  - `400` with row/column-specific errors.

### CSV-004 Group consistency per `external_order_id`
- Priority: P1
- Steps:
  1. Same `external_order_id`, but different `customer_email` in one row.
- Expected:
  - `400` with consistency error.

### CSV-005 Duplicate import prevention
- Priority: P1
- Steps:
  1. Import valid file once.
  2. Re-import same file.
- Expected:
  - Second import fails with duplicate `external_order_id` error.

### CSV-006 Create-only behavior
- Priority: P1
- Steps:
  1. Try importing data intended to update existing order (same external ID).
- Expected:
  - Import is rejected; no updates to existing records.

---

## P2 - UX/Operational Checks

### UX-001 Admin labels and navigation
- Priority: P2
- Steps:
  1. Open admin sidebar.
- Expected:
  - Labels are exactly: `Resumen`, `Pedidos`, `Sabores`, `Análisis`.

### UX-002 Orders import feedback
- Priority: P2
- Steps:
  1. Trigger successful import.
  2. Trigger failed import.
- Expected:
  - Success summary visible.
  - Validation errors show row/column details.

### UX-003 Mobile/desktop behavior
- Priority: P2
- Steps:
  1. Validate admin pages at mobile and desktop widths.
- Expected:
  - Core workflows remain usable.

---

## Regression Checks (Public Site)

### REG-001 Public menu unaffected
- Priority: P1
- Steps:
  1. Open `/menu` and `/menu/cart`.
  2. Create public order via cart flow.
- Expected:
  - Existing customer flow remains functional.

### REG-002 Public flavor APIs unaffected
- Priority: P1
- Steps:
  1. Call `GET /api/flavors` and `GET /api/flavors/:id`.
- Expected:
  - Only visible, non-archived flavors returned.

---

## Sign-Off Criteria

- All P0 tests pass.
- All P1 tests pass or have documented accepted deviations.
- Any open P2 issues are triaged with owner and target date.
