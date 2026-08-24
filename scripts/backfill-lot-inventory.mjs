#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import mongoose from "mongoose";

const CREATED_BY = "inventory-backfill-script";
const ACTIVE_ORDER_STATUSES = [
  "pending_confirmation",
  "confirmed",
  "paid",
  "delivered",
];
const DEFAULT_INPUT_URL = new URL(
  "./lot-inventory-backfill.json",
  import.meta.url,
);
const USAGE = [
  "Usage:",
  "  npm run backfill:lot-inventory",
  "  npm run backfill:lot-inventory -- --dry-run",
  "  npm run backfill:lot-inventory -- --apply",
  "  npm run backfill:lot-inventory -- <json-path> [--dry-run|--apply]",
].join("\n");

const flavorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    exists: Boolean,
    isVisibleOnSite: Boolean,
    isArchived: Boolean,
    inventoryManaged: Boolean,
    updatedBy: String,
  },
  { timestamps: true, versionKey: false, strict: false },
);

const orderSchema = new mongoose.Schema(
  {
    status: String,
    externalOrderId: String,
  },
  { timestamps: true, versionKey: false, strict: false },
);

const orderItemSchema = new mongoose.Schema(
  {
    orderId: mongoose.Schema.Types.ObjectId,
    flavorId: mongoose.Schema.Types.ObjectId,
    flavorName: String,
    presentation: String,
    quantity: Number,
    lotAllocations: [
      {
        _id: false,
        lotId: mongoose.Schema.Types.ObjectId,
        quantity: Number,
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
    strict: false,
    collection: "order-items",
  },
);

const lotSchema = new mongoose.Schema(
  {
    flavorId: { type: mongoose.Schema.Types.ObjectId, required: true },
    packed: {
      halfLiter: { type: Number, required: true },
      liter: { type: Number, required: true },
    },
    remaining: {
      halfLiter: { type: Number, required: true },
      liter: { type: Number, required: true },
    },
    adjustments: { type: Array, default: () => [] },
    createdBy: { type: String, required: true },
  },
  { timestamps: true, versionKey: false, collection: "lots" },
);

const Flavor = mongoose.models.Flavor || mongoose.model("Flavor", flavorSchema);
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
const OrderItem =
  mongoose.models.OrderItem || mongoose.model("OrderItem", orderItemSchema);
const Lot = mongoose.models.Lot || mongoose.model("Lot", lotSchema);

function normalizeName(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("es-MX");
}

function parseQuantity(value, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return parsed;
}

export function parseCliArgs(argv) {
  const apply = argv.includes("--apply");
  const dryRun = argv.includes("--dry-run");
  if (apply && dryRun) {
    throw new Error(`Choose either --dry-run or --apply\n\n${USAGE}`);
  }
  const unknownFlags = argv.filter(
    (value) =>
      value.startsWith("--") && value !== "--apply" && value !== "--dry-run",
  );
  if (unknownFlags.length > 0) {
    throw new Error(`Unknown argument: ${unknownFlags[0]}\n\n${USAGE}`);
  }
  const paths = argv.filter((value) => !value.startsWith("--"));
  if (paths.length > 1) throw new Error(USAGE);

  return {
    apply,
    inputPath: paths[0] ? path.resolve(process.cwd(), paths[0]) : null,
  };
}

export function parseInventoryInput(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Inventory input must be a non-empty array");
  }

  const seenNames = new Set();
  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`Inventory entry ${index + 1} must be an object`);
    }
    const name = String(entry.name ?? "").trim();
    if (!name) throw new Error(`Inventory entry ${index + 1} requires a name`);
    const normalizedName = normalizeName(name);
    if (seenNames.has(normalizedName)) {
      throw new Error(`Duplicate inventory flavor: ${name}`);
    }
    seenNames.add(normalizedName);

    const halfLiter = parseQuantity(entry.halfLiter, `${name}.halfLiter`);
    const liter = parseQuantity(entry.liter, `${name}.liter`);
    if (halfLiter + liter === 0) {
      throw new Error(`${name} must include at least one container`);
    }
    return { name, normalizedName, packed: { halfLiter, liter } };
  });
}

