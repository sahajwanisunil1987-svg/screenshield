"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useWishlistStore } from "@/store/wishlist-store";

export function WishlistSync() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const syncFromServer = useWishlistStore((state) => state.syncFromServer);
  const setGuestMode = useWishlistStore((state) => state.setGuestMode);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (token && user) {
      void syncFromServer();
      return;
    }

    setGuestMode();
  }, [hasHydrated, setGuestMode, syncFromServer, token, user]);

  return null;
}
