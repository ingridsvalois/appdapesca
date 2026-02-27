import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";

export default function Conta() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/conta");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <Layout title="Minha conta">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500">Carregando…</div>
      </Layout>
    );
  }

  return (
    <Layout title="Minha conta — App da Pesca">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-[#333333] mb-6">Minha conta</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md">
          <p className="text-[#333333]">
            <span className="font-medium">Nome:</span> {user.name}
          </p>
          <p className="text-[#333333] mt-2">
            <span className="font-medium">E-mail:</span> {user.email}
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link href="/conta/pedidos" className="btn-primary">
            Meus pedidos
          </Link>
          <Link href="/conta/enderecos" className="btn-primary">
            Endereços
          </Link>
        </div>
      </div>
    </Layout>
  );
}
