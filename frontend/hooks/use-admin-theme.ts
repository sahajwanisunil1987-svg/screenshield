"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "sparekart-admin-theme";
const SITE_STORAGE_KEY = "sparekart-site-theme";
const DEFAULT_THEME: "dark" | "light" = "dark";

const applyThemeToDocument = (theme: "dark" | "light") => {
  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
};

export function useAdminTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(DEFAULT_THEME);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(SITE_STORAGE_KEY);
    const nextTheme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : DEFAULT_THEME;
    setTheme(nextTheme);
    applyThemeToDocument(nextTheme);
  }, []);

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const updateTheme = (nextTheme: "dark" | "light") => {
    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    window.localStorage.setItem(SITE_STORAGE_KEY, nextTheme);
    applyThemeToDocument(nextTheme);
  };

  return {
    theme,
    isDark: theme === "dark",
    setTheme: updateTheme,
    toggleTheme: () => updateTheme(theme === "dark" ? "light" : "dark")
  };
}
