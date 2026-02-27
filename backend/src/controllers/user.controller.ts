import { Request, Response } from "express";
import { prisma } from "../config/database";
import type { UpdateMeBody, AddressBody } from "../validations/user.validations";

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Não autenticado" });
    return;
  }
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!user) {
    res.status(404).json({ message: "Usuário não encontrado" });
    return;
  }
  res.json(user);
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Não autenticado" });
    return;
  }
  const body = (req as any).validBody as UpdateMeBody;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: body,
    select: { id: true, name: true, email: true, role: true },
  });
  res.json(user);
}

export async function getAddresses(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Não autenticado" });
    return;
  }
  const list = await prisma.address.findMany({
    where: { userId: req.user.id },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });
  res.json(list);
}

export async function createAddress(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Não autenticado" });
    return;
  }
  const body = (req as any).validBody as AddressBody;
  if (body.isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id },
      data: { isDefault: false },
    });
  }
  const address = await prisma.address.create({
    data: {
      userId: req.user.id,
      street: body.street,
      number: body.number,
      complement: body.complement ?? null,
      district: body.district,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      isDefault: body.isDefault ?? false,
    },
  });
  res.status(201).json(address);
}

export async function updateAddress(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Não autenticado" });
    return;
  }
  const id = req.params.id as string;
  const body = (req as any).validBody as AddressBody;
  const existing = await prisma.address.findFirst({
    where: { id, userId: req.user.id },
  });
  if (!existing) {
    res.status(404).json({ message: "Endereço não encontrado" });
    return;
  }
  if (body.isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id },
      data: { isDefault: false },
    });
  }
  const address = await prisma.address.update({
    where: { id },
    data: {
      street: body.street,
      number: body.number,
      complement: body.complement ?? null,
      district: body.district,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      isDefault: body.isDefault ?? false,
    },
  });
  res.json(address);
}

export async function deleteAddress(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Não autenticado" });
    return;
  }
  const id = req.params.id as string;
  const existing = await prisma.address.findFirst({
    where: { id, userId: req.user.id },
  });
  if (!existing) {
    res.status(404).json({ message: "Endereço não encontrado" });
    return;
  }
  await prisma.address.delete({ where: { id } });
  res.status(204).send();
}
