import { ProductCard } from "../components/ProductCard";
import { mockProducts } from "../data/mockProducts";

export function Home() {
  return (
    <section>
      <h1>Catálogo de muebles</h1>
      <p>Elegí los productos que querés consultar.</p>

      <div className="product-grid">
        {mockProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}