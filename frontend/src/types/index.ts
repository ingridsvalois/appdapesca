export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  stock: number;
  mainImageUrl: string;
  images: string[];
  averageRating: number;
  isActive?: boolean;
  category?: Category;
  categoryId?: string;
}

export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product: {
    id: string;
    name: string;
    slug: string;
    mainImageUrl: string;
    stock: number;
    price?: number;
  };
}

export interface CartResponse {
  id: string | null;
  items: CartItem[];
  total: number;
}

export interface Address {
  id: string;
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}
