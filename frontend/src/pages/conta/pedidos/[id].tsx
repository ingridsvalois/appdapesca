import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { apiGet, apiPatch } from "@/lib/api";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number | string;
  product?: { name: string; slug: string; mainImageUrl?: string } | null;
}

interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  totalAmount: number | string;
  createdAt: string;
  deliveredAt?: string | null;
  trackingCode?: string | null;
  carrier?: string | null;
  shippingAddressSnapshot: Record<string, any>;
  items: OrderItem[];
}

export default function PedidoDetalheCliente() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/conta/pedidos");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !id || typeof id !== "string") return;
    setLoading(true);
    apiGet<Order>(`/api/orders/${id}`)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [user, id]);

  function formatPrice(v: number | string): string {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
  }

  async function handleConfirmDelivery() {
    if (!id || typeof id !== "string") return;
    setConfirming(true);
    setError("");
    try {
      const updated = await apiPatch<Order>(`/api/orders/${id}/confirm-delivery`, {});
      setOrder(updated);
      setShowConfirmModal(false);
    } catch (e: any) {
      setError(e.message || "Não foi possível confirmar a entrega.");
    } finally {
      setConfirming(false);
    }
  }

  function renderStatusBadge() {
    if (!order) return null;
    let label = "";
    let badgeClass = "";

    if (order.paymentStatus !== "paid") {
      label = "Aguardando pagamento";
      badgeClass = "bg-yellow-100 text-yellow-800";
    } else if (order.status === "SHIPPED") {
      label = "Enviado";
      badgeClass = "bg-orange-100 text-orange-800";
    } else if (order.status === "DELIVERED") {
      label = "Entregue";
      badgeClass = "bg-green-100 text-green-800";
    } else if (order.status === "CANCELLED") {
      label = "Cancelado";
      badgeClass = "bg-red-100 text-red-800";
    } else {
      label = "Pago / Em preparação";
      badgeClass = "bg-blue-100 text-blue-800";
    }

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
        {label}
      </span>
    );
  }

  if (authLoading || !user) {
    return (
      <Layout title="Detalhe do pedido">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500">Carregando…</div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout title="Detalhe do pedido">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500">Carregando…</div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout title="Pedido não encontrado">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-gray-500">Pedido não encontrado.</p>
          <Link href="/conta/pedidos" className="mt-4 inline-block text-accent hover:underline">
            Voltar para pedidos
          </Link>
        </div>
      </Layout>
    );
  }

  const addr = order.shippingAddressSnapshot as Record<string, string>;
  const canConfirmDelivery =
    order.paymentStatus === "paid" && order.status === "SHIPPED";

  return (
    <Layout title={`Pedido #${order.id.slice(-6).toUpperCase()} — App da Pesca`}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/conta/pedidos" className="text-accent hover:underline mb-4 inline-block">
          ← Voltar para pedidos
        </Link>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h1 className="text-2xl font-bold text-[#333333]">
            Pedido #{order.id.slice(-6).toUpperCase()}
          </h1>
          {renderStatusBadge()}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Realizado em {new Date(order.createdAt).toLocaleDateString("pt-BR")}
        </p>
        {order.deliveredAt && (
          <p className="text-xs text-gray-600 mb-4">
            Entregue em {new Date(order.deliveredAt).toLocaleDateString("pt-BR")}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mb-4" role="alert">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-[#333333] mb-3 text-sm">Endereço de entrega</h2>
            {addr ? (
              <p className="text-sm text-[#333333]">
                {addr.street}, {addr.number}
                {addr.complement ? `, ${addr.complement}` : ""}
                <br />
                {addr.district}, {addr.city} - {addr.state}, {addr.zipCode}
              </p>
            ) : (
              <p className="text-sm text-gray-500">Endereço não disponível</p>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-[#333333] mb-3 text-sm">Envio</h2>
            {order.trackingCode ? (
              <div className="space-y-1 text-sm text-[#333333]">
                <p>
                  <span className="font-medium">Transportadora:</span> {order.carrier || "—"}
                </p>
                <p>
                  <span className="font-medium">Código de rastreio:</span> {order.trackingCode}
                </p>
                <p className="text-xs text-gray-500">
                  Use este código no site da transportadora para acompanhar a entrega.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                As informações de rastreio estarão disponíveis assim que o pedido for enviado.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <h2 className="px-5 py-4 font-semibold text-[#333333] border-b border-gray-200 text-sm">
            Itens do pedido
          </h2>
          <ul className="divide-y divide-gray-200">
            {order.items.map((item, index) => (
              <li key={item.id || index} className="px-5 py-4 flex justify-between items-center">
                <span className="text-sm text-[#333333]">
                  {item.product?.name ?? "Produto removido"} × {item.quantity}
                </span>
                <span className="text-sm text-accent font-medium">
                  {formatPrice(Number(item.unitPrice) * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <span className="font-semibold text-[#333333] text-sm">Total</span>
            <span className="text-accent font-bold text-lg">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </div>

        {canConfirmDelivery && (
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="btn-accent py-2 px-4"
          >
            Confirmar que recebi o pedido
          </button>
        )}

        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6">
              <h2 className="text-lg font-semibold text-[#333333] mb-3">
                Confirmar entrega
              </h2>
              <p className="text-sm text-[#333333] mb-4">
                Você confirma que recebeu o pedido #{order.id.slice(-6).toUpperCase()}?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-[#333333]"
                  disabled={confirming}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelivery}
                  disabled={confirming}
                  className="px-4 py-2 text-sm rounded-lg bg-[#308E10] text-white disabled:opacity-50"
                >
                  {confirming ? "Confirmando…" : "Confirmar recebimento"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}