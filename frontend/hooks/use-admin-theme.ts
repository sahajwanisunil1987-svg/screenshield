"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "sparekart-admin-theme";

export function useAdminTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  const updateTheme = (nextTheme: "dark" | "light") => {
    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  return {
    theme,
    isDark: theme === "dark",
    setTheme: updateTheme,
    toggleTheme: () => updateTheme(theme === "dark" ? "light" : "dark")
  };
}
