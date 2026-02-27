import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { apiGet, apiPost } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function AdminProdutoNovo() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    stock: "",
    categoryId: "",
    mainImageUrl: "",
    images: "" as string,
    isActive: true,
  });

  useEffect(() => {
    apiGet<Category[]>("/api/admin/categories")
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  function slugify(s: string) {
    return s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: slugify(name) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const images = form.images.trim() ? form.images.split("\n").map((u) => u.trim()).filter(Boolean) : [];
      await apiPost("/api/admin/products", {
        name: form.name,
        slug: form.slug,
        description: form.description,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
        categoryId: form.categoryId,
        mainImageUrl: form.mainImageUrl || "https://placehold.co/400x400?text=Produto",
        images,
        isActive: form.isActive,
      });
      router.push("/admin/produtos");
    } catch (e: any) {
      setError(e.message || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout title="Novo produto — Admin">
      <Link href="/admin/produtos" className="text-accent hover:underline mb-4 inline-block">
        ← Voltar
      </Link>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Novo produto</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4 bg-white rounded-xl border border-gray-200 p-6">
        {error && (
          <p className="text-red-600 text-sm bg-red-50 p-3 rounded" role="alert">
            {error}
          </p>
        )}
        <div>
          <label className="block text-sm font-medium text-[#333333] mb-1">Nome *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#333333] mb-1">Slug *</label>
          <input
            type="text"
            required
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#333333] mb-1">Descrição *</label>
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1">Preço *</label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1">Estoque *</label>
            <input
              type="number"
              required
              min="0"
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#333333] mb-1">Categoria *</label>
          <select
            required
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">Selecione</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#333333] mb-1">URL da imagem principal *</label>
          <input
            type="url"
            value={form.mainImageUrl}
            onChange={(e) => setForm((f) => ({ ...f, mainImageUrl: e.target.value }))}
            placeholder="https://..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#333333] mb-1">URLs de imagens extras (uma por linha)</label>
          <textarea
            rows={2}
            value={form.images}
            onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))}
            placeholder="https://..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="rounded"
          />
          <label htmlFor="isActive" className="text-sm text-[#333333]">
            Produto ativo
          </label>
        </div>
        <div className="flex gap-4 pt-4">
          <button type="submit" disabled={loading} className="btn-accent py-2 px-6 disabled:opacity-50">
            {loading ? "Salvando…" : "Salvar"}
          </button>
          <Link href="/admin/produtos" className="btn-primary py-2 px-6">
            Cancelar
          </Link>
        </div>
      </form>
    </AdminLayout>
  );
}
