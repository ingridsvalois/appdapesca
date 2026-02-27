import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import type { ProductListResponse } from "@/types";
import type { GetServerSideProps } from "next";

const API = "https://appdapesca-production.up.railway.app";

export const getServerSideProps: GetServerSideProps<{
  result: ProductListResponse;
  categories: { id: string; name: string; slug: string }[];
}> = async (context) => {
  const { category, search, minPrice, maxPrice, page, sort } = context.query;
  const params = new URLSearchParams();
  if (category && typeof category === "string") params.set("category", category);
  if (search && typeof search === "string") params.set("search", search);
  if (minPrice && typeof minPrice === "string") params.set("minPrice", minPrice);
  if (maxPrice && typeof maxPrice === "string") params.set("maxPrice", maxPrice);
  if (page && typeof page === "string") params.set("page", page);
  if (sort && typeof sort === "string") params.set("sort", sort);
  params.set("limit", "12");

  try {
    const [result, categoriesRes] = await Promise.all([
      fetch(`${API}/api/products?${params}`).then((r) => r.json()),
      fetch(`${API}/api/categories`).then((r) => r.json()),
    ]);
    const categories = Array.isArray(categoriesRes) ? categoriesRes : [];
    return {
      props: {
        result: result?.data ? result : { data: [], total: 0, page: 1, limit: 12, totalPages: 0 },
        categories,
      },
    };
  } catch {
    return {
      props: {
        result: { data: [], total: 0, page: 1, limit: 12, totalPages: 0 },
        categories: [],
      },
    };
  }
};

interface ProdutosProps {
  result: ProductListResponse;
  categories: { id: string; name: string; slug: string }[];
}

export default function Produtos({ result, categories }: ProdutosProps) {
  const router = useRouter();
  const { category, search, minPrice, maxPrice, page = "1", sort } = router.query;
  const currentPage = Number(page) || 1;

  function updateFilters(updates: Record<string, string | undefined>) {
    const q = { ...router.query, ...updates };
    if (updates.page === "1" || updates.page === undefined) delete q.page;
    Object.keys(q).forEach((k) => q[k] === undefined && delete q[k]);
    router.push({ pathname: "/produtos", query: q }, undefined, { shallow: false });
  }

  return (
    <Layout title="Produtos — App da Pesca" description="Catálogo de artigos de pesca.">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-[#333333] mb-6">Catálogo</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-56 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              <h2 className="font-semibold text-[#333333]">Filtros</h2>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Categoria</label>
                <select
                  value={(category as string) || ""}
                  onChange={(e) => updateFilters({ category: e.target.value || undefined, page: "1" })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[#333333]"
                >
                  <option value="">Todas</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Ordenar</label>
                <select
                  value={(sort as string) || "newest"}
                  onChange={(e) => updateFilters({ sort: e.target.value, page: "1" })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[#333333]"
                >
                  <option value="newest">Mais recentes</option>
                  <option value="price_asc">Preço: menor</option>
                  <option value="price_desc">Preço: maior</option>
                  <option value="name">Nome</option>
                  <option value="rating">Avaliação</option>
                </select>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {result.data.length > 0 ? (
              <>
                <p className="text-gray-500 text-sm mb-4">{result.total} produto(s) encontrado(s)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {result.data.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {result.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <button
                      type="button"
                      onClick={() => updateFilters({ page: String(currentPage - 1) })}
                      disabled={currentPage <= 1}
                      className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 text-[#333333]"
                    >
                      Anterior
                    </button>
                    <span className="px-4 py-2 text-gray-600">
                      {currentPage} / {result.totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateFilters({ page: String(currentPage + 1) })}
                      disabled={currentPage >= result.totalPages}
                      className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 text-[#333333]"
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500">Nenhum produto encontrado.</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
