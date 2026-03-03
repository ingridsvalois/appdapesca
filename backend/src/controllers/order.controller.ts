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

  const now = new Date();
  const pendingThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const paid = orders.filter((o) => o.paymentStatus === "paid");
  const pending = orders.filter(
    (o) =>
      o.paymentStatus !== "paid" &&
      o.createdAt >= pendingThreshold
  );

  res.json({
    paid,
    pending,
  });
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

export async function confirmDelivery(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Não autenticado" });
    return;
  }
  const id = req.params.id as string;
  const order = await prisma.order.findFirst({
    where: { id, userId: req.user.id },
  });
  if (!order) {
    res.status(404).json({ message: "Pedido não encontrado" });
    return;
  }
  if (order.status !== "SHIPPED" || order.paymentStatus !== "paid") {
    res.status(400).json({ message: "Este pedido não pode ser marcado como entregue." });
    return;
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: "DELIVERED",
      deliveredAt: new Date(),
    },
  });

  res.json(updated);
}