export function buildRecentOrdersFilter(start, end) {
  return {
    createdAt: { $gte: start, $lte: end },
    status: { $in: ACTIVE_ORDER_STATUSES },
    $or: [
      { externalOrderId: { $exists: false } },
      { externalOrderId: null },
      { externalOrderId: "" },
    ],
  };
}

export function buildBackfillPlan({
  inventory,
  activeFlavors,
  existingLotFlavorIds,
  recentOrderItems,
}) {
  const activeByName = new Map();
  for (const flavor of activeFlavors) {
    const key = normalizeName(flavor.name);
    if (activeByName.has(key)) {
      throw new Error(`Multiple active flavors match: ${flavor.name}`);
    }
    activeByName.set(key, flavor);
  }

  const targets = inventory.map((entry) => {
    const flavor = activeByName.get(entry.normalizedName);
    if (!flavor) throw new Error(`Active flavor not found: ${entry.name}`);
    if (flavor.inventoryManaged) {
      throw new Error(`Flavor already uses inventory: ${flavor.name}`);
    }
    if (existingLotFlavorIds.has(String(flavor._id))) {
      throw new Error(`Flavor already has a lot: ${flavor.name}`);
    }
    return {
      ...entry,
      flavorId: String(flavor._id),
      flavorName: String(flavor.name),
      deducted: { halfLiter: 0, liter: 0 },
      orderItems: [],
    };
  });
  const targetsById = new Map(
    targets.map((target) => [target.flavorId, target]),
  );
  const targetsByName = new Map(
    targets.map((target) => [target.normalizedName, target]),
  );

  for (const item of recentOrderItems) {
    const flavorId = item.flavorId ? String(item.flavorId) : "";
    const target = targetsById.get(flavorId);
    if (!target) {
      if (!flavorId && targetsByName.has(normalizeName(item.flavorName))) {
        throw new Error(
          `Recent order item for ${item.flavorName} is missing flavorId`,
        );
      }
      continue;
    }
    if (Array.isArray(item.lotAllocations) && item.lotAllocations.length > 0) {
      throw new Error(`Order item ${item._id} already has lot allocations`);
    }
    const quantity = parseQuantity(
      item.quantity,
      `Order item ${item._id} quantity`,
    );
    if (quantity < 1) {
      throw new Error(`Order item ${item._id} quantity must be at least 1`);
    }
    const field =
      item.presentation === "1/2 litro"
        ? "halfLiter"
        : item.presentation === "1 litro"
          ? "liter"
          : null;
    if (!field) {
      throw new Error(
        `Order item ${item._id} has invalid presentation: ${item.presentation}`,
      );
    }
    target.deducted[field] += quantity;
    target.orderItems.push({ _id: item._id, quantity });
  }

  return targets.map((target) => {
    const remaining = {
      halfLiter: target.packed.halfLiter - target.deducted.halfLiter,
      liter: target.packed.liter - target.deducted.liter,
    };
    if (remaining.halfLiter < 0 || remaining.liter < 0) {
      throw new Error(
        `${target.flavorName} recent orders exceed packed inventory: ` +
          `packed=${target.packed.halfLiter}/${target.packed.liter} ` +
          `deducted=${target.deducted.halfLiter}/${target.deducted.liter}`,
      );
    }
    return { ...target, remaining };
  });
}

async function loadPlan(inventory, start, end) {
  const activeFlavors = await Flavor.find({
    exists: true,
    isVisibleOnSite: { $ne: false },
    isArchived: { $ne: true },
  }).lean();
  const recentOrders = await Order.find(buildRecentOrdersFilter(start, end))
    .select({ _id: 1 })
    .lean();
  const recentOrderItems = recentOrders.length
    ? await OrderItem.find({
        orderId: { $in: recentOrders.map((order) => order._id) },
      }).lean()
    : [];
  const targetNames = new Set(inventory.map((entry) => entry.normalizedName));
  const candidateFlavorIds = activeFlavors
    .filter((flavor) => targetNames.has(normalizeName(flavor.name)))
    .map((flavor) => flavor._id);
  const existingLots = candidateFlavorIds.length
    ? await Lot.find({ flavorId: { $in: candidateFlavorIds } })
        .select({ flavorId: 1 })
        .lean()
    : [];

  return buildBackfillPlan({
    inventory,
    activeFlavors,
    existingLotFlavorIds: new Set(
      existingLots.map((lot) => String(lot.flavorId)),
    ),
    recentOrderItems,
  });
}

