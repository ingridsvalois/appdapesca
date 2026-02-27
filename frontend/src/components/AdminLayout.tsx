import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title = "Admin — App da Pesca" }: AdminLayoutProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?redirect=" + encodeURIComponent(router.asPath));
      return;
    }
    if (user.role !== "ADMIN") {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Carregando…
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14">
              <div className="flex items-center gap-6">
                <Link href="/admin" className="font-bold text-[#333333]">
                  Painel Admin
                </Link>
                <nav className="flex gap-4" aria-label="Admin">
                  <Link href="/admin" className="text-[#333333] hover:text-accent text-sm">
                    Dashboard
                  </Link>
                  <Link href="/admin/produtos" className="text-[#333333] hover:text-accent text-sm">
                    Produtos
                  </Link>
                  <Link href="/admin/pedidos" className="text-[#333333] hover:text-accent text-sm">
                    Pedidos
                  </Link>
                </nav>
              </div>
              <Link href="/" className="text-sm text-gray-500 hover:text-[#333333]">
                Voltar à loja
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </div>
    </>
  );
}
