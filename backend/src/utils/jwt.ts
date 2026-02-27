import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { UserRole } from "@prisma/client";

export interface AccessPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: "access";
}

export interface RefreshPayload {
  sub: string;
  type: "refresh";
}

const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

export function signAccessToken(payload: Omit<AccessPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "access" as const },
    env.jwtAccessSecret,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

export function signRefreshToken(payload: Omit<RefreshPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "refresh" as const },
    env.jwtRefreshSecret,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.jwtAccessSecret) as AccessPayload;
  if (decoded.type !== "access") throw new Error("Token inválido");
  return decoded;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  const decoded = jwt.verify(token, env.jwtRefreshSecret) as RefreshPayload;
  if (decoded.type !== "refresh") throw new Error("Token inválido");
  return decoded;
}
