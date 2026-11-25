import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const PREFIX = "scrypt$";

export function isHashedPassword(value) {
  return typeof value === "string" && value.startsWith(PREFIX);
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `${PREFIX}${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  if (typeof stored !== "string" || !stored) return false;
  if (!isHashedPassword(stored)) return password === stored;

  const [salt, hash] = stored.slice(PREFIX.length).split(":");
  if (!salt || !hash) return false;

  const derived = await scrypt(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === derived.length && timingSafeEqual(derived, expected);
}
