"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types";

type CartItem = {
  product: Product;
  quantity: number;
};

type CartStore = {
  items: CartItem[];
  couponCode: string;
  couponDiscount: number;
  hasHydrated: boolean;
  addItem: (product: Product) => void;
  updateQty: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  applyCoupon: (payload: { code: string; discount: number }) => void;
  clearCoupon: () => void;
  clear: () => void;
  setHydrated: (value: boolean) => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      couponCode: "",
      couponDiscount: 0,
      hasHydrated: false,
      addItem: (product) =>
        set((state) => {
          const existing = state.items.find((item) => item.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
              )
            };
          }

          return {
            items: [...state.items, { product, quantity: 1 }]
          };
        }),
      updateQty: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity: Math.max(quantity, 1) } : item
          )
        })),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId)
        })),
      applyCoupon: ({ code, discount }) => set({ couponCode: code, couponDiscount: discount }),
      clearCoupon: () => set({ couponCode: "", couponDiscount: 0 }),
      clear: () => set({ items: [], couponCode: "", couponDiscount: 0 }),
      setHydrated: (value) => set({ hasHydrated: value })
    }),
    {
      name: "sparekart-cart",
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        couponDiscount: state.couponDiscount
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      }
    }
  )
);
