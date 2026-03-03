import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/Layout";
import { apiGet, apiPost } from "@/lib/api";

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token || typeof token !== "string") return;
    setValidating(true);
    apiGet<{ valid: boolean; message?: string }>(
      `/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`
    )
      .then((res) => {
        setValid(res.valid);
        if (!res.valid && res.message) setError(res.message);
      })
      .catch(() => {
        setValid(false);
        setError("Link inválido ou expirado. Solicite uma nova recuperação de senha.");
      })
      .finally(() => setValidating(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || typeof token !== "string") return;
    setError("");
    setMessage("");
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/api/auth/reset-password", {
        token,
        password,
      });
      setMessage("Senha alterada com sucesso! Você será redirecionado para o login.");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (e: any) {
      setError(e.message || "Não foi possível redefinir a senha.");
    } finally {
      setSubmitting(false);
    }
  }

  if (validating) {
    return (
      <Layout title="Redefinir senha — App da Pesca">
        <div className="max-w-md mx-auto px-4 py-12 text-center text-gray-500">Validando link…</div>
      </Layout>
    );
  }

  if (!valid) {
    return (
      <Layout title="Redefinir senha — App da Pesca">
        <div className="max-w-md mx-auto px-4 py-12">
          <h1 className="text-2xl font-bold text-[#333333] mb-4">Link inválido</h1>
          <p className="text-sm text-gray-600 mb-4">
            {error || "Este link de recuperação não é mais válido."}
          </p>
          <Link href="/esqueci-senha" className="text-accent font-medium hover:underline text-sm">
            Solicitar novo link de recuperação
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Redefinir senha — App da Pesca">
      <div className="max-w-md mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-[#333333] mb-6">Redefinir senha</h1>
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
            <label htmlFor="password" className="block text-sm font-medium text-[#333333] mb-1">
              Nova senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[#333333]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo de 8 caracteres. Use letras maiúsculas, minúsculas e números para maior segurança.
            </p>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#333333] mb-1">
              Confirmar nova senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[#333333]"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-accent py-3 disabled:opacity-50"
          >
            {submitting ? "Redefinindo…" : "Redefinir senha"}
          </button>
        </form>
      </div>
    </Layout>
  );
}

