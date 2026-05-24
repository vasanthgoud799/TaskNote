import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

const resolveTheme = (theme) => {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme || "dark";
};

const getInitialTheme = () => {
  const visualThemeVersion = localStorage.getItem("tasknote-theme-version");
  if (visualThemeVersion !== "2") {
    localStorage.setItem("tasknote-theme", "amoled");
    localStorage.setItem("tasknote-theme-version", "2");
    return "amoled";
  }
  const savedTheme = localStorage.getItem("tasknote-theme");
  if (savedTheme) {
    return savedTheme;
  }
  return "amoled";
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(getInitialTheme()));

  useEffect(() => {
    const applyTheme = () => {
      const nextResolvedTheme = resolveTheme(theme);
      setResolvedTheme(nextResolvedTheme);
      document.documentElement.dataset.theme = nextResolvedTheme;
      document.documentElement.dataset.themePreference = theme;
      document.documentElement.classList.toggle("dark", nextResolvedTheme !== "light");
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", nextResolvedTheme === "light" ? "#f7f1e8" : "#080807");
    };

    applyTheme();
    localStorage.setItem("tasknote-theme", theme);

    if (theme !== "system") return undefined;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (resolveTheme(currentTheme) === "light" ? "dark" : "light"));
  };

  const value = useMemo(() => ({ theme, resolvedTheme, toggleTheme, setTheme }), [theme, resolvedTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
