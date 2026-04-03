import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";

const KEY_LENGTH = 64;
const DEFAULT_N = 16384;
const DEFAULT_R = 8;
const DEFAULT_P = 1;
const SALT_BYTES = 16;
const ALGORITHM = "scrypt";

function toHex(input: Buffer | Uint8Array) {
  return Buffer.from(input).toString("hex");
}

function deriveScryptKey(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: {
    N: number;
    r: number;
    p: number;
  },
) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey as Buffer);
    });
  });
}

type ParsedHash = {
  n: number;
  r: number;
  p: number;
  salt: string;
  hash: string;
};

function parseStoredHash(storedHash: string): ParsedHash | null {
  const [algorithm, paramsPart, salt, hash] = storedHash.split("$");

  if (!algorithm || !paramsPart || !salt || !hash) {
    return null;
  }

  if (algorithm !== ALGORITHM) {
    return null;
  }

  const paramsEntries = paramsPart
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [key, value] = entry.split("=");
      if (!key || !value) {
        return null;
      }

      return [key, Number(value)] as const;
    });

  if (paramsEntries.some((entry) => entry === null)) {
    return null;
  }

  const params = Object.fromEntries(
    paramsEntries as ReadonlyArray<readonly [string, number]>,
  );

  const n = Number(params.n);
  const r = Number(params.r);
  const p = Number(params.p);

  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) {
    return null;
  }

  if (!salt || !hash) {
    return null;
  }

  return { n, r, p, salt, hash };
}

export function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string): Promise<string> {
  if (!password || password.trim().length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  const salt = randomBytes(SALT_BYTES);
  const derivedKey = await deriveScryptKey(password, salt, KEY_LENGTH, {
    N: DEFAULT_N,
    r: DEFAULT_R,
    p: DEFAULT_P,
  });

  return `${ALGORITHM}$n=${DEFAULT_N},r=${DEFAULT_R},p=${DEFAULT_P}$${toHex(salt)}$${toHex(derivedKey)}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const parsed = parseStoredHash(storedHash);
  if (!parsed) {
    return false;
  }

  try {
    const saltBuffer = Buffer.from(parsed.salt, "hex");
    const expectedHash = Buffer.from(parsed.hash, "hex");

    if (saltBuffer.length === 0 || expectedHash.length === 0) {
      return false;
    }

    const derived = await deriveScryptKey(
      password,
      saltBuffer,
      expectedHash.length,
      {
        N: parsed.n,
        r: parsed.r,
        p: parsed.p,
      },
    );

    if (derived.length !== expectedHash.length) {
      return false;
    }

    return timingSafeEqual(derived, expectedHash);
  } catch {
    return false;
  }
}
