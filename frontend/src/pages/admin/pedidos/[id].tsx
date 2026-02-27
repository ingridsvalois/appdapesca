import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { apiGet, apiPatch } from "@/lib/api";

interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number | string;
  product: { name: string; slug: string };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number | string;
  paymentStatus: string;
  createdAt: string;
  shippingAddressSnapshot: Record<string, string>;
  user?: { name: string; email: string };
  items: OrderItem[];
}

export default function AdminPedidoDetalhe() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    apiGet<Order>(`/api/admin/orders/${id}`)
      .then((data) => {
        setOrder(data);
        setNewStatus(data.status);
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || typeof id !== "string" || !newStatus) return;
    setUpdating(true);
    try {
      const updated = await apiPatch<Order>(`/api/admin/orders/${id}/status`, { status: newStatus });
      setOrder(updated);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUpdating(false);
    }
  }

  function formatPrice(v: number | string): string {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
  }

  if (loading) {
    return (
      <AdminLayout title="Pedido">
        <p className="text-gray-500">Carregando…</p>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout title="Pedido não encontrado">
        <p className="text-gray-500">Pedido não encontrado.</p>
        <Link href="/admin/pedidos" className="mt-4 inline-block text-accent hover:underline">
          Voltar
        </Link>
      </AdminLayout>
    );
  }

  const addr = order.shippingAddressSnapshot as Record<string, string>;

  return (
    <AdminLayout title={`Pedido #${order.id.slice(-8).toUpperCase()} — Admin`}>
      <Link href="/admin/pedidos" className="text-accent hover:underline mb-4 inline-block">
        ← Voltar
      </Link>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">
        Pedido #{order.id.slice(-8).toUpperCase()}
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-[#333333] mb-4">Cliente</h2>
          {order.user && (
            <p className="text-[#333333]">
              {order.user.name}
              <br />
              <span className="text-gray-500">{order.user.email}</span>
            </p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-[#333333] mb-4">Endereço de entrega</h2>
          {addr && (
            <p className="text-[#333333] text-sm">
              {addr.street}, {addr.number}
              {addr.complement ? `, ${addr.complement}` : ""}
              <br />
              {addr.district}, {addr.city} - {addr.state}, {addr.zipCode}
            </p>
          )}
        </div>
      </div>
      <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <h2 className="px-6 py-4 font-semibold text-[#333333] border-b border-gray-200">
          Itens
        </h2>
        <ul className="divide-y divide-gray-200">
          {order.items.map((item) => (
            <li key={item.productId} className="px-6 py-4 flex justify-between items-center">
              <span className="text-[#333333]">
                {item.product.name} × {item.quantity}
              </span>
              <span className="text-accent font-medium">
                {formatPrice(Number(item.unitPrice) * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <span className="font-semibold text-[#333333]">Total</span>
          <span className="text-accent font-bold text-lg">{formatPrice(order.totalAmount)}</span>
        </div>
      </div>
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#333333] mb-4">Alterar status</h2>
        <form onSubmit={handleStatusSubmit} className="flex flex-wrap items-center gap-4">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="PENDING">Pendente</option>
            <option value="PAID">Pago</option>
            <option value="CANCELLED">Cancelado</option>
            <option value="SHIPPED">Enviado</option>
          </select>
          <button
            type="submit"
            disabled={updating || newStatus === order.status}
            className="btn-accent py-2 px-4 disabled:opacity-50"
          >
            {updating ? "Salvando…" : "Atualizar status"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
