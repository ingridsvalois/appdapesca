"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

function formatPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function PaymentForm({
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
      const { error: err } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: typeof window !== "undefined" ? `${window.location.origin}/checkout?success=1` : "",
        },
      });
      if (err) {
        setError(err.message || "Erro no pagamento");
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
      <p className="text-[#333333] font-medium">Total: {formatPrice(total)}</p>
      <PaymentElement options={{ layout: "tabs" }} />
      {error && (
        <p className="text-red-600 text-sm" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-4 mt-6">
        <button type="button" onClick={onBack} className="btn-primary py-2 px-4">
          Voltar
        </button>
        <button type="submit" disabled={!stripe || processing} className="btn-accent py-2 px-4 disabled:opacity-50">
          {processing ? "Processando…" : "Pagar"}
        </button>
      </div>
    </form>
  );
}

export default function CheckoutPayment({
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
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-amber-800">
          Configure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY para habilitar pagamento com cartão.
        </p>
        <button type="button" onClick={onBack} className="mt-2 btn-primary py-2 px-4">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
      <PaymentForm
        clientSecret={clientSecret}
        total={total}
        onSuccess={onSuccess}
        onBack={onBack}
      />
    </Elements>
  );
}
