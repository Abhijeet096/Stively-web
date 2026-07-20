import bcrypt from "bcryptjs";

/**
 * Cost factor 12 - bcryptjs's own recommendation for 2024+ hardware (10 is
 * the historical default but is now crackable meaningfully faster). Kept as
 * a named constant since it's referenced by nothing else, but a future
 * "upgrade cost factor" change should only need to happen here.
 */
const SALT_ROUNDS = 12;

export function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}
