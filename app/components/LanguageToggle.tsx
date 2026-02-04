"use client";

import { useEffect, useState } from "react";
import { getStoredLanguage, setStoredLanguage, type Language } from "../lib/i18n";

export default function LanguageToggle() {
  const [lang, setLang] = useState<Language>("fr");

  useEffect(() => {
    const apply = () => setLang(getStoredLanguage());
    apply();
    window.addEventListener("storage", apply);
    window.addEventListener("languagechange", apply);
    return () => {
      window.removeEventListener("storage", apply);
      window.removeEventListener("languagechange", apply);
    };
  }, []);

  return (
    <button
      onClick={() => {
        const next = lang === "fr" ? "en" : "fr";
        setStoredLanguage(next);
        setLang(next);
      }}
      style={{
        background: "rgba(255,255,255,0.18)",
        border: "1px solid rgba(255,255,255,0.35)",
        borderRadius: 999,
        padding: "8px 12px",
        color: "white",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
      }}
      aria-label="Toggle language"
      title="Toggle language"
    >
      {lang === "fr" ? "EN - English" : "FR - Français"}
    </button>
  );
}
