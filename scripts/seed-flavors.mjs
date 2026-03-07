#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import mongoose from "mongoose";

const [, , inputPathArg, ...flags] = process.argv;
const shouldReplace = flags.includes("--replace");

if (!inputPathArg) {
  console.error(
    "Usage: node --env-file=.env scripts/seed-flavors.mjs <json-path> [--replace]",
  );
  process.exit(1);
}

const projectRoot = process.cwd();
const resolvedPath = path.isAbsolute(inputPathArg)
  ? inputPathArg
  : path.resolve(projectRoot, inputPathArg);

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? "macarena";

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI environment variable.");
  process.exit(1);
}

const flavorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    base: { type: String, required: true, trim: true },
    tags: [{ type: String, required: true, trim: true }],
    price: {
      halfLiter: { type: Number, required: true, min: 0 },
      liter: { type: Number, required: true, min: 0 },
    },
    allergens: { type: String, required: true, trim: true },
    gradient: { type: String, required: true, trim: true },
    coverImage: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Flavor = mongoose.models.Flavor || mongoose.model("Flavor", flavorSchema);

function parseMoney(value) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = Number.parseFloat(value.replace(/[^\d.]/g, ""));
    return Number.isNaN(normalized) ? null : normalized;
  }

  return null;
}

function parsePriceByPresentation(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value;
  const halfLiterRaw = candidate.halfLiter;
  const literRaw = candidate.liter;

  const halfLiter = parseMoney(halfLiterRaw);
  const liter = parseMoney(literRaw);

  if (halfLiter === null || liter === null) {
    return null;
  }

  return { halfLiter, liter };
}

function normalizeFlavor(rawFlavor, index) {
  if (!rawFlavor || typeof rawFlavor !== "object") {
    throw new Error(`Flavor at index ${index} is not an object`);
  }

  const flavor = rawFlavor;

  if (!flavor.name || typeof flavor.name !== "string") {
    throw new Error(`Flavor at index ${index} is missing a valid name`);
  }

  const price = parsePriceByPresentation(flavor.price);

  if (!price) {
    throw new Error(
      `Flavor "${flavor.name}" must include price.halfLiter and price.liter`,
    );
  }

  if (!flavor.coverImage || typeof flavor.coverImage !== "string") {
    throw new Error(`Flavor "${flavor.name}" must include coverImage`);
  }

  return {
    name: flavor.name,
    description: String(flavor.description ?? ""),
    category: String(flavor.category ?? ""),
    base: String(flavor.base ?? ""),
    tags: Array.isArray(flavor.tags)
      ? flavor.tags.map((tag) => String(tag))
      : [],
    price,
    allergens: String(flavor.allergens ?? ""),
    gradient: String(flavor.gradient ?? ""),
    coverImage: flavor.coverImage,
  };
}

async function main() {
  const content = await fs.readFile(resolvedPath, "utf-8");
  const parsed = JSON.parse(content);

  if (!Array.isArray(parsed)) {
    throw new Error("Seed JSON must be an array of flavors");
  }

  const normalizedFlavors = parsed.map((item, index) =>
    normalizeFlavor(item, index),
  );

  await mongoose.connect(MONGODB_URI, {
    dbName: MONGODB_DB_NAME,
    bufferCommands: false,
  });

  const operations = normalizedFlavors.map((flavor) => ({
    updateOne: {
      filter: { name: flavor.name },
      update: { $set: flavor },
      upsert: true,
    },
  }));

  const result = await Flavor.bulkWrite(operations, { ordered: false });

  if (shouldReplace) {
    const seedNames = normalizedFlavors.map((flavor) => flavor.name);
    const deleteResult = await Flavor.deleteMany({ name: { $nin: seedNames } });
    console.log(
      `Deleted ${deleteResult.deletedCount ?? 0} flavors not in seed.`,
    );
  }

  console.log(
    `Flavors upserted. matched=${result.matchedCount} modified=${result.modifiedCount} upserted=${result.upsertedCount}`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close().catch(() => undefined);
  });
