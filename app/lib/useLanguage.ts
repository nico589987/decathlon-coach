"use client";

import { useEffect, useState } from "react";
import { getStoredLanguage, translations, type Language } from "./i18n";

export function useLanguage() {
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

  return { lang, t: translations[lang] };
}
