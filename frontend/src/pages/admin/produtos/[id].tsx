import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { apiGet, apiPost, apiPut, apiPostForm } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  stock: number;
  mainImageUrl: string;
  images: string[];
  isActive: boolean;
  categoryId: string;
}

export default function AdminProdutoEditar() {
  const router = useRouter();
  const { id } = router.query;
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [mainImageUrl, setMainImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    stock: "",
    categoryId: "",
    isActive: true,
  });

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    Promise.all([
      apiGet<Category[]>("/api/admin/categories"),
      apiGet<Product>(`/api/admin/products/${id}`).catch(() => null),
    ]).then(([cats, prod]) => {
      setCategories(cats);
      if (prod) {
        setProduct(prod);
        setExistingImages(prod.images || []);
        setMainImageUrl(prod.mainImageUrl);
        setForm({
          name: prod.name,
          slug: prod.slug,
          description: prod.description,
          price: String(prod.price),
          stock: String(prod.stock),
          categoryId: prod.categoryId,
          isActive: prod.isActive,
        });
      }
      setLoading(false);
    });
  }, [id]);

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const created = await apiPost<Category>("/api/admin/categories", {
        name: newCategoryName.trim(),
      });
      setCategories((prev) => {
        const exists = prev.find((c) => c.id === created.id);
        if (exists) return prev;
        return [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
      });
      setForm((f) => ({ ...f, categoryId: created.id }));
      setNewCategoryName("");
      setCreatingCategory(false);
    } catch (err: any) {
      setError(err.message || "Erro ao criar categoria");
    }
  }

  function handleFilesSelected(selected: FileList | null) {
    if (!selected) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const currentFiles = [...files];
    const currentPreviews = [...previewUrls];
    Array.from(selected).forEach((file) => {
      if (!allowedTypes.includes(file.type)) return;
      if (currentFiles.length + existingImages.length >= 5) return;
      currentFiles.push(file);
      currentPreviews.push(URL.createObjectURL(file));
    });
    setFiles(currentFiles);
    setPreviewUrls(currentPreviews);
  }

  function handleRemoveExistingImage(url: string) {
    const nextExisting = existingImages.filter((img) => img !== url);
    setExistingImages(nextExisting);
    if (mainImageUrl === url) {
      setMainImageUrl(nextExisting[0] || "");
    }
  }

  function handleRemoveNewImage(index: number) {
    const nextFiles = files.filter((_, i) => i !== index);
    const nextPreviews = previewUrls.filter((_, i) => i !== index);
    setFiles(nextFiles);
    setPreviewUrls(nextPreviews);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    handleFilesSelected(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || typeof id !== "string") return;
    setError("");
    setSaving(true);
    try {
      if (!mainImageUrl && existingImages.length === 0 && files.length === 0) {
        throw new Error("Mantenha ou envie pelo menos uma imagem do produto.");
      }

      let allImageUrls = [...existingImages];

      if (files.length > 0) {
        setUploading(true);
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        const uploadRes = await apiPostForm<{ images: { url: string; public_id: string }[] }>(
          "/api/admin/upload",
          formData
        );
        const newUrls = uploadRes.images.map((img) => img.url);
        allImageUrls = [...allImageUrls, ...newUrls];
      }

      if (allImageUrls.length === 0) {
        throw new Error("Falha ao enviar imagens.");
      }

      const chosenMain = mainImageUrl && allImageUrls.includes(mainImageUrl)
        ? mainImageUrl
        : allImageUrls[0];

      await apiPut(`/api/admin/products/${id}`, {
        name: form.name,
        slug: form.slug,
        description: form.description,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
        categoryId: form.categoryId,
        mainImageUrl: chosenMain,
        images: allImageUrls,
        isActive: form.isActive,
      });
      router.push("/admin/produtos");
    } catch (e: any) {
      setError(e.message || "Erro ao salvar");
    } finally {
      setUploading(false);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Editar produto">
        <p className="text-gray-500">Carregando…</p>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout title="Produto não encontrado">
        <p className="text-gray-500">Produto não encontrado.</p>
        <Link href="/admin/produtos" className="mt-4 inline-block text-accent hover:underline">
          Voltar
        </Link>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Editar: ${product.name} — Admin`}>
      <Link href="/admin/produtos" className="text-accent hover:underline mb-4 inline-block">
        ← Voltar
      </Link>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Editar produto</h1>
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
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
          <div className="flex items-center gap-3">
            <select
              required={!creatingCategory}
              disabled={creatingCategory}
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="">Selecione</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setCreatingCategory((prev) => !prev);
                setNewCategoryName("");
              }}
              className="text-xs px-3 py-2 rounded-lg border border-dashed border-accent text-accent hover:bg-accent hover:text-white transition-colors"
            >
              {creatingCategory ? "Cancelar" : "＋ Nova categoria"}
            </button>
          </div>
          {creatingCategory && (
            <form onSubmit={handleCreateCategory} className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nome da nova categoria"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="text-xs px-3 py-2 rounded-lg bg-accent text-white hover:bg-accent/90"
              >
                Criar
              </button>
            </form>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-[#333333] mb-1">
            Imagens do produto * (até 5)
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-accent transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <p className="text-sm text-gray-600">
              Arraste e solte imagens aqui, ou clique para selecionar.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Formatos aceitos: JPEG, PNG, WEBP. Máx. 5MB por arquivo, até 5 imagens.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
          </div>
          {(existingImages.length > 0 || previewUrls.length > 0) && (
            <div className="mt-3 grid grid-cols-3 gap-3">
              {existingImages.map((url) => (
                <div
                  key={url}
                  className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                >
                  <img src={url} alt="Imagem atual" className="w-full h-24 object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(url)}
                    className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                    aria-label="Remover imagem"
                  >
                    ×
                  </button>
                  <div className="flex items-center justify-center gap-1 p-1 bg-white">
                    <input
                      type="radio"
                      name="mainImage"
                      checked={mainImageUrl === url}
                      onChange={() => setMainImageUrl(url)}
                      className="h-3 w-3"
                    />
                    <span className="text-[11px] text-gray-700">
                      {mainImageUrl === url ? "Principal" : "Definir principal"}
                    </span>
                  </div>
                </div>
              ))}
              {previewUrls.map((url, index) => (
                <div
                  key={`new-${index}`}
                  className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                >
                  <img src={url} alt="Nova imagem" className="w-full h-24 object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewImage(index)}
                    className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                    aria-label="Remover imagem"
                  >
                    ×
                  </button>
                  <div className="flex items-center justify-center gap-1 p-1 bg-white">
                    <input
                      type="radio"
                      name="mainImage"
                      checked={false}
                      onChange={() => {}}
                      className="h-3 w-3 opacity-40 cursor-not-allowed"
                      disabled
                    />
                    <span className="text-[11px] text-gray-500">Nova (principal após salvar)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
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
          <button
            type="submit"
            disabled={saving || uploading}
            className="btn-accent py-2 px-6 disabled:opacity-50"
          >
            {saving || uploading ? (uploading ? "Enviando imagens…" : "Salvando…") : "Salvar"}
          </button>
          <Link href="/admin/produtos" className="btn-primary py-2 px-6">
            Cancelar
          </Link>
        </div>
      </form>
    </AdminLayout>
  );
}
