import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { apiGet } from "@/lib/api";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number | string;
  product: { name: string; slug: string };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number | string;
  createdAt: string;
  items: OrderItem[];
}

export default function Pedidos() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?redirect=/conta/pedidos");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    apiGet<Order[]>("/api/orders")
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) {
    return (
      <Layout title="Pedidos">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500">Carregando…</div>
      </Layout>
    );
  }

  function formatPrice(v: number | string): string {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
  }

  return (
    <Layout title="Meus pedidos — App da Pesca">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/conta" className="text-accent hover:underline mb-4 inline-block">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold text-[#333333] mb-6">Meus pedidos</h1>
        {loading ? (
          <p className="text-gray-500">Carregando…</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-500">Nenhum pedido ainda.</p>
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => (
              <li key={order.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <span className="font-medium text-[#333333]">
                    Pedido #{order.id.slice(-6).toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <p className="text-sm text-[#333333] mt-1">
                  Status: <span className="font-medium">{order.status}</span>
                </p>
                <p className="text-accent font-bold mt-1">{formatPrice(order.totalAmount)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}
