import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Link from "next/link";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { useCartStore } from "@/store/cartStore";
import { apiGet, apiPost } from "@/lib/api";
import type { Address } from "@/types";

const CheckoutPayment = dynamic(() => import("@/components/CheckoutPayment"), { ssr: false });

function formatPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

type Step = 1 | 2 | 3;

export default function Checkout() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, total, fetchCart } = useCartStore();
  const [step, setStep] = useState<Step>(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [shippingAddress, setShippingAddress] = useState<{
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    zipCode: string;
  } | null>(null);
  const [manualAddress, setManualAddress] = useState({
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [ufLoading, setUfLoading] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [cepLoading, setCepLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  // Guardar endereço validado para usar depois
  const [validatedAddress, setValidatedAddress] = useState<any>(null);

  const estados = [
    { sigla: "AC", nome: "Acre" },
    { sigla: "AL", nome: "Alagoas" },
    { sigla: "AP", nome: "Amapá" },
    { sigla: "AM", nome: "Amazonas" },
    { sigla: "BA", nome: "Bahia" },
    { sigla: "CE", nome: "Ceará" },
    { sigla: "DF", nome: "Distrito Federal" },
    { sigla: "ES", nome: "Espírito Santo" },
    { sigla: "GO", nome: "Goiás" },
    { sigla: "MA", nome: "Maranhão" },
    { sigla: "MT", nome: "Mato Grosso" },
    { sigla: "MS", nome: "Mato Grosso do Sul" },
    { sigla: "MG", nome: "Minas Gerais" },
    { sigla: "PA", nome: "Pará" },
    { sigla: "PB", nome: "Paraíba" },
    { sigla: "PR", nome: "Paraná" },
    { sigla: "PE", nome: "Pernambuco" },
    { sigla: "PI", nome: "Piauí" },
    { sigla: "RJ", nome: "Rio de Janeiro" },
    { sigla: "RN", nome: "Rio Grande do Norte" },
    { sigla: "RS", nome: "Rio Grande do Sul" },
    { sigla: "RO", nome: "Rondônia" },
    { sigla: "RR", nome: "Roraima" },
    { sigla: "SC", nome: "Santa Catarina" },
    { sigla: "SP", nome: "São Paulo" },
    { sigla: "SE", nome: "Sergipe" },
    { sigla: "TO", nome: "Tocantins" },
  ];

  async function loadCities(uf: string) {
    if (!uf) {
      setCities([]);
      return;
    }
    try {
      setCityLoading(true);
      const res = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
      );
      const data = await res.json();
      const names = (data as any[])
        .map((c) => c.nome as string)
        .sort((a, b) => a.localeCompare(b));
      setCities(names);
    } catch {
      setCities([]);
    } finally {
      setCityLoading(false);
    }
  }

  async function handleCepLookup(value: string) {
    const numeric = value.replace(/\D/g, "");
    if (numeric.length !== 8) return;
    try {
      setCepLoading(true);
      const res = await fetch(`https://viacep.com.br/ws/${numeric}/json/`);
      const data = await res.json();
      if (data.erro) {
        setError("CEP não encontrado. Por favor, preencha o endereço manualmente.");
        return;
      }
      const uf = (data.uf || "").toUpperCase();
      setManualAddress((a) => ({
        ...a,
        street: data.logradouro || a.street,
        district: data.bairro || a.district,
        city: data.localidade || a.city,
        state: uf || a.state,
        zipCode: numeric,
      }));
      await loadCities(uf);
    } catch {
      setError("Não foi possível buscar o CEP. Preencha o endereço manualmente.");
    } finally {
      setCepLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?redirect=/checkout");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (router.query.success === "1") setStep(3);
  }, [router.query.success]);

  useEffect(() => {
    if (!user) return;
    fetchCart();
    apiGet<Address[]>("/api/users/me/addresses")
      .then(setAddresses)
      .catch(() => setAddresses([]));
  }, [user, fetchCart]);

  useEffect(() => {
    if (selectedAddressId && addresses.length) {
      const addr = addresses.find((a) => a.id === selectedAddressId);
      if (addr) {
        setShippingAddress({
          street: addr.street,
          number: addr.number,
          complement: addr.complement ?? undefined,
          district: addr.district,
          city: addr.city,
          state: addr.state,
          zipCode: addr.zipCode,
        });
      }
    } else {
      setShippingAddress(null);
    }
  }, [selectedAddressId, addresses]);

  // Passo 1 → Passo 2: Validar endereço e ir para seleção de método
  function goToMethodSelection() {
    setError("");
    const addr = selectedAddressId
      ? shippingAddress
      : {
          street: manualAddress.street,
          number: manualAddress.number,
          complement: manualAddress.complement || undefined,
          district: manualAddress.district,
          city: manualAddress.city,
          state: manualAddress.state,
          zipCode: manualAddress.zipCode,
        };

    if (selectedAddressId && !addr) {
      setError("Selecione um endereço.");
      return;
    }
    if (!selectedAddressId) {
      if (
        !manualAddress.street ||
        !manualAddress.number ||
        !manualAddress.district ||
        !manualAddress.city ||
        !manualAddress.state ||
        manualAddress.zipCode.replace(/\D/g, "").length < 8
      ) {
        setError("Preencha todos os campos do endereço.");
        return;
      }
    }

    // Salvar endereço validado e avançar
    setValidatedAddress({
      addr,
      addressId: selectedAddressId || null,
    });
    setStep(2);
  }

  // Quando o usuário seleciona o método de pagamento → Criar PaymentIntent
  async function handleMethodSelect(method: string) {
    if (!validatedAddress) return;
    setSelectedPaymentMethod(method);
    setError("");
    setProcessing(true);
    setClientSecret(null);

    try {
      const body: any = {
        paymentMethod: method, // "credit", "debit" ou "pix"
      };
      if (validatedAddress.addressId) {
        body.addressId = validatedAddress.addressId;
      } else {
        body.shippingAddress = validatedAddress.addr;
      }

      const res = await apiPost<{ clientSecret: string; orderId: string }>(
        "/api/checkout/create-payment-intent",
        body
      );
      setClientSecret(res.clientSecret);
    } catch (e: any) {
      setError(e.message || "Erro ao criar pagamento");
      setSelectedPaymentMethod(null);
    } finally {
      setProcessing(false);
    }
  }

  function onPaymentSuccess() {
    setStep(3);
  }

  if (authLoading || !user) {
    return (
      <Layout title="Checkout">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500">Carregando…</div>
      </Layout>
    );
  }

  if (items.length === 0 && step < 3) {
    return (
      <Layout title="Checkout — App da Pesca">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-gray-500">Seu carrinho está vazio.</p>
          <Link href="/produtos" className="mt-4 inline-block btn-primary">
            Ir às compras
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Checkout — App da Pesca">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[#333333] mb-6">Checkout</h1>

        {/* Indicador de passos */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { n: 1, label: "Endereço" },
            { n: 2, label: "Pagamento" },
            { n: 3, label: "Confirmação" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s.n
                    ? "bg-[#308E10] text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {s.n}
              </div>
              <span
                className={`text-sm ${
                  step >= s.n ? "text-[#333333] font-medium" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
              {i < 2 && <div className="w-8 h-px bg-gray-300" />}
            </div>
          ))}
        </div>

        {/* PASSO 1: Endereço */}
        {step === 1 && (
          <>
            <h2 className="font-semibold text-[#333333] mb-4">Endereço de entrega</h2>
            {addresses.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">Usar endereço salvo</label>
                <select
                  value={selectedAddressId}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[#333333]"
                >
                  <option value="">Novo endereço</option>
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.street}, {a.number}, {a.city}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {(!selectedAddressId || addresses.length === 0) && (
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">Endereço de entrega</p>
                <div className="flex items-center gap-2">
                  <input
                    placeholder="CEP"
                    value={manualAddress.zipCode}
                    onChange={(e) => {
                      const numeric = e.target.value.replace(/\D/g, "").slice(0, 8);
                      setManualAddress((a) => ({ ...a, zipCode: numeric }));
                    }}
                    onBlur={(e) => handleCepLookup(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                  />
                  {cepLoading && (
                    <span className="text-xs text-gray-500">Buscando CEP…</span>
                  )}
                </div>
                <input
                  placeholder="Rua / Logradouro"
                  value={manualAddress.street}
                  onChange={(e) => setManualAddress((a) => ({ ...a, street: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    placeholder="Número"
                    value={manualAddress.number}
                    onChange={(e) => setManualAddress((a) => ({ ...a, number: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  />
                  <input
                    placeholder="Complemento (opcional)"
                    value={manualAddress.complement}
                    onChange={(e) =>
                      setManualAddress((a) => ({ ...a, complement: e.target.value }))
                    }
                    className="col-span-2 border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <input
                  placeholder="Bairro"
                  value={manualAddress.district}
                  onChange={(e) => setManualAddress((a) => ({ ...a, district: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <select
                      value={manualAddress.state}
                      onChange={async (e) => {
                        const uf = e.target.value;
                        setManualAddress((a) => ({ ...a, state: uf, city: "" }));
                        await loadCities(uf);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Estado (UF)</option>
                      {estados.map((uf) => (
                        <option key={uf.sigla} value={uf.sigla}>
                          {uf.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <select
                      value={manualAddress.city}
                      onChange={(e) =>
                        setManualAddress((a) => ({ ...a, city: e.target.value }))
                      }
                      disabled={!manualAddress.state || cityLoading}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">
                        {cityLoading
                          ? "Carregando cidades..."
                          : manualAddress.state
                            ? "Selecione a cidade"
                            : "Selecione o estado primeiro"}
                      </option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <p className="text-red-600 text-sm mb-4" role="alert">
                {error}
              </p>
            )}
            <div className="flex gap-4 mt-6">
              <Link href="/carrinho" className="btn-primary py-2 px-4">
                Voltar
              </Link>
              <button
                type="button"
                onClick={goToMethodSelection}
                className="btn-accent py-2 px-4"
              >
                Ir para pagamento
              </button>
            </div>
          </>
        )}

        {/* PASSO 2: Selecionar método + Pagar */}
        {step === 2 && (
          <>
            <CheckoutPayment
              clientSecret={clientSecret}
              total={total}
              processing={processing}
              apiError={error}
              onSuccess={onPaymentSuccess}
              onBack={() => {
                setStep(1);
                setClientSecret(null);
                setSelectedPaymentMethod(null);
                setError("");
              }}
              onMethodSelect={handleMethodSelect}
              onRetry={() => setError("")}
            />
          </>
        )}

        {/* PASSO 3: Confirmação */}
        {step === 3 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <h2 className="text-xl font-bold text-[#333333] mb-2">Pedido realizado!</h2>
            <p className="text-[#333333] mb-4">
              O pagamento foi confirmado. Você pode acompanhar em{" "}
              <Link href="/conta/pedidos" className="text-accent font-medium hover:underline">
                Meus pedidos
              </Link>
              .
            </p>
            <Link href="/produtos" className="btn-accent inline-block">
              Continuar comprando
            </Link>
          </div>
        )}

        {/* Resumo */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="font-medium text-[#333333]">Resumo</p>
          <p className="text-[#333333]">
            {items.length} item(ns) —{" "}
            <span className="font-bold text-accent">{formatPrice(total)}</span>
          </p>
        </div>
      </div>
    </Layout>
  );
}