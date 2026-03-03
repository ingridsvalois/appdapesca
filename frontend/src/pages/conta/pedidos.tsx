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
  paymentStatus: string;
  totalAmount: number | string;
  createdAt: string;
  deliveredAt?: string | null;
  items: OrderItem[];
}

interface OrdersResponse {
  paid: Order[];
  pending: Order[];
}

export default function Pedidos() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [paidOrders, setPaidOrders] = useState<Order[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?redirect=/conta/pedidos");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    apiGet<OrdersResponse>("/api/orders")
      .then((res) => {
        setPaidOrders(res.paid || []);
        setPendingOrders(res.pending || []);
      })
      .catch(() => {
        setPaidOrders([]);
        setPendingOrders([]);
      })
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

  function renderStatusBadge(order: Order) {
    let label = "";
    let className = "";

    if (order.paymentStatus !== "paid") {
      label = "Aguardando pagamento";
      className = "bg-yellow-100 text-yellow-800";
    } else if (order.status === "SHIPPED") {
      label = "Enviado";
      className = "bg-orange-100 text-orange-800";
    } else if (order.status === "DELIVERED") {
      label = "Entregue";
      className = "bg-green-100 text-green-800";
    } else if (order.status === "CANCELLED") {
      label = "Cancelado";
      className = "bg-red-100 text-red-800";
    } else {
      label = "Pago / Em preparação";
      className = "bg-blue-100 text-blue-800";
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
        {label}
      </span>
    );
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
        ) : paidOrders.length === 0 && pendingOrders.length === 0 ? (
          <p className="text-gray-500">Nenhum pedido ainda.</p>
        ) : (
          <div className="space-y-8">
            {paidOrders.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-[#333333] mb-3">Pedidos pagos</h2>
                <ul className="space-y-4">
                  {paidOrders.map((order) => (
                    <li key={order.id} className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <span className="font-medium text-[#333333]">
                          Pedido #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="space-y-1">
                          {renderStatusBadge(order)}
                          {order.deliveredAt && (
                            <p className="text-xs text-gray-500">
                              Entregue em{" "}
                              {new Date(order.deliveredAt).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </div>
                        <p className="text-accent font-bold">
                          {formatPrice(order.totalAmount)}
                        </p>
                      </div>
                      <div className="mt-3">
                        <Link
                          href={`/conta/pedidos/${order.id}`}
                          className="text-sm text-accent hover:underline"
                        >
                          Ver detalhes
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {pendingOrders.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-[#333333] mb-1">
                  Pedidos aguardando pagamento
                </h2>
                <p className="text-xs text-yellow-800 bg-yellow-50 border border-yellow-100 rounded-md px-3 py-2 mb-3">
                  Estes pedidos ainda não tiveram o pagamento confirmado. Eles ficarão
                  visíveis aqui por até 24 horas.
                </p>
                <ul className="space-y-4">
                  {pendingOrders.map((order) => (
                    <li key={order.id} className="bg-white border border-yellow-100 rounded-xl p-4">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <span className="font-medium text-[#333333]">
                          Pedido #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {renderStatusBadge(order)}
                        <p className="text-accent font-bold">
                          {formatPrice(order.totalAmount)}
                        </p>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Para concluir a compra, finalize o pagamento pelo link enviado no momento
                        da criação do pedido.
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
