import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const first = result.error.errors[0];
      const message = first ? `${first.path.join(".")}: ${first.message}` : "Dados inválidos";
      res.status(400).json({ message });
      return;
    }
    (req as any).validBody = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const first = result.error.errors[0];
      const message = first ? `${first.path.join(".")}: ${first.message}` : "Parâmetros inválidos";
      res.status(400).json({ message });
      return;
    }
    (req as any).validQuery = result.data;
    next();
  };
}
