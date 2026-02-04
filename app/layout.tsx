import "./globals.css";
import type { ReactNode } from "react";
import BottomNav from "./components/BottomNav";
import LanguageToggle from "./components/LanguageToggle";
import LanguageText from "./components/LanguageText";

export const metadata = {
  title: "Decathlon Coach",
  description: "Ton coach sportif personnalisé Decathlon",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="fr">
      <body style={{ margin: 0 }}>
        <a className="skip-link" href="#main-content">
          <LanguageText id="skip" fallback="Aller au contenu" />
        </a>
        {/* Header */}
        <header
          style={{
            background:
              "linear-gradient(100deg, #243b8f 0%, #2f5ed1 45%, #1787d6 100%)",
            padding: "16px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 18px 30px rgba(15,23,42,0.22)",
            borderBottom: "1px solid rgba(255,255,255,0.2)",
            position: "sticky",
            top: 0,
            zIndex: 60,
            backdropFilter: "blur(8px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 12,
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <a
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.35)",
                  color: "white",
                  textDecoration: "none",
                  fontWeight: 800,
                }}
                aria-label="Menu"
                title="Menu"
              >
                ⌂
              </a>
              <img
                src="/decathlon-logo.png"
                alt="Decathlon"
                decoding="async"
                style={{
                  height: 24,
                  filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.2))",
                }}
              />
              <span
                style={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: 14,
                  letterSpacing: 0.2,
                }}
              >
                <LanguageText id="coach" fallback="Coach" />
              </span>
            </div>
            <span
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <LanguageText id="ready" fallback="Ready to play?" />
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.2)",
                borderRadius: 999,
                padding: "8px 16px",
                color: "white",
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: 0.3,
                textTransform: "uppercase",
                boxShadow: "0 10px 20px rgba(15,23,42,0.18)",
              }}
            >
              DECATHLON
            </div>
            <LanguageToggle />
            <a
              href="/auth"
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: 999,
                padding: "8px 14px",
                color: "white",
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <LanguageText id="account" fallback="Compte" />
            </a>
          </div>
        </header>

        {/* Contenu */}
        <main id="main-content" style={{ paddingBottom: 90 }}>
          {children}
        </main>

        {/* Navigation bottom */}
        <BottomNav />
      </body>
    </html>
  );
}

