import Link from "next/link";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import type { Category } from "@/types";
import type { ProductListResponse } from "@/types";

export async function getServerSideProps() {
  try {
    const [categoriesRes, productsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://appdapesca-production.up.railway.app"}/api/categories`).then((r) => r.json()),
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://appdapesca-production.up.railway.app"}/api/products?limit=8&sort=rating`
      ).then((r) => r.json()),
    ]);
    return {
      props: {
        categories: Array.isArray(categoriesRes) ? categoriesRes : [],
        featuredProducts: productsRes?.data ?? [],
      },
    };
  } catch {
    return { props: { categories: [], featuredProducts: [] } };
  }
}

interface HomeProps {
  categories: Category[];
  featuredProducts: ProductListResponse["data"];
}

export default function Home({ categories, featuredProducts }: HomeProps) {
  return (
    <Layout title="App da Pesca — Artigos de Pesca" description="Loja especializada em artigos de pesca.">
      <section
        className="bg-gradient-main py-20 px-4 sm:px-6 lg:px-8"
        style={{ background: "linear-gradient(90deg, #87AFE0 0%, #F2F3B3 100%)" }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold text-[#333333] mb-4"
          >
            App da Pesca
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-[#333333]/90 mb-8 max-w-2xl mx-auto"
          >
            Tudo para sua pescaria. Varas, molinetes, iscas e acessórios.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link href="/produtos" className="btn-accent inline-block">
              Ver catálogo
            </Link>
          </motion.div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-[#333333] mb-6">Categorias</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/produtos?category=${cat.slug}`}
                    className="block p-4 rounded-xl border border-gray-200 bg-gray-50 hover:border-accent hover:bg-green-50/50 transition"
                  >
                    <span className="font-medium text-[#333333]">{cat.name}</span>
                    {cat._count && (
                      <span className="block text-sm text-gray-500 mt-1">{cat._count.products} produtos</span>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-[#333333] mb-6">Destaques</h2>
          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nenhum produto em destaque. Confira o catálogo.</p>
          )}
          <div className="mt-8 text-center">
            <Link href="/produtos" className="btn-primary inline-block">
              Ver todos os produtos
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
