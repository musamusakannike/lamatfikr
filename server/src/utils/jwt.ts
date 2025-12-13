import jwt from "jsonwebtoken";

import { env } from "../config/env";

export type AccessTokenPayload = {
  sub: string;
};

export function signAccessToken(userId: string) {
  return jwt.sign({ sub: userId } satisfies AccessTokenPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });
}

export function verifyAccessToken(token: string) {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  return decoded;
}
