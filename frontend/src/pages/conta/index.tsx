import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiPut } from "@/lib/api";

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(80, "Nome deve ter no máximo 80 caracteres"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Conta() {
  const router = useRouter();
  const { user, loading, refreshUser } = useAuth();
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/conta");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      reset({ name: user.name });
    }
  }, [user, reset]);

  async function onSubmit(values: ProfileFormValues) {
    if (!user) return;
    setServerError("");
    setSuccessMessage("");
    try {
      await apiPut("/api/users/me", { name: values.name.trim() });
      await refreshUser();
      setSuccessMessage("Dados atualizados com sucesso!");
    } catch (err: any) {
      setServerError(err.message || "Erro ao atualizar dados.");
    }
  }

  if (loading || !user) {
    return (
      <Layout title="Minha conta">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500">Carregando…</div>
      </Layout>
    );
  }

  return (
    <Layout title="Minha conta — App da Pesca">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-[#333333] mb-6">Minha conta</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded" role="alert">
                {serverError}
              </p>
            )}
            {successMessage && (
              <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded" role="status">
                {successMessage}
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1" htmlFor="name">
                Nome
              </label>
              <input
                id="name"
                type="text"
                {...register("name")}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={user.email}
                readOnly
                className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-lg px-4 py-2 cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-accent px-6 py-2 disabled:opacity-50"
            >
              {isSubmitting ? "Salvando…" : "Salvar alterações"}
            </button>
          </form>
        </div>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link href="/conta/pedidos" className="btn-primary">
            Meus pedidos
          </Link>
          <Link href="/conta/enderecos" className="btn-primary">
            Endereços
          </Link>
        </div>
      </div>
    </Layout>
  );
}
