import { Request, Response } from "express";
import { prisma } from "../config/database";

export async function list(_req: Request, res: Response): Promise<void> {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
  res.json(categories);
}
