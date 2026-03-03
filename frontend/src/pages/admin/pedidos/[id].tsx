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
  trackingCode?: string | null;
  carrier?: string | null;
  user?: { name: string; email: string };
  items: OrderItem[];
}

export default function AdminPedidoDetalhe() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<"" | "CANCELLED" | "SHIPPED">("");
  const [trackingCode, setTrackingCode] = useState("");
  const [carrier, setCarrier] = useState("");
  const [error, setError] = useState("");
  const [showShipModal, setShowShipModal] = useState(false);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    apiGet<Order>(`/api/admin/orders/${id}`)
      .then((data) => {
        setOrder(data);
        setNewStatus("");
        setTrackingCode(data.trackingCode || "");
        setCarrier(data.carrier || "");
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || typeof id !== "string" || !newStatus) return;
    setUpdating(true);
    setError("");
    try {
      const body: any = { status: newStatus };
      if (newStatus === "SHIPPED") {
        body.trackingCode = trackingCode;
        body.carrier = carrier;
      }
      const updated = await apiPatch<Order>(`/api/admin/orders/${id}/status`, body);
      setOrder(updated);
      setShowShipModal(false);
      setNewStatus("");
    } catch (e: any) {
      setError(e.message || "Não foi possível atualizar o pedido.");
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
        <h2 className="font-semibold text-[#333333] mb-4">Status do pedido</h2>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mb-3" role="alert">
            {error}
          </p>
        )}
        <p className="text-sm text-[#333333] mb-3">
          Status atual: <span className="font-semibold">{order.status}</span> — Pagamento:{" "}
          <span className="font-semibold">{order.paymentStatus || "—"}</span>
        </p>
        {order.trackingCode && (
          <p className="text-sm text-[#333333] mb-3">
            <span className="font-semibold">Rastreio:</span> {order.trackingCode}{" "}
            {order.carrier && <span className="text-gray-500">({order.carrier})</span>}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          {(order.paymentStatus === "pending" || order.paymentStatus === "failed") && (
            <button
              type="button"
              onClick={() => {
                setNewStatus("CANCELLED");
                setShowShipModal(true);
              }}
              className="px-4 py-2 text-sm rounded-lg border border-red-500 text-red-600 hover:bg-red-50"
            >
              Cancelar pedido
            </button>
          )}
          {order.paymentStatus === "paid" && order.status === "PAID" && (
            <button
              type="button"
              onClick={() => {
                setNewStatus("SHIPPED");
                setShowShipModal(true);
              }}
              className="px-4 py-2 text-sm rounded-lg bg-accent text-white hover:bg-accent/90"
            >
              Marcar como enviado
            </button>
          )}
        </div>
      </div>

      {showShipModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-[#333333] mb-3">
              {newStatus === "SHIPPED" ? "Marcar como enviado" : "Cancelar pedido"}
            </h2>
            <form onSubmit={handleStatusSubmit} className="space-y-4">
              {newStatus === "SHIPPED" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#333333] mb-1">
                      Código de rastreio *
                    </label>
                    <input
                      type="text"
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#333333] mb-1">
                      Transportadora *
                    </label>
                    <select
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Selecione</option>
                      <option value="Correios">Correios</option>
                      <option value="Jadlog">Jadlog</option>
                      <option value="Total Express">Total Express</option>
                      <option value="Loggi">Loggi</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#333333]">
                  Confirma o cancelamento deste pedido? Esta ação não pode ser desfeita.
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShipModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-[#333333]"
                  disabled={updating}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 text-sm rounded-lg bg-[#308E10] text-white disabled:opacity-50"
                >
                  {updating ? "Salvando…" : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
