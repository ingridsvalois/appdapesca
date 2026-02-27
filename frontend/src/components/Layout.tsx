import Head from "next/head";
import Link from "next/link";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCartStore } from "@/store/cartStore";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function Layout({ children, title = "App da Pesca", description }: LayoutProps) {
  const { user, loading: authLoading, logout } = useAuth();
  const { items, fetchCart } = useCartStore();
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description || "Loja especializada em artigos de pesca."} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Navegação principal">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="font-bold text-xl text-[#333333] hover:text-accent transition">
                App da Pesca
              </Link>
              <div className="flex items-center gap-4 sm:gap-6">
                <Link href="/produtos" className="text-[#333333] hover:text-accent transition font-medium">
                  Produtos
                </Link>
                <Link href="/carrinho" className="relative text-[#333333] hover:text-accent transition font-medium">
                  Carrinho
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
                {!authLoading && (
                  user ? (
                    <>
                      {user.role === "ADMIN" && (
                        <Link href="/admin" className="text-[#333333] hover:text-accent transition font-medium">
                          Admin
                        </Link>
                      )}
                      <Link href="/conta" className="text-[#333333] hover:text-accent transition font-medium">
                        {user.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => logout()}
                        className="text-gray-500 hover:text-[#333333] text-sm"
                      >
                        Sair
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="text-[#333333] hover:text-accent transition font-medium">
                        Entrar
                      </Link>
                      <Link href="/registro" className="btn-accent py-2 px-4 text-sm">
                        Cadastrar
                      </Link>
                    </>
                  )
                )}
              </div>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="font-semibold text-[#333333]">App da Pesca</span>
              <p className="text-gray-600 text-sm">Artigos de pesca — Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
