import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { apiGet } from "@/lib/api";

interface OrderItem {
  id: string;
  orderId: string;
  status: string;
  totalAmount: number | string;
  createdAt: string;
  user?: { name: string; email: string };
}

export default function AdminPedidos() {
  const [result, setResult] = useState<{
    data: OrderItem[];
    total: number;
    page: number;
    totalPages: number;
  }>({ data: [], total: 0, page: 1, totalPages: 0 });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  function load(page = 1) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (status) params.set("status", status);
    apiGet<{ data: OrderItem[]; total: number; page: number; totalPages: number }>(
      `/api/admin/orders?${params}`
    )
      .then(setResult)
      .catch(() => setResult({ data: [], total: 0, page: 1, totalPages: 0 }))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(1);
  }, [status]);

  function formatPrice(v: number | string): string {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
  }

  return (
    <AdminLayout title="Pedidos — Admin">
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Pedidos</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <label className="flex items-center gap-2">
          <span className="text-sm text-[#333333]">Status:</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Todos</option>
            <option value="PENDING">Pendente</option>
            <option value="PAID">Pago</option>
            <option value="CANCELLED">Cancelado</option>
            <option value="SHIPPED">Enviado</option>
          </select>
        </label>
      </div>
      {loading ? (
        <p className="text-gray-500">Carregando…</p>
      ) : result.data.length === 0 ? (
        <p className="text-gray-500">Nenhum pedido encontrado.</p>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-[#333333]">Pedido</th>
                  <th className="px-4 py-3 text-sm font-semibold text-[#333333]">Cliente</th>
                  <th className="px-4 py-3 text-sm font-semibold text-[#333333]">Data</th>
                  <th className="px-4 py-3 text-sm font-semibold text-[#333333]">Status</th>
                  <th className="px-4 py-3 text-sm font-semibold text-[#333333]">Total</th>
                  <th className="px-4 py-3 text-sm font-semibold text-[#333333]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {result.data.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 font-medium text-[#333333]">
                      #{order.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-[#333333]">
                      {order.user?.name ?? "—"}
                      {order.user?.email && (
                        <span className="block text-xs text-gray-500">{order.user.email}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#333333]">
                      {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm ${
                          order.status === "PAID"
                            ? "text-accent"
                            : order.status === "CANCELLED"
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-accent">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="text-sm text-accent hover:underline"
                      >
                        Ver
                      </Link>
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