function printPlan(plan, start, end, apply) {
  console.log(`Mode: ${apply ? "APPLY" : "DRY RUN"}`);
  console.log(
    `Order window: ${start.toISOString()} through ${end.toISOString()}`,
  );
  console.table(
    plan.map((entry) => ({
      flavor: entry.flavorName,
      "packed 1/2L": entry.packed.halfLiter,
      "packed 1L": entry.packed.liter,
      "orders 1/2L": entry.deducted.halfLiter,
      "orders 1L": entry.deducted.liter,
      "remaining 1/2L": entry.remaining.halfLiter,
      "remaining 1L": entry.remaining.liter,
    })),
  );
  if (!apply)
    console.log("No database changes made. Re-run with --apply to write.");
}

async function applyPlan(plan) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const flavorIds = plan.map((entry) => entry.flavorId);
      const eligibleCount = await Flavor.countDocuments({
        _id: { $in: flavorIds },
        exists: true,
        isVisibleOnSite: { $ne: false },
        isArchived: { $ne: true },
        inventoryManaged: { $ne: true },
      }).session(session);
      if (eligibleCount !== plan.length) {
        throw new Error("Flavor state changed after validation; aborting");
      }
      const existingLot = await Lot.exists({
        flavorId: { $in: flavorIds },
      }).session(session);
      if (existingLot) throw new Error("A target flavor already has a lot");

      const createdLots = await Lot.insertMany(
        plan.map((entry) => ({
          flavorId: entry.flavorId,
          packed: entry.packed,
          remaining: entry.remaining,
          adjustments: [],
          createdBy: CREATED_BY,
        })),
        { session },
      );
      const lotByFlavorId = new Map(
        createdLots.map((lot) => [String(lot.flavorId), lot._id]),
      );
      const allocationOperations = plan.flatMap((entry) =>
        entry.orderItems.map((item) => ({
          updateOne: {
            filter: {
              _id: item._id,
              $or: [
                { lotAllocations: { $exists: false } },
                { lotAllocations: { $size: 0 } },
              ],
            },
            update: {
              $set: {
                lotAllocations: [
                  {
                    lotId: lotByFlavorId.get(entry.flavorId),
                    quantity: item.quantity,
                  },
                ],
              },
            },
          },
        })),
      );
      if (allocationOperations.length > 0) {
        const allocationResult = await OrderItem.bulkWrite(
          allocationOperations,
          {
            session,
          },
        );
        if (allocationResult.modifiedCount !== allocationOperations.length) {
          throw new Error(
            "Recent order items changed after validation; aborting",
          );
        }
      }
      const flavorResult = await Flavor.updateMany(
        { _id: { $in: flavorIds }, inventoryManaged: { $ne: true } },
        { $set: { inventoryManaged: true, updatedBy: CREATED_BY } },
        { session },
      );
      if (flavorResult.modifiedCount !== plan.length) {
        throw new Error("Not every flavor was enabled; aborting");
      }
    });
  } finally {
    await session.endSession();
  }
}

async function main() {
  const { apply, inputPath } = parseCliArgs(process.argv.slice(2));
  const rawInput = await fs.readFile(inputPath ?? DEFAULT_INPUT_URL, "utf8");
  const inventory = parseInventoryInput(JSON.parse(rawInput));
  const MONGODB_URI = process.env.MONGODB_URI;
  const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? "macarena";
  if (!MONGODB_URI) throw new Error("Missing MONGODB_URI environment variable");

  await mongoose.connect(MONGODB_URI, {
    dbName: MONGODB_DB_NAME,
    bufferCommands: false,
  });
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  const plan = await loadPlan(inventory, start, end);
  printPlan(plan, start, end, apply);
  if (apply) {
    await applyPlan(plan);
    console.log(`Created ${plan.length} lots and enabled inventory tracking.`);
  }
}

const entrypoint = process.argv[1]
  ? new URL(process.argv[1], "file:").href
  : null;
if (entrypoint && import.meta.url === entrypoint) {
  main()
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.connection.close().catch(() => undefined);
    });
}
