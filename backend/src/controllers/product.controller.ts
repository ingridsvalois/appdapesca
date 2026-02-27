import { Request, Response } from "express";
import { prisma } from "../config/database";
import type { ProductListQuery, ReviewBody } from "../validations/product.validations";
import { Decimal } from "@prisma/client/runtime/library";

export async function list(req: Request, res: Response): Promise<void> {
  const q = (req as any).validQuery as ProductListQuery;
  const page = Math.max(1, q.page);
  const limit = Math.min(50, Math.max(1, q.limit));
  const skip = (page - 1) * limit;

  const where: any = { isActive: true };
  if (q.category) {
    const cat = await prisma.category.findUnique({ where: { slug: q.category } });
    if (cat) where.categoryId = cat.id;
  }
  if (q.minPrice != null || q.maxPrice != null) {
    where.price = {};
    if (q.minPrice != null) (where.price as any).gte = new Decimal(q.minPrice);
    if (q.maxPrice != null) (where.price as any).lte = new Decimal(q.maxPrice);
  }
  if (q.rating != null) where.averageRating = { gte: q.rating };
  if (q.search && q.search.trim()) {
    where.OR = [
      { name: { contains: q.search.trim(), mode: "insensitive" } },
      { description: { contains: q.search.trim(), mode: "insensitive" } },
    ];
  }

  const orderBy: any =
    q.sort === "price_asc"
      ? { price: "asc" }
      : q.sort === "price_desc"
        ? { price: "desc" }
        : q.sort === "name"
          ? { name: "asc" }
          : q.sort === "rating"
            ? { averageRating: "desc" }
            : { createdAt: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: { category: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    data: products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function getBySlug(req: Request, res: Response): Promise<void> {
  const slug = req.params.slug as string;
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { name: true } } },
      },
    },
  });
  if (!product) {
    res.status(404).json({ message: "Produto não encontrado" });
    return;
  }
  res.json(product);
}

export async function createReview(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Não autenticado" });
    return;
  }
  const productId = req.params.id as string;
  const body = (req as any).validBody as ReviewBody;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    res.status(404).json({ message: "Produto não encontrado" });
    return;
  }

  const existing = await prisma.review.findFirst({
    where: { userId: req.user.id, productId },
  });
  if (existing) {
    res.status(409).json({ message: "Você já avaliou este produto" });
    return;
  }

  const review = await prisma.review.create({
    data: {
      userId: req.user.id,
      productId,
      rating: body.rating,
      comment: body.comment,
    },
  });

  const reviews = await prisma.review.findMany({
    where: { productId },
    select: { rating: true },
  });
  const averageRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;
  await prisma.product.update({
    where: { id: productId },
    data: { averageRating: Math.round(averageRating * 100) / 100 },
  });

  res.status(201).json(review);
}
