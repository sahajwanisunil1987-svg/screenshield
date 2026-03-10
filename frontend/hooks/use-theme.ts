"use client";

import { useEffect, useState } from "react";

export type AppTheme = "dark" | "light";

const STORAGE_KEY = "sparekart-theme";

function applyTheme(theme: AppTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function useTheme() {
  const [theme, setTheme] = useState<AppTheme>("light");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    const nextTheme: AppTheme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    setHydrated(true);
  }, []);

  const updateTheme = (nextTheme: AppTheme) => {
    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  };

  return {
    theme,
    hydrated,
    isDark: theme === "dark",
    setTheme: updateTheme,
    toggleTheme: () => updateTheme(theme === "dark" ? "light" : "dark")
  };
}
