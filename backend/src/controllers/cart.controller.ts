import { Request, Response } from "express";
import { prisma } from "../config/database";
import type { AddCartItemBody, UpdateCartItemBody } from "../validations/cart.validations";
import { Decimal } from "@prisma/client/runtime/library";
import crypto from "crypto";

const CART_TOKEN_COOKIE = "cart_token";
const CART_TOKEN_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year

function getCartToken(req: Request): string | null {
  return req.cookies?.[CART_TOKEN_COOKIE] ?? (req.query.cart_token as string) ?? null;
}

function setCartTokenCookie(res: Response, token: string): void {
  res.cookie(CART_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: CART_TOKEN_MAX_AGE,
    sameSite: process.env.NODE_ENV === "production" ? "none" as const : "lax" as const,
  });
}

async function getOrCreateCart(req: Request, res: Response): Promise<{ id: string; userId: string | null } | null> {
  if (req.user) {
    let cart = await prisma.cart.findFirst({
      where: { userId: req.user.id },
      include: { items: { include: { product: { select: { id: true, name: true, slug: true, mainImageUrl: true, stock: true } } } },
      },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user.id },
        include: { items: { include: { product: { select: { id: true, name: true, slug: true, mainImageUrl: true, stock: true } } } },
        },
      });
    }
    return { id: cart.id, userId: cart.userId };
  }
  const token = getCartToken(req);
  if (token) {
    const cart = await prisma.cart.findUnique({
      where: { cartToken: token },
      include: { items: { include: { product: { select: { id: true, name: true, slug: true, mainImageUrl: true, stock: true } } } },
      },
    });
    if (cart) return { id: cart.id, userId: cart.userId };
  }
  const newToken = crypto.randomBytes(24).toString("hex");
  const cart = await prisma.cart.create({
    data: { cartToken: newToken },
    include: { items: { include: { product: { select: { id: true, name: true, slug: true, mainImageUrl: true, stock: true } } } },
    },
  });
  setCartTokenCookie(res, newToken);
  return { id: cart.id, userId: cart.userId };
}

export async function getCart(req: Request, res: Response): Promise<void> {
  const cart = await prisma.cart.findFirst({
    where: req.user
      ? { userId: req.user.id }
      : { cartToken: getCartToken(req) ?? undefined },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, slug: true, mainImageUrl: true, stock: true, price: true },
          },
        },
      },
    },
  });
  if (!cart) {
    res.json({ id: null, items: [], total: 0 });
    return;
  }
  const items = cart.items.map((i) => ({
    id: i.id,
    productId: i.productId,
    quantity: i.quantity,
    unitPrice: Number(i.unitPrice),
    product: i.product,
  }));
  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  res.json({ id: cart.id, items, total });
}

export async function addItem(req: Request, res: Response): Promise<void> {
  const cartRecord = await getOrCreateCart(req, res);
  if (!cartRecord) {
    res.status(500).json({ message: "Erro ao obter carrinho" });
    return;
  }
  const body = (req as any).validBody as AddCartItemBody;
  const product = await prisma.product.findUnique({
    where: { id: body.productId, isActive: true },
  });
  if (!product) {
    res.status(404).json({ message: "Produto não encontrado" });
    return;
  }
  if (product.stock < body.quantity) {
    res.status(400).json({ message: `Estoque disponível: ${product.stock}` });
    return;
  }
  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cartRecord.id, productId: product.id },
  });
  if (existing) {
    const newQty = Math.min(product.stock, existing.quantity + body.quantity);
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cartRecord.id,
        productId: product.id,
        quantity: body.quantity,
        unitPrice: product.price,
      },
    });
  }
  const cart = await prisma.cart.findUnique({
    where: { id: cartRecord.id },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true, mainImageUrl: true, stock: true, price: true } },
        },
      },
    },
  });
  const items = cart!.items.map((i) => ({
    id: i.id,
    productId: i.productId,
    quantity: i.quantity,
    unitPrice: Number(i.unitPrice),
    product: i.product,
  }));
  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  res.status(201).json({ id: cart!.id, items, total });
}

export async function updateItem(req: Request, res: Response): Promise<void> {
  const itemId = req.params.itemId as string;
  const body = (req as any).validBody as UpdateCartItemBody;

  const cart = await prisma.cart.findFirst({
    where: req.user ? { userId: req.user.id } : { cartToken: getCartToken(req) ?? undefined },
    include: { items: true },
  });
  if (!cart) {
    res.status(404).json({ message: "Carrinho não encontrado" });
    return;
  }
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) {
    res.status(404).json({ message: "Item não encontrado" });
    return;
  }
  const product = await prisma.product.findUnique({ where: { id: item.productId } });
  const qty = Math.min(body.quantity, product?.stock ?? 0);
  if (qty < 1) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    res.json({ message: "Item removido (estoque insuficiente)" });
    return;
  }
  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity: qty },
  });
  const updated = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true, mainImageUrl: true, stock: true, price: true } },
        },
      },
    },
  });
  const items = updated!.items.map((i) => ({
    id: i.id,
    productId: i.productId,
    quantity: i.quantity,
    unitPrice: Number(i.unitPrice),
    product: i.product,
  }));
  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  res.json({ id: updated!.id, items, total });
}

export async function removeItem(req: Request, res: Response): Promise<void> {
  const itemId = req.params.itemId as string;
  const cart = await prisma.cart.findFirst({
    where: req.user ? { userId: req.user.id } : { cartToken: getCartToken(req) ?? undefined },
    include: { items: true },
  });
  if (!cart) {
    res.status(404).json({ message: "Carrinho não encontrado" });
    return;
  }
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) {
    res.status(404).json({ message: "Item não encontrado" });
    return;
  }
  await prisma.cartItem.delete({ where: { id: itemId } });
  const updated = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true, mainImageUrl: true, stock: true, price: true } },
        },
      },
    },
  });
  const items = (updated?.items ?? []).map((i) => ({
    id: i.id,
    productId: i.productId,
    quantity: i.quantity,
    unitPrice: Number(i.unitPrice),
    product: i.product,
  }));
  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  res.json({ id: updated?.id ?? null, items, total });
}
