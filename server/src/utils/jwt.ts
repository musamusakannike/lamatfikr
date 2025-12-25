import jwt from "jsonwebtoken";

import { env } from "../config/env";

export type AccessTokenPayload = {
  sub: string;
};

export type RefreshTokenPayload = {
  sub: string;
  type: "refresh";
};

const REFRESH_SECRET = env.JWT_REFRESH_SECRET || env.JWT_ACCESS_SECRET;

export function signAccessToken(userId: string) {
  return jwt.sign({ sub: userId } satisfies AccessTokenPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: "30d",
  });
}

export function signRefreshToken(userId: string) {
  return jwt.sign(
    { sub: userId, type: "refresh" } satisfies RefreshTokenPayload,
    REFRESH_SECRET,
    { expiresIn: "150d" }
  );
}

export function verifyAccessToken(token: string) {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  return decoded;
}

export function verifyRefreshToken(token: string) {
  const decoded = jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
  if (decoded.type !== "refresh") {
    throw new Error("Invalid token type");
  }
  return decoded;
}
