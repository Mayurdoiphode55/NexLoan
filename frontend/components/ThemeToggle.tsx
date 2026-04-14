"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="fixed top-6 right-6 w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="fixed top-6 right-6 z-[60] p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="Toggle Dark Mode"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-yellow-400 group-hover:rotate-45 transition-transform" />
      ) : (
        <Moon className="w-5 h-5 text-slate-700 group-hover:-rotate-12 transition-transform" />
      )}
    </button>
  );
}
