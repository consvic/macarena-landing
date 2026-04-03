# Macarena Landing

Macarena Landing is the marketing site and digital menu for Macarena Gelateria. It combines a brand-forward landing page with a dynamic gelato menu, cart flow, order submission, email notifications, and flavor management APIs backed by MongoDB.

## What The App Includes

- A visual landing page at `/` that introduces the brand, product philosophy, and calls to action.
- A dynamic menu page at `/menu` with search, pricing by presentation (1/2 litro and 1 litro), vegan indicators, and add-to-cart interactions.
- A client-side cart powered by React Context and persisted to `localStorage`, so customers keep their selections across page reloads.
- A checkout flow at `/menu/cart` where customers review their cart, enter an email, and submit the order.
- An order API that validates items, stores orders and order items in MongoDB, and sends a pending-confirmation email via Resend.
- Email notifications (order pending and order confirmed) built with `react-email` and sent through the Resend API.
- API endpoints for flavors and orders.
- Mongo-backed flavor data with an `exists` flag to control which flavors are currently available to customers.
- Protected admin portal at `/admin` with sections for `Resumen`, `Pedidos`, `Sabores`, and `Análisis`.
- Admin APIs under `/api/admin/*` protected with HTTP Basic Auth.
- CSV historical order import via `/api/admin/orders/import`.

## Menu Availability

Flavors include an `exists` boolean field in the database.
Admin routes also track `isVisibleOnSite` and `isArchived` to support hide vs soft-delete lifecycle.

- Only flavors with `exists: true` are returned by the public backend read paths.
- `GET /api/flavors` only returns currently available flavors.
- `GET /api/flavors/:id` returns `404` for flavors that are marked unavailable.
- The `/menu` page only shows flavors that are currently available because it reads from those filtered backend queries.

This lets the team keep historical or temporarily unavailable flavors in the database without showing them in the customer-facing menu.

## Cart and Order Flow

1. On the `/menu` page, customers pick a presentation size (1/2 litro or 1 litro) and add flavors to their cart.
2. The cart state lives in a `CartProvider` (React Context) and is synced to `localStorage` under the key `macarena:cart:v1`.
3. A cart nav button in the menu header shows the current item count and links to `/menu/cart`.
4. At `/menu/cart`, customers see their items, totals (formatted in MXN), and an email field. Submitting calls `POST /api/orders`.
5. The API creates an `Order` and associated `OrderItem` documents in MongoDB, then sends a pending-confirmation email to the customer.
6. On success the cart is cleared and a confirmation message is shown.

## Tech Stack

- Next.js App Router
- React 19
- TypeScript
- MongoDB with Mongoose
- Tailwind CSS
- Resend + react-email (transactional emails)
- Vitest and Testing Library

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with the required variables:

```bash
MONGODB_URI=your-mongodb-connection-string
MONGODB_DB_NAME=macarena
MENU_ENABLED=true
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=Macarena Gelateria <orders@yourdomain.com>
EMAIL_ASSET_BASE_URL=https://your-domain.com
BANK_ACCOUNT_NAME=Macarena Gelateria
BANK_ACCOUNT_CLABE=000000000000000000
BANK_ACCOUNT_REFERENCE=PEDIDO-MACARENA
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

- `MONGODB_URI`: MongoDB connection string.
- `MONGODB_DB_NAME`: Database name. Defaults to `macarena` if omitted in scripts and DB connection code.
- `MENU_ENABLED`: Enables the `/menu` route when set to `true`. If not enabled, `/menu` redirects to `/`.
- `RESEND_API_KEY`: API key for Resend. If missing, email sending is skipped with a console warning.
- `RESEND_FROM_EMAIL`: Sender address for transactional emails (e.g. `Macarena Gelateria <orders@yourdomain.com>`).
- `EMAIL_ASSET_BASE_URL`: Base URL used to resolve image assets inside email templates.
- `BANK_ACCOUNT_NAME`: Bank account holder name shown in the payment instructions email.
- `BANK_ACCOUNT_CLABE`: CLABE number included in the payment instructions email.
- `BANK_ACCOUNT_REFERENCE`: Payment reference shown in the payment instructions email.

## Main Routes

- `/`: Brand landing page.
- `/menu`: Customer-facing flavor menu.
- `/menu/cart`: Cart and checkout flow.
- `/admin`: Internal dashboard (`Resumen`).
- `/admin/pedidos`: Internal order operations + CSV import.
- `/admin/sabores`: Internal flavor management.
- `/admin/analisis`: Internal analytics dashboard.
- `/api/flavors`: Flavor list and flavor creation.
- `/api/flavors/:id`: Single flavor read, update, and delete.
- `/api/orders`: Order creation and order listing.
- `/api/orders/:id`: Order detail and order status updates.
- `/api/admin/orders`: Admin order list with filters and pagination.
- `/api/admin/orders/:id/status`: Admin status updates.
- `/api/admin/orders/import`: Admin CSV import endpoint.
- `/api/admin/flavors`: Admin flavor list/create.
- `/api/admin/flavors/:id`: Admin flavor update.
- `/api/admin/flavors/:id/visibility`: Toggle flavor visibility on main menu.
- `/api/admin/flavors/:id/archive`: Soft delete / restore flavor.
- `/api/admin/stats`: Analytics aggregates for admin.

## Scripts

- `npm run dev`: Start the Next.js dev server.
- `npm run build`: Create a production build.
- `npm run start`: Start the production server.
- `npm run lint`: Run Biome checks.
- `npm run format`: Format the codebase with Biome.
- `npm test`: Run the test suite.
- `npm run test:watch`: Run tests in watch mode.
- `npm run test:coverage`: Run tests with coverage.
- `npm run admin:create -- --email <email> --password <password>`: Create an admin user in MongoDB for Basic Auth access.
- `npm run seed:flavors -- <json-path> [--replace]`: Seed or replace flavor records from JSON.
- `npm run backfill:flavor-existence -- <true|false>`: Update all existing flavors to the provided availability state.
- `npm run email:dev`: Launch the react-email preview server on port 3030.

Flavor script details and JSON format are documented in [SEED_FLAVORS.md](./SEED_FLAVORS.md).

Orders CSV import format is documented in [docs/orders-csv-import.md](./docs/orders-csv-import.md), with a template at [examples/orders-import-template.csv](./examples/orders-import-template.csv).

Admin user creation and operations are documented in [docs/admin-users.md](./docs/admin-users.md).

## Development Notes

- The menu is rendered dynamically and reads flavor data from MongoDB.
- Flavor availability is controlled with the `exists` field rather than deleting records.
- Orders store flavor names and selected presentation so the checkout record remains stable even if flavor availability changes later.
- Cart state is client-only (React Context + `localStorage`). There is no server-side cart persistence.
- Email sending is optional. If `RESEND_API_KEY` is not set the order is still created; the email step logs a warning and is skipped.

## Testing

Run the full suite:

```bash
npm test
```

Run specific test files:

```bash
npm test -- src/lib/flavors/getFlavors.test.ts 'src/app/api/flavors/[id]/route.test.ts'
npm test -- src/app/api/orders/route.test.ts
npm test -- src/components/cart/CartPageView.test.tsx src/components/providers/CartProvider.test.tsx
```
