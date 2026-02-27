import { useRouter } from "next/router";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Layout from "@/components/Layout";
import { useCartStore } from "@/store/cartStore";
import type { GetServerSideProps } from "next";

const API = "https://appdapesca-production.up.railway.app";

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  stock: number;
  mainImageUrl: string;
  images: string[];
  averageRating: number;
  category?: { id: string; name: string; slug: string };
  reviews?: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    user?: { name: string };
  }>;
}

export const getServerSideProps: GetServerSideProps<{ product: ProductDetail | null }> = async (context) => {
  const slug = context.params?.slug as string;
  if (!slug) return { props: { product: null } };
  try {
    const product = await fetch(`${API}/api/products/${slug}`).then((r) => (r.ok ? r.json() : null));
    return { props: { product } };
  } catch {
    return { props: { product: null } };
  }
};

function formatPrice(value: number | string): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

interface ProdutoSlugProps {
  product: ProductDetail | null;
}

export default function ProdutoSlug({ product: initialProduct }: ProdutoSlugProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [product, setProduct] = useState(initialProduct);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!product) {
    return (
      <Layout title="Produto não encontrado">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500">Produto não encontrado.</p>
          <Link href="/produtos" className="mt-4 inline-block btn-primary">
            Voltar ao catálogo
          </Link>
        </div>
      </Layout>
    );
  }

  const price = typeof product.price === "string" ? parseFloat(product.price) : product.price;
  const images = [product.mainImageUrl, ...(product.images || [])].filter(Boolean);

  async function addToCart() {
    if (!product) return;
    setAdding(true);
    setMessage(null);
    try {
      await addItem(product.id, quantity);
      setMessage("Adicionado ao carrinho.");
    } catch (e: any) {
      setMessage(e.message || "Erro ao adicionar.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <Layout title={`${product.name} — App da Pesca`} description={product.description.slice(0, 160)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/produtos" className="hover:text-accent">
            Produtos
          </Link>
          {product.category && (
            <>
              {" / "}
              <Link href={`/produtos?category=${product.category.slug}`} className="hover:text-accent">
                {product.category.name}
              </Link>
            </>
          )}
          {" / "}
          <span className="text-[#333333]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-square relative rounded-xl overflow-hidden bg-gray-100">
              {images[0] ? (
                <Image
                  src={images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                  unoptimized={images[0].startsWith("http")}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">Sem imagem</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.slice(1, 6).map((url, i) => (
                  <div key={i} className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden border border-gray-200">
                    <Image src={url} alt="" fill className="object-cover" unoptimized />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[#333333]">{product.name}</h1>
            <div className="mt-2 flex items-center gap-4">
              <span className="text-accent text-xl font-bold">{formatPrice(price)}</span>
              {product.averageRating > 0 && (
                <span className="text-gray-500">★ {product.averageRating.toFixed(1)}</span>
              )}
            </div>
            <p className="mt-4 text-[#333333] whitespace-pre-wrap">{product.description}</p>
            <p className="mt-2 text-sm text-gray-500">Estoque: {product.stock} un.</p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Qtd:</span>
                <input
                  type="number"
                  min={1}
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product?.stock ?? 1, parseInt(e.target.value, 10) || 1)))}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-[#333333]"
                />
              </label>
              <button
                type="button"
                onClick={addToCart}
                disabled={adding || product.stock < 1}
                className="btn-accent disabled:opacity-50"
              >
                {adding ? "Adicionando…" : "Adicionar ao carrinho"}
              </button>
            </div>
            {message && (
              <p className={`mt-2 text-sm ${message.startsWith("Erro") ? "text-red-600" : "text-accent"}`}>
                {message}
              </p>
            )}
          </div>
        </div>

        {product.reviews && product.reviews.length > 0 && (
          <section className="mt-12 border-t border-gray-200 pt-8">
            <h2 className="text-xl font-bold text-[#333333] mb-4">Avaliações</h2>
            <ul className="space-y-4">
              {product.reviews.map((r) => (
                <li key={r.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-accent">★ {r.rating}</span>
                    {r.user?.name && <span className="text-sm text-gray-500">{r.user.name}</span>}
                  </div>
                  <p className="text-[#333333]">{r.comment}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Layout>
  );
}