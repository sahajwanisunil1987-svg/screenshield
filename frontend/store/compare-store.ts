"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types";

const MAX_COMPARE_ITEMS = 4;

type CompareStore = {
  items: Product[];
  hasHydrated: boolean;
  toggle: (product: Product) => { active: boolean; limitReached: boolean };
  remove: (productId: string) => void;
  clear: () => void;
  has: (productId: string) => boolean;
  setHydrated: (value: boolean) => void;
};

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,
      toggle: (product) => {
        const exists = get().items.some((item) => item.id === product.id);

        if (exists) {
          set((state) => ({
            items: state.items.filter((item) => item.id !== product.id)
          }));
          return { active: false, limitReached: false };
        }

        if (get().items.length >= MAX_COMPARE_ITEMS) {
          return { active: false, limitReached: true };
        }

        set((state) => ({
          items: [...state.items, product]
        }));
        return { active: true, limitReached: false };
      },
      remove: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId)
        })),
      clear: () => set({ items: [] }),
      has: (productId) => get().items.some((item) => item.id === productId),
      setHydrated: (value) => set({ hasHydrated: value })
    }),
    {
      name: "sparekart-compare",
      partialize: (state) => ({
        items: state.items
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      }
    }
  )
);
