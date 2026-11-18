import { randomBytes, scrypt as deriveKey, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(deriveKey);
const options = { N: 2 ** 16, r: 8, p: 2, maxmem: 80 * 1024 * 1024 };
const dummyHash = "0".repeat(96);

export async function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const key = await scrypt(password, salt, 32, options);
  return salt + key.toString("hex");
}

export async function verifyPassword(password, savedHash = dummyHash) {
  const computed = await hashPassword(password, savedHash.slice(0, 32));
  return timingSafeEqual(Buffer.from(savedHash, "hex"), Buffer.from(computed, "hex"));
}
