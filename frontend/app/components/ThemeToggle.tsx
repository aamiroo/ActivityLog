
"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "activitylog-theme";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const isDark =
      saved === "dark" ||
      (saved === null &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
    setReady(true);
  }, []);

  function toggleTheme() {
    const next = !dark;

    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    setDark(next);
  }

  return (
    <button
      type="button"
      className="btn theme-toggle no-print"
      onClick={toggleTheme}
      aria-label={dark ? "فعال‌کردن تم روشن" : "فعال‌کردن تم تاریک"}
      title={dark ? "تم روشن" : "تم تاریک"}
      disabled={!ready}
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
      <span>{dark ? "حالت روشن" : "حالت تاریک"}</span>
    </button>
  );
}
