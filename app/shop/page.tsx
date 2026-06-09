"use client";

import { useEffect, useState } from "react";
import { loadProfile } from "@/lib/profile";

type Product = {
  id: string;
  name: string;
  price: string;
  category: string;
  description: string;
  tags: string[];
  badge?: string;
};

const ALL_PRODUCTS: Product[] = [
  {
    id: "fitness-mat",
    name: "Tapis de fitness 8 mm",
    price: "19,99 €",
    category: "Sol",
    description: "Confort et adhérence pour tous les exercices au sol.",
    tags: [],
    badge: "Essentiel",
  },
  {
    id: "resistance-bands",
    name: "Kit bandes de résistance",
    price: "14,99 €",
    category: "Renforcement",
    description: "5 niveaux de résistance pour varier les exercices.",
    tags: ["Bandes de résistance"],
  },
  {
    id: "dumbbells",
    name: "Haltères 2 × 5 kg",
    price: "34,99 €",
    category: "Renforcement",
    description: "Prise en main ergonomique, idéal à domicile.",
    tags: ["Haltères"],
  },
  {
    id: "kettlebell",
    name: "Kettlebell 8 kg",
    price: "29,99 €",
    category: "Renforcement",
    description: "Polyvalent pour le cardio-renforcement.",
    tags: ["Kettlebell"],
  },
  {
    id: "jump-rope",
    name: "Corde à sauter cardio",
    price: "9,99 €",
    category: "Cardio",
    description: "Légère et réglable, parfaite pour les HIIT.",
    tags: ["Corde à sauter"],
  },
  {
    id: "running-shoes",
    name: "Chaussures de running",
    price: "79,99 €",
    category: "Cardio",
    description: "Amorti progressif pour les sorties régulières.",
    tags: [],
  },
  {
    id: "pull-up-bar",
    name: "Barre de traction murale",
    price: "24,99 €",
    category: "Renforcement",
    description: "S'installe sans perçage sur encadrement de porte.",
    tags: ["Barre de traction"],
  },
  {
    id: "foam-roller",
    name: "Rouleau de massage",
    price: "12,99 €",
    category: "Récupération",
    description: "Relâche les tensions musculaires après l'effort.",
    tags: [],
    badge: "Récupération",
  },
  {
    id: "bench",
    name: "Banc de musculation pliant",
    price: "49,99 €",
    category: "Renforcement",
    description: "Compact et stable, se range facilement.",
    tags: ["Chaise / banc"],
  },
];

const CATEGORIES = ["Tous", "Cardio", "Renforcement", "Sol", "Récupération"];

export default function ShopPage() {
  const [filter, setFilter] = useState("Tous");
  const [recommended, setRecommended] = useState<Set<string>>(new Set());

  useEffect(() => {
    const profile = loadProfile();
    const equipmentOwned = new Set(profile.equipment);
    const rec = new Set<string>();
    for (const p of ALL_PRODUCTS) {
      if (p.tags.some((t) => equipmentOwned.has(t))) continue;
      if (p.badge === "Essentiel") rec.add(p.id);
      if (
        profile.goals.includes("renforcement") &&
        p.category === "Renforcement"
      )
        rec.add(p.id);
      if (
        (profile.goals.includes("endurance") ||
          profile.goals.includes("perte_poids")) &&
        p.category === "Cardio"
      )
        rec.add(p.id);
      if (
        (profile.goals.includes("souplesse") ||
          profile.goals.includes("forme_generale")) &&
        p.category === "Récupération"
      )
        rec.add(p.id);
    }
    setRecommended(rec);
  }, []);

  const visible =
    filter === "Tous"
      ? ALL_PRODUCTS
      : ALL_PRODUCTS.filter((p) => p.category === filter);

  return (
    <main className="page-shell shop-page">
      <section className="shop-hero">
        <div>
          <span className="eyebrow">Équipement</span>
          <h1>Le bon matériel,<br />au bon moment.</h1>
          <p>Sélectionné selon ton profil et tes objectifs.</p>
        </div>
      </section>

      <div className="shop-filters">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`filter-chip ${filter === cat ? "active" : ""}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="product-grid">
        {visible.map((product) => (
          <article
            key={product.id}
            className={`product-card ${recommended.has(product.id) ? "is-recommended" : ""}`}
          >
            <div className="product-visual">
              <div className="product-placeholder">
                <ProductIcon category={product.category} />
              </div>
              {recommended.has(product.id) && (
                <span className="rec-badge">Recommandé</span>
              )}
              {product.badge && !recommended.has(product.id) && (
                <span className="cat-badge">{product.badge}</span>
              )}
            </div>
            <div className="product-info">
              <span className="product-category">{product.category}</span>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <div className="product-footer">
                <strong className="product-price">{product.price}</strong>
                <a
                  href={`/shop/${product.id}`}
                  className="shop-button"
                >
                  Voir
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

function ProductIcon({ category }: { category: string }) {
  const icons: Record<string, React.ReactNode> = {
    Cardio: (
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    Renforcement: (
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12" />
      </svg>
    ),
    Sol: (
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="7" width="20" height="10" rx="3" />
      </svg>
    ),
    Récupération: (
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  };
  return (
    <>{icons[category] || icons["Renforcement"]}</>
  );
}
