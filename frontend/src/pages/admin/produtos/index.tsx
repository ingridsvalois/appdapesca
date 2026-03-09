import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminLayout from "@/components/AdminLayout";
import { apiGet, apiDelete } from "@/lib/api";

interface ProductAdmin {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  stock: number;
  isActive: boolean;
  mainImageUrl: string;
  category?: { name: string };
}

export default function AdminProdutos() {
  const [result, setResult] = useState<{ data: ProductAdmin[]; total: number; page: number; totalPages: number }>({
    data: [],
    total: 0,
    page: 1,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  function load(page = 1) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "12" });
    if (search.trim()) params.set("search", search.trim());
    apiGet<{ data: ProductAdmin[]; total: number; page: number; totalPages: number }>(
      `/api/admin/products?${params}`
    )
      .then(setResult)
      .catch(() => setResult({ data: [], total: 0, page: 1, totalPages: 0 }))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(1);
  }

  async function handleDelete(id: string) {
    if (!confirm("Desativar este produto?")) return;
    try {
      await apiDelete(`/api/admin/products/${id}`);
      load(result.page);
    } catch (e: any) {
      alert(e.message);
    }
  }

  function formatPrice(v: number | string): string {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
  }

  return (
    <AdminLayout title="Produtos — Admin">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[#333333]">Produtos</h1>
        <Link href="/admin/produtos/novo" className="btn-accent py-2 px-4">
          Novo produto
        </Link>
      </div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="search"
          placeholder="Buscar por nome ou slug"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 flex-1 max-w-md"
        />
        <button type="submit" className="btn-primary py-2 px-4">
          Buscar
        </button>
      </form>
      {loading ? (
        <p className="text-gray-500">Carregando…</p>
      ) : result.data.length === 0 ? (
        <p className="text-gray-500">Nenhum produto encontrado.</p>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-[#333333]">Produto</th>
                  <th className="px-4 py-3 text-sm font-semibold text-[#333333]">Preço</th>
                  <th className="px-4 py-3 text-sm font-semibold text-[#333333]">Estoque</th>
                  <th className="px-4 py-3 text-sm font-semibold text-[#333333]">Status</th>
                  <th className="px-4 py-3 text-sm font-semibold text-[#333333]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {result.data.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          {p.mainImageUrl ? (
                            <Image
                              src={p.mainImageUrl}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized={p.mainImageUrl.startsWith("http")}
                            />
                          ) : (
                            <span className="text-gray-400 text-xs flex items-center justify-center w-full h-full">—</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-[#333333]">{p.name}</span>
                          {p.category && (
                            <span className="block text-xs text-gray-500">{p.category.name}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#333333]">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3 text-[#333333]">{p.stock}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm ${p.isActive ? "text-accent" : "text-gray-500"}`}
                      >
                        {p.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/produtos/${p.id}`}
                          className="text-sm text-accent hover:underline"
                        >
                          Editar
                        </Link>
                        {p.isActive && (
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Desativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => load(result.page - 1)}
                disabled={result.page <= 1}
                className="px-4 py-2 rounded border border-gray-300 disabled:opacity-50 text-[#333333]"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-gray-600">
                {result.page} / {result.totalPages}
              </span>
              <button
                type="button"
                onClick={() => load(result.page + 1)}
                disabled={result.page >= result.totalPages}
                className="px-4 py-2 rounded border border-gray-300 disabled:opacity-50 text-[#333333]"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
