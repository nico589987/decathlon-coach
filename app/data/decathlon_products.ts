import catalog from "./decathlon_running_catalog.json";

type RawProduct = {
  product_id: string;
  name: string;
  price_eur: string;
  category: string;
  sport: string;
  level: string;
  terrain: string;
  weather: string;
  gender: string;
  image_url: string;
  description_short: string;
};

export type Product = {
  id: string;
  name: string;
  price: string;
  image: string | null;
  categoryKey: string;
  categoryLabel: string;
  badge: string;
  description: string;
};

const categoryLabels: Record<string, string> = {
  "running shoes": "Chaussures",
  socks: "Chaussettes",
  top: "Hauts",
  shorts: "Shorts",
  tights: "Collants",
  jacket: "Vestes",
  cap: "Casquettes",
  headband: "Bandeaux",
  gloves: "Gants",
  watch: "Montres",
  belt: "Ceintures",
  armband: "Brassards",
  hydration: "Hydratation",
  safety: "Sécurité",
  recovery: "Récupération",
  audio: "Audio",
};

const levelBadges: Record<string, string> = {
  beginner: "Débutant",
  "beginner-intermediate": "Intermédiaire",
  intermediate: "Intermédiaire",
  "intermediate-advanced": "Avancé",
  advanced: "Avancé",
  all: "Tous niveaux",
};

function normalizeId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatPrice(value: string) {
  const normalized = value.replace(".", ",");
  return `${normalized} €`;
}

function cleanText(value: string) {
  return value
    .replace(/â€“/g, "–")
    .replace(/Ã©/g, "é")
    .replace(/Ã¨/g, "è")
    .replace(/Ãª/g, "ê")
    .replace(/Ã /g, "à")
    .replace(/â€™/g, "’")
    .trim();
}

const rawProducts = (catalog as { products: RawProduct[] }).products;

export const products: Product[] = rawProducts.map((product) => {
  const categoryKey = product.category.trim().toLowerCase();
  const categoryLabel = categoryLabels[categoryKey] || "Running";
  const badge =
    levelBadges[product.level.trim().toLowerCase()] || "Sélection";
  const hasImage = Boolean(product.image_url?.trim());
  const id = normalizeId(product.product_id);
  const image = hasImage ? `/products/${id}.jpg` : null;

  return {
    id,
    name: cleanText(product.name),
    price: formatPrice(product.price_eur),
    image,
    categoryKey,
    categoryLabel,
    badge,
    description: cleanText(product.description_short || ""),
  };
});
