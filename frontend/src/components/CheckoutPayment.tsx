"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    "pk_live_51ROiKPCdvLsqGFNBCbFkKxQUkHjJyCSnbCuMy31W6O7VgBGgVqBMYMKJlViqBXCjpKeIUasTdYiaeY06G3CrhxaF00CfS7cwyR"
);

type PaymentMethodType = "credit" | "debit" | "pix";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

/* ───── Seletor de Método de Pagamento ───── */
function MethodSelector({
  selected,
  onSelect,
}: {
  selected: PaymentMethodType | null;
  onSelect: (m: PaymentMethodType) => void;
}) {
  const methods = [
    {
      id: "credit" as const,
      label: "Crédito",
      icon: "💳",
      desc: "Cartão de crédito",
    },
    {
      id: "debit" as const,
      label: "Débito",
      icon: "💳",
      desc: "Cartão de débito",
    },
    // PIX desabilitado até ativar no Stripe Dashboard
    // {
    //   id: "pix" as const,
    //   label: "PIX",
    //   icon: "📱",
    //   desc: "Pagamento instantâneo",
    // },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-[#333333]">
        Selecione a forma de pagamento:
      </p>
      <div className="grid grid-cols-3 gap-3">
        {methods.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelect(m.id)}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              selected === m.id
                ? "border-[#308E10] bg-[#308E10]/5 shadow-sm"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <span className="text-2xl block mb-1">{m.icon}</span>
            <span className="font-semibold text-sm text-[#333333]">{m.label}</span>
            <span className="block text-xs text-gray-500 mt-1">{m.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ───── Formulário de Pagamento (Card) ───── */
function CardPaymentForm({
  clientSecret,
  total,
  selectedMethod,
  onSuccess,
  onBack,
}: {
  clientSecret: string;
  total: number;
  selectedMethod: PaymentMethodType;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError("");
    setProcessing(true);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || "Erro na validação");
        setProcessing(false);
        return;
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout?success=1`,
        },
      });
      if (confirmError) {
        setError(confirmError.message || "Erro no pagamento");
      } else {
        onSuccess();
      }
    } catch (e: any) {
      setError(e.message || "Erro ao processar");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-800">
          {selectedMethod === "credit"
            ? "💳 Pagamento no Crédito"
            : "💳 Pagamento no Débito"}
        </p>
      </div>

      <PaymentElement
        options={{
          layout: "tabs",
          fields: { billingDetails: "auto" },
        }}
      />

      {error && (
        <p className="text-red-600 text-sm bg-red-50 p-3 rounded" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-4 mt-6">
        <button type="button" onClick={onBack} className="btn-primary py-2 px-4">
          Voltar
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="btn-accent py-2 px-4 disabled:opacity-50"
        >
          {processing ? "Processando…" : `Pagar ${formatPrice(total)}`}
        </button>
      </div>
    </form>
  );
}

/* ───── Formulário de Pagamento (PIX) ───── */
function PixPaymentForm({
  clientSecret,
  total,
  onSuccess,
  onBack,
}: {
  clientSecret: string;
  total: number;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError("");
    setProcessing(true);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || "Erro na validação");
        setProcessing(false);
        return;
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout?success=1`,
        },
      });
      if (confirmError) {
        setError(confirmError.message || "Erro no pagamento");
      } else {
        onSuccess();
      }
    } catch (e: any) {
      setError(e.message || "Erro ao processar");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-green-50 p-3 rounded-lg">
        <p className="text-sm text-green-800">
          📱 Pagamento via PIX — Escaneie o QR Code ou copie o código
        </p>
        <p className="text-xs text-green-600 mt-1">
          O pagamento expira em 30 minutos
        </p>
      </div>

      <PaymentElement
        options={{
          layout: "tabs",
          fields: { billingDetails: "auto" },
        }}
      />

      {error && (
        <p className="text-red-600 text-sm bg-red-50 p-3 rounded" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-4 mt-6">
        <button type="button" onClick={onBack} className="btn-primary py-2 px-4">
          Voltar
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="btn-accent py-2 px-4 disabled:opacity-50"
        >
          {processing ? "Gerando PIX…" : `Pagar ${formatPrice(total)} com PIX`}
        </button>
      </div>
    </form>
  );
}

/* ───── Componente Principal ───── */
export default function CheckoutPayment({
  clientSecret,
  total,
  onSuccess,
  onBack,
  onMethodSelect,
}: {
  clientSecret: string | null;
  total: number;
  onSuccess: () => void;
  onBack: () => void;
  onMethodSelect?: (method: string) => void;
}) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | null>(null);

  function handleMethodSelect(method: PaymentMethodType) {
    setSelectedMethod(method);
    if (onMethodSelect) {
      onMethodSelect(method === "pix" ? "pix" : method);
    }
  }

  // Passo 1: Selecionar método
  if (!selectedMethod) {
    return (
      <div className="space-y-6">
        <p className="text-[#333333] font-medium text-lg">
          Total: {formatPrice(total)}
        </p>
        <MethodSelector selected={selectedMethod} onSelect={handleMethodSelect} />
        <div className="flex gap-4 mt-6">
          <button type="button" onClick={onBack} className="btn-primary py-2 px-4">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // Passo 2: Aguardando clientSecret (PaymentIntent sendo criado)
  if (!clientSecret) {
    return (
      <div className="space-y-6">
        <MethodSelector selected={selectedMethod} onSelect={handleMethodSelect} />
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#308E10]"></div>
          <span className="ml-3 text-gray-600">Preparando pagamento...</span>
        </div>
      </div>
    );
  }

  const appearance = {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "#308E10",
      fontFamily: "system-ui, sans-serif",
    },
  };

  // Passo 3: Formulário de pagamento
  if (selectedMethod === "pix") {
    return (
      <div className="space-y-4">
        <MethodSelector selected={selectedMethod} onSelect={handleMethodSelect} />
        <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
          <PixPaymentForm
            clientSecret={clientSecret}
            total={total}
            onSuccess={onSuccess}
            onBack={() => setSelectedMethod(null)}
          />
        </Elements>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <MethodSelector selected={selectedMethod} onSelect={handleMethodSelect} />
      <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
        <CardPaymentForm
          clientSecret={clientSecret}
          total={total}
          selectedMethod={selectedMethod}
          onSuccess={onSuccess}
          onBack={() => setSelectedMethod(null)}
        />
      </Elements>
    </div>
  );
}