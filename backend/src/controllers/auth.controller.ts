import { Request, Response } from "express";
import { prisma } from "../config/database";
import { env } from "../config/env";
import { hashPassword, verifyPassword } from "../utils/hash";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { revokeRefreshToken, isRevoked } from "../utils/refreshBlacklist";
import type { RegisterBody, LoginBody } from "../validations/auth.validations";
import { UserRole } from "@prisma/client";

const COOKIE_ACCESS = "access_token";
const COOKIE_REFRESH = "refresh_token";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: env.nodeEnv === "production" ? ("none" as const) : ("lax" as const),
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
const ACCESS_MAX_AGE = 15 * 60 * 1000; // 15 min

export async function register(req: Request, res: Response): Promise<void> {
  const body = (req as any).validBody as RegisterBody;
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    res.status(409).json({ message: "E-mail já cadastrado" });
    return;
  }
  const passwordHash = await hashPassword(body.password);
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash,
      role: UserRole.USER,
    },
  });
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = signRefreshToken({ sub: user.id });
  res.cookie(COOKIE_ACCESS, accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_MAX_AGE });
  res.cookie(COOKIE_REFRESH, refreshToken, COOKIE_OPTIONS);
  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = (req as any).validBody as LoginBody;
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user || !(await verifyPassword(user.passwordHash, body.password))) {
    res.status(401).json({ message: "E-mail ou senha inválidos" });
    return;
  }
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = signRefreshToken({ sub: user.id });
  res.cookie(COOKIE_ACCESS, accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_MAX_AGE });
  res.cookie(COOKIE_REFRESH, refreshToken, COOKIE_OPTIONS);
  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[COOKIE_REFRESH];
  if (!token) {
    res.status(401).json({ message: "Refresh token não enviado" });
    return;
  }
  if (isRevoked(token)) {
    res.clearCookie(COOKIE_ACCESS);
    res.clearCookie(COOKIE_REFRESH);
    res.status(401).json({ message: "Sessão encerrada. Faça login novamente." });
    return;
  }
  try {
    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      res.status(401).json({ message: "Usuário não encontrado" });
      return;
    }
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    res.cookie(COOKIE_ACCESS, accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_MAX_AGE });
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch {
    res.clearCookie(COOKIE_ACCESS);
    res.clearCookie(COOKIE_REFRESH);
    res.status(401).json({ message: "Token inválido ou expirado" });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[COOKIE_REFRESH];
  if (token) revokeRefreshToken(token);
  res.clearCookie(COOKIE_ACCESS);
  res.clearCookie(COOKIE_REFRESH);
  res.json({ message: "Logout realizado" });
}
