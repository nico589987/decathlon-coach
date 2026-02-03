"use client";

import { useParams } from "next/navigation";
import { products } from "../../data/decathlon_products";

export default function ProductPage() {
  const params = useParams();
  const productId = params?.id;

  const product = products.find((p) => p.id === productId);

  if (!product) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Produit indisponible</h2>
        <p>Ce produit n’existe pas ou n’est plus disponible.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 720, margin: "auto" }}>
      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 18,
          boxShadow: "0 10px 20px rgba(15,23,42,0.08)",
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
              height: 260,
              display: "grid",
              placeItems: "center",
              color: "#94a3b8",
              fontWeight: 700,
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
                maxWidth: 520,
                display: "block",
                margin: "0 auto",
                borderRadius: 12,
                position: "absolute",
                inset: 0,
                objectFit: "cover",
              }}
            />
          )}
        </div>

        <div style={{ marginTop: 16, color: "#64748b", fontSize: 13 }}>
          {product.categoryLabel}
        </div>

        <h1 style={{ marginTop: 8 }}>{product.name}</h1>

        <p style={{ fontSize: 18, fontWeight: "bold" }}>{product.price}</p>

        <p style={{ marginTop: 10, color: "#555" }}>
          {product.description}
        </p>

        <button
          style={{
            marginTop: 20,
            width: "100%",
            padding: "14px",
            backgroundColor: "#3C46B8",
            color: "white",
            border: "none",
            borderRadius: 10,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Acheter sur Decathlon
        </button>
      </div>
    </div>
  );
}
