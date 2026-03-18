# Macarena Landing

Macarena Landing is the marketing site and digital menu for Macarena Gelateria. It combines a brand-forward landing page with a dynamic gelato menu, cart flow, order submission, and flavor management APIs backed by MongoDB.

## What The App Includes

- A visual landing page at `/` that introduces the brand, product philosophy, and calls to action.
- A dynamic menu page at `/menu` with search, pricing by presentation, vegan indicators, and add-to-cart interactions.
- A cart and checkout flow that lets customers build an order and submit it for confirmation.
- API endpoints for flavors and orders.
- Mongo-backed flavor data with an `exists` flag to control which flavors are currently available to customers.

## Current Menu Availability Feature

Flavors now include an `exists` boolean field in the database.

- Only flavors with `exists: true` are returned by the public backend read paths.
- `GET /api/flavors` only returns currently available flavors.
- `GET /api/flavors/:id` returns `404` for flavors that are marked unavailable.
- The `/menu` page only shows flavors that are currently available because it reads from those filtered backend queries.

This lets the team keep historical or temporarily unavailable flavors in the database without showing them in the customer-facing menu.

## Tech Stack

- Next.js App Router
- React 19
- TypeScript
- MongoDB with Mongoose
- Tailwind CSS
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

## Main Routes

- `/`: Brand landing page.
- `/menu`: Customer-facing flavor menu.
- `/menu/cart`: Cart and checkout flow.
- `/api/flavors`: Flavor list and flavor creation.
- `/api/flavors/:id`: Single flavor read, update, and delete.
- `/api/orders`: Order creation and order listing.
- `/api/orders/:id`: Order detail and order status updates.

## Scripts

- `npm run dev`: Start the Next.js dev server.
- `npm run build`: Create a production build.
- `npm run start`: Start the production server.
- `npm run lint`: Run Biome checks.
- `npm run format`: Format the codebase with Biome.
- `npm test`: Run the test suite.
- `npm run test:watch`: Run tests in watch mode.
- `npm run test:coverage`: Run tests with coverage.
- `npm run seed:flavors -- <json-path> [--replace]`: Seed or replace flavor records from JSON.
- `npm run backfill:flavor-existence -- <true|false>`: Update all existing flavors to the provided availability state.

Flavor script details and JSON format are documented in [SEED_FLAVORS.md](/Users/constanza/Projects/macarena/macarena-landing/SEED_FLAVORS.md).

## Development Notes

- The menu is rendered dynamically and reads flavor data from MongoDB.
- Flavor availability is controlled with the `exists` field rather than deleting records.
- Orders store flavor names and selected presentation so the checkout record remains stable even if flavor availability changes later.

## Testing

Run the full suite:

```bash
npm test
```

Run only the flavor availability tests:

```bash
npm test -- src/lib/flavors/getFlavors.test.ts 'src/app/api/flavors/[id]/route.test.ts'
```
