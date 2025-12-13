import crypto from "crypto";

export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

export function generateVerificationToken(): string {
  return generateToken(32);
}
