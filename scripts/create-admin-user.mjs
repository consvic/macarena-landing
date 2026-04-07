#!/usr/bin/env node

import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import process from "node:process";
import { promisify } from "node:util";
import mongoose from "mongoose";

const scryptAsync = promisify(scryptCallback);
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

const USAGE = [
  "Usage:",
  "  npm run admin:create -- --email <email> --password <password>",
  "",
  "Example:",
  '  npm run admin:create -- --email admin@macarena.mx --password "super-secure-pass"',
].join("\n");

const adminUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const AdminUser =
  mongoose.models.AdminUser || mongoose.model("AdminUser", adminUserSchema);

function normalizeEmail(email) {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function assertNonEmptyArgValue(flag, value) {
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}\n\n${USAGE}`);
  }
}

export function parseCliArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    throw new Error(USAGE);
  }

  let email = "";
  let password = "";

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--email") {
      const value = argv[index + 1];
      assertNonEmptyArgValue("--email", value);
      email = normalizeEmail(value);
      index += 1;
      continue;
    }

    if (token === "--password") {
      const value = argv[index + 1];
      assertNonEmptyArgValue("--password", value);
      password = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${token}\n\n${USAGE}`);
  }

  if (!email || !password) {
    throw new Error(`Both --email and --password are required\n\n${USAGE}`);
  }

  if (!isValidEmail(email)) {
    throw new Error(`Invalid email format: ${email}`);
  }

  if (password.trim().length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  return { email, password };
}

export async function hashPassword(password) {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });

  return `scrypt$n=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P}$${Buffer.from(salt).toString("hex")}$${Buffer.from(derivedKey).toString("hex")}`;
}

export async function createAdminUser({ email, password }) {
  const MONGODB_URI = process.env.MONGODB_URI;
  const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? "macarena";

  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  await mongoose.connect(MONGODB_URI, {
    dbName: MONGODB_DB_NAME,
    bufferCommands: false,
  });

  const passwordHash = await hashPassword(password);

  try {
    const created = await AdminUser.create({
      email,
      passwordHash,
    });

    return { email: created.email };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      const code = Reflect.get(error, "code");
      if (code === 11000) {
        throw new Error(`Admin user "${email}" already exists`);
      }
    }

    throw error;
  }
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const result = await createAdminUser(args);
  console.log(`Admin user created successfully: ${result.email}`);
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
