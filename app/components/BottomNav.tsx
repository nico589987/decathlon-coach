"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getStoredLanguage, translations } from "../lib/i18n";

const items = [
  ["/coach", "🧠", "coach"],
  ["/program", "📘", "program"],
  ["/suivi", "📊", "suivi"],
  ["/shop", "🛒", "shop"],
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const [lang, setLang] = useState<"fr" | "en">("fr");

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

  const t = translations[lang];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        background: "rgba(255,255,255,0.85)",
        border: "1px solid rgba(148,163,184,0.35)",
        borderRadius: 20,
        display: "flex",
        justifyContent: "space-around",
        padding: "10px 10px",
        boxShadow: "0 18px 32px rgba(15,23,42,0.18)",
        backdropFilter: "blur(8px)",
        zIndex: 50,
      }}
    >
      {items.map(([href, icon, labelKey]) => {
        const active = pathname === href || pathname?.startsWith(`${href}/`);

        return (
          <a
            key={href}
            href={href}
            style={{
              textDecoration: "none",
              color: active ? "white" : "#3C46B8",
              fontWeight: 700,
              fontSize: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "6px 12px",
              borderRadius: 12,
              background: active
                ? "linear-gradient(135deg, #3C46B8 0%, #2563eb 100%)"
                : "transparent",
              boxShadow: active
                ? "0 6px 14px rgba(60,70,184,0.3)"
                : "none",
            }}
          >
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span>{t[labelKey]}</span>
          </a>
        );
      })}
    </nav>
  );
}
