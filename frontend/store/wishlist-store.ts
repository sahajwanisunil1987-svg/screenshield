"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Product } from "@/types";

type WishlistStore = {
  guestItems: Product[];
  items: Product[];
  syncFromServer: () => Promise<void>;
  setGuestMode: () => void;
  toggle: (product: Product) => Promise<boolean>;
  has: (productId: string) => boolean;
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      guestItems: [],
      items: [],
      syncFromServer: async () => {
        const token = useAuthStore.getState().token;

        if (!token) {
          set((state) => ({ items: state.guestItems }));
          return;
        }

        try {
          const response = await api.get("/wishlist", authHeaders(token));
          set({ items: response.data });
        } catch (error) {
          throw new Error(getApiErrorMessage(error, "Unable to load wishlist"));
        }
      },
      setGuestMode: () =>
        set((state) => ({
          items: state.guestItems
        })),
      toggle: async (product) => {
        const token = useAuthStore.getState().token;
        const exists = get().items.some((item) => item.id === product.id);

        if (token) {
          try {
            const response = exists
              ? await api.delete(`/wishlist/${product.id}`, authHeaders(token))
              : await api.post(`/wishlist/${product.id}`, undefined, authHeaders(token));

            set({ items: response.data });
            return !exists;
          } catch (error) {
            throw new Error(getApiErrorMessage(error, "Unable to update wishlist"));
          }
        }

        set((state) => {
          const nextGuestItems = state.guestItems.some((item) => item.id === product.id)
            ? state.guestItems.filter((item) => item.id !== product.id)
            : [...state.guestItems, product];

          return {
            guestItems: nextGuestItems,
            items: nextGuestItems
          };
        });

        return !exists;
      },
      has: (productId) => get().items.some((item) => item.id === productId)
    }),
    {
      name: "sparekart-wishlist",
      partialize: (state) => ({
        guestItems: state.guestItems,
        items: state.items
      })
    }
  )
);
