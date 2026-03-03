import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { apiGet } from "@/lib/api";

interface OrderItem {
  id: string;
  orderId: string;
  status: string;
  paymentStatus?: string;
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
  const [segment, setSegment] = useState<"unpaid" | "processing" | "shipped" | "delivered" | "cancelled">(
    "processing"
  );
  const [counts, setCounts] = useState<Record<string, number>>({
    unpaid: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);

  function load(page = 1) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    params.set("segment", segment);
    apiGet<{ data: OrderItem[]; total: number; page: number; totalPages: number }>(
      `/api/admin/orders?${params}`
    )
      .then(setResult)
      .catch(() => setResult({ data: [], total: 0, page: 1, totalPages: 0 }))
      .finally(() => setLoading(false));
  }

  function loadCounts() {
    const segments: Array<keyof typeof counts> = [
      "unpaid",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    Promise.all(
      segments.map((seg) =>
        apiGet<{ total: number }>(`/api/admin/orders?segment=${seg}&page=1&limit=1`)
          .then((res) => ({ seg, total: res.total }))
          .catch(() => ({ seg, total: 0 }))
      )
    ).then((values) => {
      const next: Record<string, number> = { ...counts };
      for (const v of values) {
        next[v.seg] = v.total;
      }
      setCounts(next);
    });
  }

  useEffect(() => {
    load(1);
    loadCounts();
  }, [segment]);

  function formatPrice(v: number | string): string {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
  }

  return (
    <AdminLayout title="Pedidos — Admin">
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Pedidos</h1>
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: "unpaid", label: "Não pagos" },
          { key: "processing", label: "Pagos / Em preparação" },
          { key: "shipped", label: "Enviados" },
          { key: "delivered", label: "Entregues" },
          { key: "cancelled", label: "Cancelados" },
        ].map((tab) => {
          const isActive = segment === tab.key;
          const count = counts[tab.key] || 0;
          const highlightProcessing =
            tab.key === "processing" && count > 0;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSegment(tab.key as any)}
              className={`px-3 py-2 rounded-full text-xs font-medium border transition-colors flex items-center gap-2 ${
                isActive
                  ? "bg-[#308E10] text-white border-[#308E10]"
                  : "bg-white text-[#333333] border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  highlightProcessing
                    ? "bg-red-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
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
                      <span className="text-xs inline-flex items-center px-2.5 py-0.5 rounded-full font-medium
                        ${
                          order.paymentStatus !== "paid"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "SHIPPED"
                              ? "bg-orange-100 text-orange-800"
                              : order.status === "DELIVERED"
                                ? "bg-green-100 text-green-800"
                                : order.status === "CANCELLED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                        }
                      ">
                        {order.paymentStatus !== "paid"
                          ? "Aguardando pagamento"
                          : order.status === "SHIPPED"
                            ? "Enviado"
                            : order.status === "DELIVERED"
                              ? "Entregue"
                              : order.status === "CANCELLED"
                                ? "Cancelado"
                                : "Pago / Em preparação"}
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
