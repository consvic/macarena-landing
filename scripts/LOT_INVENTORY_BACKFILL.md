# Lot inventory backfill

This script creates one opening lot for each flavor in `lot-inventory-backfill.json`. It subtracts non-cancelled live orders whose `createdAt` falls within the 24 hours immediately before execution. CSV-imported orders (`externalOrderId`) are excluded.

The default command is a dry run. It prints packed, deducted, and remaining containers without writing to MongoDB:

```bash
npm run backfill:lot-inventory
```

The equivalent explicit dry-run command is:

```bash
npm run backfill:lot-inventory -- --dry-run
```

Review the table, then apply as soon as practical. The rolling 24-hour window is recalculated on every run:

```bash
npm run backfill:lot-inventory -- --apply
```

`--apply` is the only flag that permits database writes. Passing both `--dry-run` and `--apply` is rejected.

The apply step runs in a MongoDB transaction, creates the lots, attaches their allocations to the recent order items, and sets `inventoryManaged: true`. It aborts if a flavor is missing, inactive, already managed, already has a lot, has changed since validation, or would receive negative inventory. MongoDB must support transactions.

To use another input file, pass its path before `--apply`:

```bash
npm run backfill:lot-inventory -- path/to/inventory.json --apply
```

Never run `--apply` twice. The safety checks reject a second attempt, but always run the dry run first and verify the database/environment before applying.

Pause customer ordering while running the final dry run and `--apply` so an order cannot arrive between the inventory snapshot and the transaction.
