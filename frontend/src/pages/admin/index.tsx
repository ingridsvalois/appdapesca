import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { apiGet } from "@/lib/api";

interface OrderSummary {
  id: string;
  status: string;
  totalAmount: number | string;
  createdAt: string;
  user?: { name: string };
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [productsCount, setProductsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet<{ data: OrderSummary[] }>("/api/admin/orders?limit=5").then((r) => r.data || []),
      apiGet<{ data: unknown[]; total: number }>("/api/admin/products?limit=1").then((r) => r.total ?? 0),
    ])
      .then(([orderList, total]) => {
        setOrders(orderList);
        setProductsCount(total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function formatPrice(v: number | string): string {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
  }

  return (
    <AdminLayout title="Dashboard — Admin">
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-[#333333]">Produtos cadastrados</h2>
          <p className="text-2xl font-bold text-accent mt-1">{loading ? "—" : productsCount}</p>
          <Link href="/admin/produtos" className="text-sm text-accent hover:underline mt-2 inline-block">
            Gerenciar produtos
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-[#333333]">Pedidos recentes</h2>
          <p className="text-2xl font-bold text-accent mt-1">{loading ? "—" : orders.length}</p>
          <Link href="/admin/pedidos" className="text-sm text-accent hover:underline mt-2 inline-block">
            Ver todos os pedidos
          </Link>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <h2 className="px-6 py-4 font-semibold text-[#333333] border-b border-gray-200">
          Últimos pedidos
        </h2>
        {loading ? (
          <p className="p-6 text-gray-500">Carregando…</p>
        ) : orders.length === 0 ? (
          <p className="p-6 text-gray-500">Nenhum pedido ainda.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/pedidos/${order.id}`}
                  className="flex flex-wrap justify-between items-center gap-2 px-6 py-4 hover:bg-gray-50"
                >
                  <span className="font-medium text-[#333333]">
                    #{order.id.slice(-8).toUpperCase()}
                    {order.user?.name && ` — ${order.user.name}`}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("pt-BR")} · {order.status}
                  </span>
                  <span className="text-accent font-bold">{formatPrice(order.totalAmount)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}
