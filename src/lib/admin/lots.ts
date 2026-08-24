import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { FlavorModel } from "@/models/Flavor";
import { LotModel } from "@/models/Lot";

type QuantityInput = {
  halfLiter?: unknown;
  liter?: unknown;
};

type AdjustmentInput = QuantityInput & {
  reason?: unknown;
};

function parseInteger(value: unknown, label: string) {
  const parsed = value == null || value === "" ? 0 : Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${label} must be an integer`);
  }
  return parsed;
}

function parsePackedQuantities(input: QuantityInput) {
  const halfLiter = parseInteger(input.halfLiter, "halfLiter");
  const liter = parseInteger(input.liter, "liter");
  if (halfLiter < 0 || liter < 0) {
    throw new Error("Lot quantities cannot be negative");
  }
  if (halfLiter + liter === 0) {
    throw new Error("At least one container is required");
  }
  return { halfLiter, liter };
}

function mapLot(lot: Record<string, unknown>) {
  const packed = lot.packed as Record<string, unknown>;
  const remaining = lot.remaining as Record<string, unknown>;
  const adjustments = Array.isArray(lot.adjustments) ? lot.adjustments : [];

  return {
    _id: String(lot._id),
    flavorId: String(lot.flavorId),
    packed: {
      halfLiter: Number(packed?.halfLiter ?? 0),
      liter: Number(packed?.liter ?? 0),
    },
    remaining: {
      halfLiter: Number(remaining?.halfLiter ?? 0),
      liter: Number(remaining?.liter ?? 0),
    },
    adjustments: adjustments.map((entry) => {
      const adjustment = entry as Record<string, unknown>;
      return {
        halfLiter: Number(adjustment.halfLiter ?? 0),
        liter: Number(adjustment.liter ?? 0),
        reason: String(adjustment.reason ?? ""),
        adjustedBy: String(adjustment.adjustedBy ?? ""),
        adjustedAt: new Date(
          adjustment.adjustedAt as string | Date,
        ).toISOString(),
      };
    }),
    createdBy: String(lot.createdBy ?? ""),
    createdAt: new Date(lot.createdAt as string | Date).toISOString(),
    updatedAt: new Date(lot.updatedAt as string | Date).toISOString(),
  };
}

export async function listAdminLots(flavorId: string) {
  if (!mongoose.Types.ObjectId.isValid(flavorId)) {
    throw new Error("Invalid flavor id");
  }

  await connectToDatabase();
  const lots = await LotModel.find({ flavorId }).sort({ createdAt: -1 }).lean();
  const data = lots.map((lot) => mapLot(lot as Record<string, unknown>));

  return {
    data,
    totals: data.reduce(
      (totals, lot) => ({
        halfLiter: totals.halfLiter + lot.remaining.halfLiter,
        liter: totals.liter + lot.remaining.liter,
      }),
      { halfLiter: 0, liter: 0 },
    ),
  };
}

export async function createAdminLot(
  flavorId: string,
  input: QuantityInput,
  adminUser: string,
) {
  if (!mongoose.Types.ObjectId.isValid(flavorId)) {
    throw new Error("Invalid flavor id");
  }
  const packed = parsePackedQuantities(input);
  const database = await connectToDatabase();
  const session = await database.startSession();
  let createdLot: Record<string, unknown> | null = null;

  try {
    await session.withTransaction(async () => {
      const flavor = await FlavorModel.findOne(
        { _id: flavorId, isArchived: { $ne: true } },
        null,
        { session },
      ).lean();
      if (!flavor) {
        throw new Error("Flavor not found");
      }

      const [created] = await LotModel.create(
        [
          {
            flavorId,
            packed,
            remaining: packed,
            createdBy: adminUser,
          },
        ],
        { session },
      );
      await FlavorModel.updateOne(
        { _id: flavorId },
        { $set: { inventoryManaged: true, updatedBy: adminUser } },
        { session },
      );
      createdLot = created.toObject() as Record<string, unknown>;
    });
  } finally {
    await session.endSession();
  }

  if (!createdLot) {
    throw new Error("Lot could not be created");
  }
  return mapLot(createdLot);
}

export async function adjustAdminLot(
  id: string,
  input: AdjustmentInput,
  adminUser: string,
) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid lot id");
  }
  const halfLiter = parseInteger(input.halfLiter, "halfLiter");
  const liter = parseInteger(input.liter, "liter");
  const reason = String(input.reason ?? "").trim();

  if (halfLiter === 0 && liter === 0) {
    throw new Error("At least one adjustment is required");
  }
  if (!reason) {
    throw new Error("Adjustment reason is required");
  }

  await connectToDatabase();
  const filter: Record<string, unknown> = { _id: id };
  if (halfLiter < 0) {
    filter["remaining.halfLiter"] = { $gte: -halfLiter };
  }
  if (liter < 0) {
    filter["remaining.liter"] = { $gte: -liter };
  }

  const updated = await LotModel.findOneAndUpdate(
    filter,
    {
      $inc: {
        "remaining.halfLiter": halfLiter,
        "remaining.liter": liter,
      },
      $push: {
        adjustments: {
          halfLiter,
          liter,
          reason,
          adjustedBy: adminUser,
          adjustedAt: new Date(),
        },
      },
    },
    { new: true, runValidators: true },
  ).lean();

  if (!updated) {
    const exists = await LotModel.exists({ _id: id });
    throw new Error(exists ? "Insufficient lot inventory" : "Lot not found");
  }
  return mapLot(updated as Record<string, unknown>);
}
