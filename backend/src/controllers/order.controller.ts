import { Request, Response } from "express";
import { prisma } from "../config/database";

export async function listMyOrders(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Não autenticado" });
    return;
  }
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true, mainImageUrl: true } },
        },
      },
    },
  });
  res.json(orders);
}

export async function getOrder(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Não autenticado" });
    return;
  }
  const id = req.params.id as string;
  const order = await prisma.order.findFirst({
    where: { id, userId: req.user.id },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true, mainImageUrl: true, price: true } },
        },
      },
    },
  });
  if (!order) {
    res.status(404).json({ message: "Pedido não encontrado" });
    return;
  }
  res.json(order);
}
