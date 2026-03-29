#!/usr/bin/env node

import process from "node:process";
import mongoose from "mongoose";

const [, , existsArg] = process.argv;
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? "macarena";

if (!["true", "false"].includes(existsArg ?? "")) {
  console.error(
    "Usage: node --env-file=.env scripts/backfill-flavor-existence.mjs <true|false>",
  );
  process.exit(1);
}

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI environment variable.");
  process.exit(1);
}

const exists = existsArg === "true";

const flavorSchema = new mongoose.Schema(
  {
    exists: { type: Boolean, required: true, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: false,
  },
);

const Flavor = mongoose.models.Flavor || mongoose.model("Flavor", flavorSchema);

async function main() {
  await mongoose.connect(MONGODB_URI, {
    dbName: MONGODB_DB_NAME,
    bufferCommands: false,
  });

  const result = await Flavor.updateMany({}, { $set: { exists } });

  console.log(
    `Flavor existence updated to ${exists}. matched=${result.matchedCount} modified=${result.modifiedCount}`,
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
