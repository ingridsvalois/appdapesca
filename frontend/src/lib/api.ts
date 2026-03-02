const API_URL = "https://appdapesca-production.up.railway.app";

type RequestInitWithCredentials = RequestInit & { credentials?: "include" };

export async function api<T>(
  path: string,
  options: RequestInitWithCredentials = {}
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;

  console.log("📤 Requisição para:", url);

  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Erro ${res.status}`);
  }
  return data as T;
}

export function apiGet<T>(path: string) {
  return api<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body: unknown) {
  return api<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function apiPut<T>(path: string, body: unknown) {
  return api<T>(path, { method: "PUT", body: JSON.stringify(body) });
}

export function apiDelete<T>(path: string) {
  return api<T>(path, { method: "DELETE" });
}

export function apiPatch<T>(path: string, body: unknown) {
  return api<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export function apiPostForm<T>(path: string, formData: FormData) {
  return api<T>(path, { method: "POST", body: formData });
}