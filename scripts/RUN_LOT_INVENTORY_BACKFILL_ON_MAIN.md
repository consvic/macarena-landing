# Handoff: run lot inventory backfill on `main`

Do not run this migration until the lot-inventory PR is merged and an authorized operator explicitly approves the production write.

1. Update `main` and install its dependencies:

   ```bash
   git switch main
   git pull --ff-only
   npm ci
   ```

2. Confirm `.env` points to the intended production MongoDB database. Review `scripts/lot-inventory-backfill.json`; its packed quantities must be:

   - Pistache con kataifi: 9 half-liter, 0 liter
   - Vainilla: 3 half-liter, 5 liter
   - Yogurt griego: 4 half-liter, 3 liter

3. Pause customer ordering, then run the default dry run:

   ```bash
   npm run backfill:lot-inventory
   ```

4. Verify the printed 24-hour window, deductions, and remaining quantities. The dry run makes no database changes.

5. Only after explicit approval, apply immediately while ordering remains paused:

   ```bash
   npm run backfill:lot-inventory -- --apply
   ```

6. Confirm the three flavors show managed inventory in `/admin/sabores`, then resume ordering. Never run `--apply` twice.

Full behavior and safety notes: `scripts/LOT_INVENTORY_BACKFILL.md`.
