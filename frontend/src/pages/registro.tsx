import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";

export default function Registro() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Senha deve ter pelo menos 8 caracteres");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      router.push("/");
    } catch (e: any) {
      setError(e.message || "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title="Cadastro — App da Pesca">
      <div className="max-w-md mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-[#333333] mb-6">Cadastre-se</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg" role="alert">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#333333] mb-1">
              Nome
            </label>
            <input
              id="name"
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[#333333]"
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#333333] mb-1">
              E-mail
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
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#333333] mb-1">
              Senha (mín. 8 caracteres)
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[#333333]"
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-accent py-3 disabled:opacity-50"
          >
            {loading ? "Cadastrando…" : "Cadastrar"}
          </button>
        </form>
        <p className="mt-4 text-center text-[#333333]">
          Já tem conta?{" "}
          <Link href="/login" className="text-accent font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </Layout>
  );
}
