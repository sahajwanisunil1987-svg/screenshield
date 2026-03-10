"use client";

import { useEffect } from "react";

export function ThemeBootstrap() {
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("sparekart-theme");
    const theme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light";
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, []);

  return null;
}
