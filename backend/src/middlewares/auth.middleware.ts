import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { UserRole } from "@prisma/client";

const COOKIE_ACCESS = "access_token";

/**
 * Lê o access token do cookie "access_token" ou do header Authorization (Bearer)
 * e define req.user. Não falha se não houver token (req.user fica undefined).
 */
export function auth(req: Request, _res: Response, next: NextFunction): void {
  const token =
    req.cookies?.[COOKIE_ACCESS] ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null);

  if (!token) {
    return next();
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    // Token inválido ou expirado — não setamos req.user
  }
  next();
}

/**
 * Exige que req.user exista. Retorna 401 se não autenticado.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ message: "Não autenticado" });
    return;
  }
  next();
}

/**
 * Exige que o usuário seja ADMIN. Deve ser usado após requireAuth.
 */
export function isAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== UserRole.ADMIN) {
    res.status(403).json({ message: "Acesso negado. Apenas administradores." });
    return;
  }
  next();
}
