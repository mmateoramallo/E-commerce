import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProductById } from "../services/productService";
import { useCartStore } from "../store/cartStore";
import type { Product } from "../types/Product";

export function ProductDetail() {
  const { id } = useParams();
  const addToCart = useCartStore((state) => state.addToCart);

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (!id) {
        setErrorMessage("Producto no encontrado.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const productData = await getProductById(id);

        if (!isMounted) return;

        if (!productData) {
          setErrorMessage("Producto no encontrado.");
          setProduct(null);
          return;
        }

        setProduct(productData);
        setSelectedImage(productData.imageUrl || productData.images[0]?.imageUrl || "");
      } catch (error) {
        console.error(error);

        if (!isMounted) return;

        setErrorMessage("No se pudo cargar el producto.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <section className="empty-state">
        <p>Cargando producto...</p>
      </section>
    );
  }

  if (errorMessage || !product) {
    return (
      <section className="empty-state">
        <h1>{errorMessage || "Producto no encontrado."}</h1>
        <Link to="/">Volver al catálogo</Link>
      </section>
    );
  }

  return (
    <section className="product-detail-page">
      <article className="product-detail">
        <div className="product-gallery">
          <div className="product-main-image">
            {selectedImage ? (
              <img src={selectedImage} alt={product.name} />
            ) : (
              <div className="product-image-placeholder">Sin imagen</div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="product-thumbnails">
              {product.images.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  className={
                    selectedImage === image.imageUrl
                      ? "product-thumbnail active"
                      : "product-thumbnail"
                  }
                  onClick={() => setSelectedImage(image.imageUrl)}
                  aria-label={`Ver imagen de ${product.name}`}
                >
                  <img src={image.imageUrl} alt={product.name} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-detail-info">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>

          <p className="product-description">{product.description}</p>

          <p className="price">${product.price.toLocaleString("es-AR")}</p>

          <p
            className={
              product.stock > 0 ? "stock available" : "stock unavailable"
            }
          >
            {product.stock > 0
              ? `Stock disponible: ${product.stock}`
              : "Sin stock disponible"}
          </p>

          <div className="product-detail-specs">
            {product.material && (
              <span>
                Material
                <strong>{product.material}</strong>
              </span>
            )}

            {product.color && (
              <span>
                Color
                <strong>{product.color}</strong>
              </span>
            )}

            {product.dimensions && (
              <span>
                Medidas
                <strong>{product.dimensions}</strong>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => addToCart(product)}
            disabled={product.stock <= 0}
          >
            Agregar al carrito
          </button>
        </div>
      </article>
    </section>
  );
}