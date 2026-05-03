import { useState, useEffect } from "react";

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try {
      const stored = localStorage.getItem("statnusa-dark");
      if (stored !== null) return stored === "1";
    } catch {}
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem("statnusa-dark", dark ? "1" : "0"); } catch {}
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}
