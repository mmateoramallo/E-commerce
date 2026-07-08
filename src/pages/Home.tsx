import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "../components/ProductCard";
import { getActiveProducts } from "../services/productService";
import type { Product } from "../types/Product";

const ALL_CATEGORY = "Todos";

export function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);
  const [search, setSearch] = useState("");
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

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(products.map((product) => product.category))
    );

    return [ALL_CATEGORY, ...uniqueCategories];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === ALL_CATEGORY ||
        product.category === selectedCategory;

      const normalizedSearch = search.toLowerCase().trim();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.description.toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, search]);

  const productsByCategory = useMemo(() => {
    return filteredProducts.reduce<Record<string, Product[]>>((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }

      acc[product.category].push(product);
      return acc;
    }, {});
  }, [filteredProducts]);

  if (loading) {
    return <p>Cargando productos...</p>;
  }

  if (errorMessage) {
    return <p>{errorMessage}</p>;
  }

  return (
    <section className="catalog-page">
      <div className="catalog-hero">
        <p className="eyebrow">Catálogo online</p>
        <h1>Catálogo de muebles y decoración</h1>
        <p>
          Explorá los productos disponibles y armá tu consulta por WhatsApp.
        </p>
      </div>

      <div className="catalog-toolbar">
        <input
          className="catalog-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre, categoría o descripción..."
        />

        <div className="category-tabs">
          {categories.map((category) => (
            <button
              key={category}
              className={
                selectedCategory === category
                  ? "category-tab active"
                  : "category-tab"
              }
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <p>Todavía no hay productos cargados para esta búsqueda.</p>
      ) : selectedCategory === ALL_CATEGORY ? (
        <div className="category-sections">
          {Object.entries(productsByCategory).map(([category, items]) => (
            <section key={category} className="category-section">
              <div className="category-section-header">
                <h2>{category}</h2>
                <span>{items.length} productos</span>
              </div>

              <div className="product-row">
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}