"use client";

import { useParams } from "next/navigation";

type Product = {
  id: string;
  name: string;
  price: string;
  image: string;
  description: string;
};

const products: Product[] = [
  {
    id: "running-shoes",
    name: "Chaussures de running",
    price: "79,99 €",
    image: "/products/running-shoes.jpg",
    description:
      "Chaussures confortables et polyvalentes, idéales pour les débutants et les entraînements réguliers.",
  },
  {
    id: "fitness-mat",
    name: "Tapis de fitness",
    price: "19,99 €",
    image: "/products/fitness-mat.jpg",
    description:
      "Tapis antidérapant et confortable pour le renforcement musculaire, le stretching et le yoga.",
  },
  {
    id: "resistance-bands",
    name: "Bandes de résistance",
    price: "14,99 €",
    image: "/products/resistance-bands.jpg",
    description:
      "Bandes élastiques idéales pour le renforcement musculaire et la mobilité.",
  },
];

export default function ProductPage() {
  const params = useParams();
  const productId = params?.id;

  const product = products.find(
    (p) => p.id === productId
  );

  if (!product) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Produit indisponible</h2>
        <p>Ce produit n’existe pas ou n’est plus disponible.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <img
        src={product.image}
        alt={product.name}
        style={{
          width: "100%",
          maxWidth: 420,
          display: "block",
          margin: "0 auto",
          borderRadius: 12,
        }}
      />

      <h1 style={{ marginTop: 20 }}>{product.name}</h1>

      <p style={{ fontSize: 18, fontWeight: "bold" }}>
        {product.price}
      </p>

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
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Acheter sur Decathlon
      </button>
    </div>
  );
}
