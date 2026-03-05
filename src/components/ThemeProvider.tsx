"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "fluid" | "bauhaus" | "swiss" | "postmodern" | "skeuomorphic";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("fluid");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem("design-era-theme") as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("design-era-theme", theme);
      // Remove all theme classes and add the new one
      const root = document.documentElement;
      const themes: Theme[] = ["fluid", "bauhaus", "swiss", "postmodern", "skeuomorphic"];
      root.classList.remove(...themes.map(t => `theme-${t}`));
      root.classList.add(`theme-${theme}`);
    }
  }, [theme, mounted]);

  // Prevent hydration styling mismatch by rendering nothing until mounted,
  // or just render but wait for effect to apply theme class. Since it's a wrapper, we'll just render siblings.
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
