import { Request, Response } from "express";
import { prisma } from "../config/database";
import type { CreateProductBody, UpdateProductBody } from "../validations/product.validations";
import type { CreateCategoryBody as CreateCatBody, UpdateCategoryBody as UpdateCatBody } from "../validations/category.validations";
import { Decimal } from "@prisma/client/runtime/library";
import { uploadToCloudinary } from "../services/upload.service";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function listCategories(_req: Request, res: Response): Promise<void> {
  const list = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  res.json(list);
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const body = (req as any).validBody as CreateCatBody;
  const baseSlug = slugify(body.name);

  const existing = await prisma.category.findFirst({
    where: {
      OR: [{ name: body.name }, { slug: baseSlug }],
    },
    select: { id: true, name: true, slug: true },
  });

  if (existing) {
    res.json(existing);
    return;
  }

  const category = await prisma.category.create({
    data: {
      name: body.name,
      slug: baseSlug,
      description: body.description,
    },
    select: { id: true, name: true, slug: true },
  });
  res.status(201).json(category);
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const body = (req as any).validBody as UpdateCatBody;
  const category = await prisma.category.update({ where: { id }, data: body });
  res.json(category);
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    res.status(400).json({ message: "Categoria possui produtos. Remova ou altere-os primeiro." });
    return;
  }
  await prisma.category.delete({ where: { id } });
  res.status(204).send();
}

export async function listProducts(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
  const search = (req.query.search as string) || "";
  const where: any = {};
  if (search.trim()) {
    where.OR = [
      { name: { contains: search.trim(), mode: "insensitive" } },
      { slug: { contains: search.trim(), mode: "insensitive" } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { category: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.product.count({ where }),
  ]);
  res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function getProduct(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });
  if (!product) {
    res.status(404).json({ message: "Produto não encontrado" });
    return;
  }
  res.json(product);
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  const body = (req as any).validBody as CreateProductBody;
  const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
  if (!category) {
    res.status(400).json({ message: "Categoria não encontrada" });
    return;
  }
  const product = await prisma.product.create({
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description,
      price: new Decimal(body.price),
      stock: body.stock,
      categoryId: body.categoryId,
      mainImageUrl: body.mainImageUrl,
      images: body.images,
      isActive: body.isActive ?? true,
    },
    include: { category: true },
  });
  res.status(201).json(product);
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const body = (req as any).validBody as UpdateProductBody;
  const data: any = { ...body };
  if (data.price != null) data.price = new Decimal(data.price);
  if (data.categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!cat) {
      res.status(400).json({ message: "Categoria não encontrada" });
      return;
    }
  }
  const product = await prisma.product.update({
    where: { id },
    data,
    include: { category: true },
  });
  res.json(product);
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
  res.status(204).send();
}

export async function uploadImages(req: Request, res: Response): Promise<void> {
  const files = (req as any).files as Express.Multer.File[] | undefined;

  if (!files || files.length === 0) {
    res.status(400).json({ message: "Nenhum arquivo enviado" });
    return;
  }

  try {
    const uploads = await Promise.all(
      files.map((file) => uploadToCloudinary(file.buffer, "products"))
    );

    res.status(201).json({
      images: uploads.map((u) => ({ url: u.url, public_id: u.publicId })),
    });
  } catch (err) {
    console.error("[uploadImages] Erro ao enviar para Cloudinary", err);
    res.status(500).json({ message: "Erro ao fazer upload das imagens" });
  }
}

export async function listOrders(req: Request, res: Response): Promise<void> {
  const segment = (req.query.segment as string | undefined) || "";
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const where: any = {};

  if (segment === "unpaid") {
    where.paymentStatus = { in: ["pending", "failed"] };
  } else if (segment === "processing") {
    where.paymentStatus = "paid";
    where.status = "PAID";
  } else if (segment === "shipped") {
    where.status = "SHIPPED";
  } else if (segment === "delivered") {
    where.status = "DELIVERED";
  } else if (segment === "cancelled") {
    where.status = "CANCELLED";
  }
  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: { select: { id: true, name: true, slug: true } } } },
      },
    }),
    prisma.order.count({ where }),
  ]);
  res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function getOrder(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: { include: { product: true } },
    },
  });
  if (!order) {
    res.status(404).json({ message: "Pedido não encontrado" });
    return;
  }
  res.json(order);
}

export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { status, trackingCode, carrier } = req.body as {
    status?: string;
    trackingCode?: string;
    carrier?: string;
  };

  if (!status || !["CANCELLED", "SHIPPED"].includes(status)) {
    res.status(400).json({ message: "Status inválido para atualização manual" });
    return;
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    res.status(404).json({ message: "Pedido não encontrado" });
    return;
  }

  if (status === "SHIPPED") {
    if (order.paymentStatus !== "paid" || order.status !== "PAID") {
      res.status(400).json({ message: "Pedido precisa estar pago para ser enviado" });
      return;
    }
    if (!trackingCode || !carrier) {
      res.status(400).json({ message: "Código de rastreio e transportadora são obrigatórios" });
      return;
    }
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status,
      trackingCode: status === "SHIPPED" ? trackingCode : order.trackingCode,
      carrier: status === "SHIPPED" ? carrier : order.carrier,
    },
    include: { user: { select: { id: true, name: true, email: true } }, items: true },
  });
  res.json(updated);
}
