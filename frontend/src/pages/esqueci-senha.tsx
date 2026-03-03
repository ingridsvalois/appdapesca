import { useState } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import { apiPost } from "@/lib/api";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    if (!email) return;
    setLoading(true);
    try {
      await apiPost("/api/auth/forgot-password", { email });
      setMessage(
        "Se este e-mail estiver cadastrado, você receberá um link de recuperação em breve. Verifique também sua caixa de spam."
      );
    } catch (e: any) {
      // Sempre mensagem genérica para evitar enumeração
      setMessage(
        "Se este e-mail estiver cadastrado, você receberá um link de recuperação em breve. Verifique também sua caixa de spam."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title="Recuperar senha — App da Pesca">
      <div className="max-w-md mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-[#333333] mb-6">Esqueci minha senha</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <p className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded" role="status">
              {message}
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded" role="alert">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#333333] mb-1">
              E-mail cadastrado
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[#333333]"
              autoComplete="email"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-accent py-3 disabled:opacity-50"
          >
            {loading ? "Enviando…" : "Enviar link de recuperação"}
          </button>
        </form>
        <p className="mt-4 text-center text-[#333333] text-sm">
          Lembrou da senha?{" "}
          <Link href="/login" className="text-accent font-medium hover:underline">
            Voltar para login
          </Link>
        </p>
      </div>
    </Layout>
  );
}

