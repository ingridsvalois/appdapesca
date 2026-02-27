"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import type { User } from "@/types";
import type { CartResponse } from "@/types";
import { useCartStore } from "@/store/cartStore";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const mergeItems = useCartStore((s) => s.mergeItems);

  async function refreshUser() {
    try {
      const data = await apiGet<User>("/api/users/me");
      setUser(data);
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    let guestCart: CartResponse | null = null;
    try {
      guestCart = await apiGet<CartResponse>("/api/cart");
    } catch {}
    await apiPost<{ user: User }>("/api/auth/login", { email, password });
    await refreshUser();
    if (guestCart?.items?.length) {
      await mergeItems(guestCart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
    }
  }

  async function register(name: string, email: string, password: string) {
    await apiPost<{ user: User }>("/api/auth/register", { name, email, password });
    await refreshUser();
  }

  async function logout() {
    try {
      await apiPost("/api/auth/logout", {});
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
