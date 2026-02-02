import "./globals.css";
import type { ReactNode } from "react";
import BottomNav from "./components/BottomNav";

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
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif" }}>
        {/* Header */}
        <header
          style={{
            background:
              "linear-gradient(90deg, #3C46B8 0%, #2F5ED1 55%, #1F79E5 100%)",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 10px 24px rgba(15,23,42,0.18)",
            borderBottom: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 12,
                padding: "6px 10px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <img
                src="/decathlon-logo.png"
                alt="Decathlon"
                style={{ height: 24 }}
              />
              <span
                style={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: 14,
                  letterSpacing: 0.2,
                }}
              >
                Coach
              </span>
            </div>
            <span
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Ton programme sport, clair et motivant
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.18)",
                borderRadius: 999,
                padding: "6px 12px",
                color: "white",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.3,
              }}
            >
              DECATHLON
            </div>
          </div>
        </header>

        {/* Contenu */}
        <main style={{ paddingBottom: 70 }}>{children}</main>

        {/* Navigation bottom */}
        <BottomNav />
      </body>
    </html>
  );
}




