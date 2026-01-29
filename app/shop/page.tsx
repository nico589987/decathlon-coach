const products = [
  {
    id: "running-shoes",
    name: "Chaussures de running",
    price: "79,99 €",
    image: "/products/running-shoes.jpg",
  },
  {
    id: "fitness-mat",
    name: "Tapis de fitness",
    price: "19,99 €",
    image: "/products/fitness-mat.jpg",
  },
  {
    id: "resistance-bands",
    name: "Bandes de résistance",
    price: "14,99 €",
    image: "/products/resistance-bands.jpg",
  },
];

export default function ShopPage() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Produits recommandés</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 16,
        }}
      >
        {products.map((product) => (
          <a
            key={product.id}
            href={`/shop/${product.id}`}
            style={{
              textDecoration: "none",
              color: "inherit",
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 12,
            }}
          >
            <img
              src={product.image}
              alt={product.name}
              style={{
                width: "100%",
                height: 140,
                objectFit: "cover",
                borderRadius: 8,
              }}
            />
            <h3 style={{ margin: "10px 0 4px" }}>{product.name}</h3>
            <p style={{ fontWeight: "bold" }}>{product.price}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
