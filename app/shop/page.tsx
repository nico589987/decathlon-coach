"use client";

import { useMemo, useState } from "react";
import { products } from "../data/decathlon_products";

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState("Tous");

  const categories = useMemo(() => {
    const labels = Array.from(
      new Set(products.map((product) => product.categoryLabel))
    );
    return ["Tous", ...labels];
  }, []);

  const filtered = useMemo(() => {
    if (activeCategory === "Tous") return products;
    return products.filter(
      (product) => product.categoryLabel === activeCategory
    );
  }, [activeCategory]);

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 1100,
        margin: "auto",
        background:
          "radial-gradient(1200px 420px at 10% -10%, rgba(60,70,184,0.12) 0%, rgba(248,250,252,0) 70%), radial-gradient(900px 420px at 90% -20%, rgba(37,99,235,0.12) 0%, rgba(248,250,252,0) 70%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "linear-gradient(135deg, #3C46B8 0%, #2563eb 100%)",
            display: "grid",
            placeItems: "center",
            color: "white",
            fontSize: 18,
            fontWeight: 800,
            boxShadow: "0 10px 22px rgba(60,70,184,0.35)",
          }}
        >
          {"\uD83D\uDED2"}
        </div>
        <div>
          <h1 style={{ margin: 0 }}>
            Boutique{" "}
            <span style={{ fontSize: 14, color: "#475569", fontWeight: 600 }}>
              ({filtered.length} produits)
            </span>
          </h1>
          <div style={{ color: "#475569", fontSize: 13 }}>
            Produits Decathlon sélectionnés pour ton programme
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        {categories.map((chip) => {
          const active = chip === activeCategory;
          return (
            <button
              key={chip}
              onClick={() => setActiveCategory(chip)}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid #c7d2fe",
                background: active
                  ? "linear-gradient(135deg, #3C46B8 0%, #2563eb 100%)"
                  : "#eef2ff",
                color: active ? "white" : "#3730a3",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {chip}
            </button>
          );
        })}
        {activeCategory !== "Tous" && (
          <button
            onClick={() => setActiveCategory("Tous")}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid #e2e8f0",
              background: "white",
              color: "#0f172a",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Réinitialiser
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            marginTop: 24,
            padding: 24,
            background: "white",
            border: "1px dashed #cbd5f5",
            borderRadius: 16,
            textAlign: "center",
            color: "#475569",
          }}
        >
          Aucun produit dans cette catégorie pour l’instant.
          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => setActiveCategory("Tous")}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid #c7d2fe",
                background:
                  "linear-gradient(135deg, #3C46B8 0%, #2563eb 100%)",
                color: "white",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Voir tout
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 18,
          }}
        >
          {filtered.map((product) => (
            <a
              key={product.id}
              href={`/shop/${product.id}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 14,
                background: "white",
                boxShadow: "0 10px 20px rgba(15,23,42,0.08)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  position: "relative",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#f1f5f9",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    color: "#94a3b8",
                    fontWeight: 700,
                    zIndex: 0,
                  }}
                >
                  Image indisponible
                </div>
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    style={{
                      width: "100%",
                      height: 150,
                      objectFit: "cover",
                      position: "relative",
                      zIndex: 1,
                    }}
                  />
                )}
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    background: "rgba(255,255,255,0.9)",
                    borderRadius: 999,
                    padding: "4px 8px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#1e40af",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  {product.badge}
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                {product.categoryLabel}
              </div>
              <h3 style={{ margin: 0, fontSize: 16 }}>{product.name}</h3>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 2,
                }}
              >
                <span style={{ fontWeight: 800, color: "#0f172a" }}>
                  {product.price}
                </span>
              </div>
              <div
                style={{
                  marginTop: 6,
                  background:
                    "linear-gradient(135deg, #3C46B8 0%, #2563eb 100%)",
                  color: "white",
                  textAlign: "center",
                  padding: "8px 10px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Voir le produit
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}



