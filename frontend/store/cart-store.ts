"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product, ProductVariant } from "@/types";

export type CartItem = {
  product: Product;
  variantId?: string;
  variantLabel?: string | null;
  variantSku?: string;
  imageUrl?: string | null;
  unitPrice: number;
  comparePrice?: number | null;
  availableStock: number;
  quantity: number;
};

type CartStore = {
  items: CartItem[];
  couponCode: string;
  couponDiscount: number;
  hasHydrated: boolean;
  addItem: (product: Product, variant?: ProductVariant | null) => void;
  updateQty: (productId: string, quantity: number, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  applyCoupon: (payload: { code: string; discount: number }) => void;
  clearCoupon: () => void;
  clear: () => void;
  setHydrated: (value: boolean) => void;
};

const getCartKey = (productId: string, variantId?: string) => `${productId}:${variantId ?? "base"}`;

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      couponCode: "",
      couponDiscount: 0,
      hasHydrated: false,
      addItem: (product, variant) =>
        set((state) => {
          const key = getCartKey(product.id, variant?.id);
          const existing = state.items.find((item) => getCartKey(item.product.id, item.variantId) === key);
          const availableStock = variant?.stock ?? product.inventory?.stock ?? product.stock;
          if (existing) {
            return {
              items: state.items.map((item) =>
                getCartKey(item.product.id, item.variantId) === key
                  ? { ...item, quantity: Math.min(item.quantity + 1, availableStock), availableStock }
                  : item
              )
            };
          }

          return {
            items: [
              ...state.items,
              {
                product,
                variantId: variant?.id,
                variantLabel: variant?.label,
                variantSku: variant?.sku ?? product.sku,
                imageUrl: variant?.imageUrl ?? product.images[0]?.url ?? null,
                unitPrice: variant?.price ?? product.price,
                comparePrice: variant?.comparePrice ?? product.comparePrice ?? null,
                availableStock,
                quantity: 1
              }
            ]
          };
        }),
      updateQty: (productId, quantity, variantId) =>
        set((state) => ({
          items: state.items.map((item) =>
            getCartKey(item.product.id, item.variantId) === getCartKey(productId, variantId)
              ? { ...item, quantity: Math.max(Math.min(quantity, item.availableStock), 1) }
              : item
          )
        })),
      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter((item) => getCartKey(item.product.id, item.variantId) !== getCartKey(productId, variantId))
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
