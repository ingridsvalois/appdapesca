import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

function formatPrice(value: number | string): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

export default function ProductCard({ product }: ProductCardProps) {
  const price = typeof product.price === "string" ? parseFloat(product.price) : product.price;
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
    >
      <Link href={`/produtos/${product.slug}`} className="block">
        <div className="aspect-square relative bg-gray-100">
          {product.mainImageUrl ? (
            <Image
              src={product.mainImageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
              unoptimized={product.mainImageUrl.startsWith("http")}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Sem imagem</div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-[#333333] line-clamp-2">{product.name}</h3>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-accent font-bold">{formatPrice(price)}</span>
            {product.averageRating > 0 && (
              <span className="text-sm text-gray-500">★ {product.averageRating.toFixed(1)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
