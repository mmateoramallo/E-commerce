import { useEffect, useState } from "react";
import { ProductCard } from "../components/ProductCard";
import { getActiveProducts } from "../services/productService";
import type { Product } from "../types/Product";

export function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        setLoading(true);

        const data = await getActiveProducts();

        if (!isMounted) return;

        setProducts(data);
        setErrorMessage("");
      } catch (error) {
        console.error(error);

        if (!isMounted) return;

        setErrorMessage("No se pudieron cargar los productos.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <p>Cargando productos...</p>;
  }

  if (errorMessage) {
    return <p>{errorMessage}</p>;
  }

  return (
    <section>
      <h1>Catálogo de muebles</h1>
      <p>Elegí los productos que querés consultar.</p>

      {products.length === 0 ? (
        <p>Todavía no hay productos cargados.</p>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}