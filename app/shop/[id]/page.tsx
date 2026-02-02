"use client";

import { useParams } from "next/navigation";

type Product = {
  id: string;
  name: string;
  price: string;
  image: string;
  description: string;
  category: string;
};

const products: Product[] = [
  {
    id: "running-shoes",
    name: "Chaussures de running",
    price: "79,99 €",
    image: "/products/running-shoes.jpg",
    category: "Running",
    description:
      "Chaussures polyvalentes et stables pour tes sorties régulières.",
  },
  {
    id: "fitness-mat",
    name: "Tapis de fitness",
    price: "19,99 €",
    image: "/products/fitness-mat.jpg",
    category: "Fitness",
    description:
      "Tapis confortable et antidérapant pour renfo et stretching.",
  },
  {
    id: "resistance-bands",
    name: "Bandes de résistance",
    price: "14,99 €",
    image: "/products/resistance-bands.jpg",
    category: "Renfo",
    description:
      "Bandes élastiques idéales pour le renforcement et la mobilité.",
  },
  {
    id: "jump-rope",
    name: "Corde à sauter",
    price: "9,99 €",
    image: "/products/fitness-mat.jpg",
    category: "Cardio",
    description:
      "Cardio simple et efficace pour échauffements dynamiques.",
  },
  {
    id: "dumbbells",
    name: "Haltères réglables",
    price: "49,99 €",
    image: "/products/resistance-bands.jpg",
    category: "Renfo",
    description:
      "Charge progressive pour un entraînement complet à la maison.",
  },
  {
    id: "yoga-blocks",
    name: "Briques de yoga",
    price: "12,99 €",
    image: "/products/fitness-mat.jpg",
    category: "Mobility",
    description:
      "Aident à améliorer l’alignement et la souplesse.",
  },
  {
    id: "running-socks",
    name: "Chaussettes running",
    price: "7,99 €",
    image: "/products/running-shoes.jpg",
    category: "Running",
    description:
      "Respirantes et confortables pour des sorties sans frottements.",
  },
  {
    id: "foam-roller",
    name: "Rouleau de massage",
    price: "24,99 €",
    image: "/products/fitness-mat.jpg",
    category: "Récup",
    description:
      "Favorise la récupération et relâche les tensions musculaires.",
  },
];

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
        <img
          src={product.image}
          alt={product.name}
          style={{
            width: "100%",
            maxWidth: 520,
            display: "block",
            margin: "0 auto",
            borderRadius: 12,
          }}
        />

        <div style={{ marginTop: 16, color: "#64748b", fontSize: 13 }}>
          {product.category}
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
