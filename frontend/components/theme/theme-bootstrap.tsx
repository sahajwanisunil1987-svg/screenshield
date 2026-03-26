"use client";

import { useEffect } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme";

export function ThemeBootstrap() {
  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const theme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light";
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, []);

  return null;
}
