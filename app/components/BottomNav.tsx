"use client";

import { usePathname } from "next/navigation";

const items = [
  ["/coach", "\uD83E\uDDE0", "Coach"],
  ["/program", "\uD83D\uDCD8", "Programme"],
  ["/suivi", "\uD83D\uDCCA", "Suivi"],
  ["/shop", "\uD83D\uDED2", "Shop"],
] as const;

export default function BottomNav() {
  const pathname = usePathname();

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
      {items.map(([href, icon, label]) => {
        const active =
          pathname === href || pathname?.startsWith(`${href}/`);

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
            <span>{label}</span>
          </a>
        );
      })}
    </nav>
  );
}

