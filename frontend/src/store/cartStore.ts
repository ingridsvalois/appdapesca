"use client";

import { create } from "zustand";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { CartResponse, CartItem } from "@/types";

export interface LocalCartItem {
  productId: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  cartId: string | null;
  loading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  mergeItems: (items: LocalCartItem[]) => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  cartId: null,
  loading: false,

  fetchCart: async () => {
    set({ loading: true });
    try {
      const data = await apiGet<CartResponse>("/api/cart");
      set({
        items: data.items ?? [],
        total: data.total ?? 0,
        cartId: data.id ?? null,
      });
    } catch {
      set({ items: [], total: 0, cartId: null });
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (productId: string, quantity: number) => {
    set({ loading: true });
    try {
      const data = await apiPost<CartResponse>("/api/cart/items", { productId, quantity });
      set({ items: data.items, total: data.total, cartId: data.id });
    } finally {
      set({ loading: false });
    }
  },

  updateItem: async (itemId: string, quantity: number) => {
    set({ loading: true });
    try {
      const data = await apiPut<CartResponse>(`/api/cart/items/${itemId}`, { quantity });
      set({ items: data.items, total: data.total });
    } finally {
      set({ loading: false });
    }
  },

  removeItem: async (itemId: string) => {
    set({ loading: true });
    try {
      const data = await apiDelete<CartResponse>(`/api/cart/items/${itemId}`);
      set({ items: data.items ?? [], total: data.total ?? 0, cartId: data.id ?? null });
    } finally {
      set({ loading: false });
    }
  },

  mergeItems: async (items: LocalCartItem[]) => {
    set({ loading: true });
    try {
      for (const { productId, quantity } of items) {
        await apiPost("/api/cart/items", { productId, quantity });
      }
      await get().fetchCart();
    } finally {
      set({ loading: false });
    }
  },
}));
