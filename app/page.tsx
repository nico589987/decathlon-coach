"use client";

import { useLanguage } from "./lib/useLanguage";

export default function Home() {
  const { t, lang } = useLanguage();
  const heroGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 24,
    alignItems: "center",
  };
  const featureGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  };
  const ctaStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 18px",
    borderRadius: 999,
    fontWeight: 700,
    textDecoration: "none",
  };
  const cardStyle: React.CSSProperties = {
    background: "white",
    borderRadius: 18,
    border: "1px solid #e2e8f0",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
  };
  const pillStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255, 255, 255, 0.4)",
    background: "rgba(255, 255, 255, 0.18)",
    fontSize: 12,
    fontWeight: 700,
    color: "white",
  };
  return (
    <div
      className="page-home"
      style={{
        padding: "28px 24px 120px",
        maxWidth: 1100,
        margin: "0 auto",
        fontFamily: '"Space Grotesk", "Sora", "Manrope", sans-serif',
        color: "#0f172a",
      }}
    >
      <div
        style={{
          borderRadius: 24,
          padding: "28px 28px 32px",
          background:
            "radial-gradient(1200px 500px at 15% -10%, rgba(60,70,184,0.22) 0%, rgba(248,250,252,0) 70%), radial-gradient(900px 420px at 90% -20%, rgba(37,99,235,0.22) 0%, rgba(248,250,252,0) 70%), linear-gradient(120deg, #0f172a 0%, #1e293b 45%, #0b4ea2 100%)",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={heroGridStyle} className="home-hero-grid">
          <div>
            <div style={pillStyle}>{t.ready}</div>
            <h1 style={{ fontSize: 44, margin: "16px 0 10px", lineHeight: 1.1 }}>
              {t.homeTitle}
            </h1>
            <p style={{ fontSize: 16, opacity: 0.85, maxWidth: 520 }}>
              {t.homeSubtitle}
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
              <a
                href="/coach"
                style={{
                  ...ctaStyle,
                  background: "linear-gradient(135deg, #3C46B8 0%, #2563eb 100%)",
                  color: "white",
                  boxShadow: "0 12px 24px rgba(37, 99, 235, 0.35)",
                }}
              >
                {t.startCoach}
              </a>
              <a
                href="/program"
                style={{
                  ...ctaStyle,
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.35)",
                  color: "white",
                }}
              >
                {t.viewProgram}
              </a>
            </div>
          </div>

          <div
            style={{
              ...cardStyle,
              padding: 18,
              background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 12, color: "#1e293b" }}>
              {t.stepsTitle}
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  padding: 12,
                  borderRadius: 14,
                  background: "#eef2ff",
                  color: "#1e3a8a",
                }}
              >
                <span style={{ fontSize: 18 }}>🧠</span>
                <div>
                  <div style={{ fontWeight: 700 }}>{t.step1Title}</div>
                  <div style={{ fontSize: 12 }}>{t.step1Desc}</div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  padding: 12,
                  borderRadius: 14,
                  background: "#ecfeff",
                  color: "#0f766e",
                }}
              >
                <span style={{ fontSize: 18 }}>📘</span>
                <div>
                  <div style={{ fontWeight: 700 }}>{t.step2Title}</div>
                  <div style={{ fontSize: 12 }}>{t.step2Desc}</div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  padding: 12,
                  borderRadius: 14,
                  background: "#fef3c7",
                  color: "#92400e",
                }}
              >
                <span style={{ fontSize: 18 }}>🛒</span>
                <div>
                  <div style={{ fontWeight: 700 }}>{t.step3Title}</div>
                  <div style={{ fontSize: 12 }}>{t.step3Desc}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 26, ...featureGridStyle }} className="home-feature-grid">
        {[
          {
            title: t.featuresPlan,
            desc: t.featuresPlanDesc,
          },
          {
            title: t.featuresFollow,
            desc: t.featuresFollowDesc,
          },
          {
            title: t.featuresDash,
            desc: t.featuresDashDesc,
          },
          {
            title: t.featuresTips,
            desc: t.featuresTipsDesc,
          },
          {
            title: t.featuresShop,
            desc: t.featuresShopDesc,
          },
        ].map((item) => (
          <div
            key={item.title}
            style={{ ...cardStyle, padding: 16, minHeight: 120 }}
          >
            <div style={{ fontWeight: 800, marginBottom: 8 }}>{item.title}</div>
            <div style={{ fontSize: 13, color: "#475569" }}>{item.desc}</div>
          </div>
        ))}
      </div>

      <div
        className="home-stats-grid"
        style={{
          ...cardStyle,
          marginTop: 26,
          padding: 18,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          background:
            "linear-gradient(120deg, rgba(59,130,246,0.08) 0%, rgba(14,165,233,0.08) 100%)",
        }}
      >
        {[
          {
            label: lang === "en" ? "Programs adjusted" : "Programmes ajustés",
            value: lang === "en" ? "AI + feedback" : "IA + ressenti",
          },
          {
            label: lang === "en" ? "Structured sessions" : "Séances structurées",
            value: "5 sections",
          },
          {
            label: lang === "en" ? "Simple tracking" : "Suivi simple",
            value: lang === "en" ? "1 tap" : "1 clic",
          },
          {
            label: lang === "en" ? "Visible progress" : "Progression visible",
            value: t.suivi,
          },
          {
            label: lang === "en" ? "Targeted products" : "Produits ciblés",
            value: "Decathlon",
          },
        ].map((stat) => (
          <div key={stat.label}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: "#475569" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div
        className="home-cta"
        style={{
          ...cardStyle,
          marginTop: 28,
          padding: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{t.ctaTitle}</div>
          <div style={{ color: "#475569", fontSize: 13 }}>{t.ctaDesc}</div>
        </div>
        <a
          href="/coach"
          style={{
            ...ctaStyle,
            background: "linear-gradient(135deg, #3C46B8 0%, #2563eb 100%)",
            color: "white",
          }}
        >
          {t.ctaButton}
        </a>
      </div>
    </div>
  );
}
