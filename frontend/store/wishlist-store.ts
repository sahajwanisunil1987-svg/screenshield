"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types";

type WishlistStore = {
  items: Product[];
  toggle: (product: Product) => void;
  has: (productId: string) => boolean;
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (product) =>
        set((state) => ({
          items: state.items.some((item) => item.id === product.id)
            ? state.items.filter((item) => item.id !== product.id)
            : [...state.items, product]
        })),
      has: (productId) => get().items.some((item) => item.id === productId)
    }),
    { name: "sparekart-wishlist" }
  )
);
