"use client";

import { useParams } from "next/navigation";
import { products } from "../../data/decathlon_products";

export default function ProductPage() {
  const params = useParams();
  const productId = params?.id;

  const product = products.find((p) => p.id === productId);
  const description = product?.description
    ?.replace(/â€“/g, "–")
    .replace(/â€™/g, "’")
    .replace(/Ã©/g, "é") ?? "";

  if (!product) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Produit indisponible</h2>
        <p>Ce produit n’existe pas ou n’est plus disponible.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 860, margin: "auto" }}>
      <style jsx global>{`
        .product-image {
          transition: transform 220ms ease;
        }
        .product-image:hover {
          transform: scale(1.03);
        }
      `}</style>
      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 10px 20px rgba(15,23,42,0.08)",
        }}
      >
        <a
          href="/shop"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#3C46B8",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          ← Retour boutique
        </a>
        <div
          style={{
            position: "relative",
            borderRadius: 12,
            overflow: "hidden",
            background: "#f1f5f9",
            height: 320,
            display: "grid",
            placeItems: "center",
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
                height: "100%",
                objectFit: "contain",
                padding: 16,
                position: "relative",
                zIndex: 1,
              }}
              className="product-image"
            />
          )}
        </div>

        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "#64748b",
              fontWeight: 600,
            }}
          >
            {product.categoryLabel}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#1e40af",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: 999,
              padding: "2px 8px",
            }}
          >
            {product.badge}
          </span>
        </div>

        <h1 style={{ marginTop: 8 }}>{product.name}</h1>

        <p style={{ fontSize: 18, fontWeight: "bold" }}>{product.price}</p>

        <p style={{ marginTop: 10, color: "#555" }}>{description}</p>

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
