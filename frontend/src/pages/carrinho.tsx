import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Layout from "@/components/Layout";
import { useCartStore } from "@/store/cartStore";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function Carrinho() {
  const { items, total, loading, fetchCart, updateItem, removeItem } = useCartStore();
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  async function handleUpdate(itemId: string, quantity: number) {
    if (quantity < 1) return;
    setUpdating(itemId);
    try {
      await updateItem(itemId, quantity);
    } finally {
      setUpdating(null);
    }
  }

  async function handleRemove(itemId: string) {
    setUpdating(itemId);
    try {
      await removeItem(itemId);
    } finally {
      setUpdating(null);
    }
  }

  return (
    <Layout title="Carrinho — App da Pesca">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Carrinho</h1>
      {loading && items.length === 0 ? (
        <p className="text-gray-500">Carregando…</p>
      ) : items.length === 0 ? (
        <>
          <p className="text-gray-500">Seu carrinho está vazio.</p>
          <Link href="/produtos" className="mt-4 inline-block btn-primary">
            Continuar comprando
          </Link>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4"
              >
                <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {item.product?.mainImageUrl ? (
                    <Image
                      src={item.product.mainImageUrl}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      unoptimized={item.product.mainImageUrl.startsWith("http")}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      Sem img
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/produtos/${item.product?.slug}`}
                    className="font-medium text-[#333333] hover:text-accent line-clamp-2"
                  >
                    {item.product?.name}
                  </Link>
                  <p className="text-accent font-bold mt-1">{formatPrice(item.unitPrice)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <label className="flex items-center gap-1">
                      <span className="text-sm text-gray-600">Qtd:</span>
                      <select
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdate(item.id, parseInt(e.target.value, 10))
                        }
                        disabled={!!updating}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        {Array.from({ length: Math.min(99, item.product?.stock ?? 99) }, (_, i) => (
                          <option key={i} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      disabled={!!updating}
                      className="text-sm text-red-600 hover:underline disabled:opacity-50"
                    >
                      Remover
                    </button>
                  </div>
                </div>
                <div className="text-right font-medium text-[#333333]">
                  {formatPrice(item.unitPrice * item.quantity)}
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-24">
              <h2 className="font-bold text-[#333333] mb-4">Resumo</h2>
              <p className="flex justify-between text-[#333333]">
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </p>
              <p className="mt-2 text-sm text-gray-500">Frete calculado no checkout.</p>
              <Link
                href="/checkout"
                className="mt-6 w-full btn-accent block text-center py-3"
                aria-label="Finalizar compra"
              >
                Finalizar compra
              </Link>
              <Link href="/produtos" className="mt-3 block text-center text-accent hover:underline text-sm">
                Continuar comprando
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
    </Layout>
  );
}
