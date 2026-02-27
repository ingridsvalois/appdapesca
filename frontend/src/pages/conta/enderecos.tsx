import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { apiGet } from "@/lib/api";
import type { Address } from "@/types";

export default function Enderecos() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?redirect=/conta/enderecos");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    apiGet<Address[]>("/api/users/me/addresses")
      .then(setAddresses)
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) {
    return (
      <Layout title="Endereços">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500">Carregando…</div>
      </Layout>
    );
  }

  return (
    <Layout title="Meus endereços — App da Pesca">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/conta" className="text-accent hover:underline mb-4 inline-block">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold text-[#333333] mb-6">Meus endereços</h1>
        {loading ? (
          <p className="text-gray-500">Carregando…</p>
        ) : addresses.length === 0 ? (
          <p className="text-gray-500">Nenhum endereço cadastrado.</p>
        ) : (
          <ul className="space-y-4">
            {addresses.map((addr) => (
              <li key={addr.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-[#333333]">
                  {addr.street}, {addr.number}
                  {addr.complement ? `, ${addr.complement}` : ""}
                </p>
                <p className="text-[#333333]">
                  {addr.district}, {addr.city} - {addr.state}, {addr.zipCode}
                </p>
                {addr.isDefault && (
                  <span className="inline-block mt-2 text-sm text-accent font-medium">Padrão</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}
