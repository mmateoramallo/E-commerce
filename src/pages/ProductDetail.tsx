import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useCartStore } from "../store/cartStore";
import { getProductById } from "../services/productService";
import type{ Product } from "../types/Product";

export function ProductDetail() {
  const { id } = useParams();
  const addToCart = useCartStore((state) => state.addToCart);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    async function loadProduct() {
      try {
        setLoading(true);
        const data = await getProductById(id!);
        setProduct(data);
      } catch (error) {
        console.error(error);
        setErrorMessage("No se pudo cargar el producto.");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  if (loading) {
    return <p>Cargando producto...</p>;
  }

  if (errorMessage) {
    return <p>{errorMessage}</p>;
  }

  if (!product) {
    return <p>Producto no encontrado.</p>;
  }

  return (
    <section className="product-detail">
      <img src={product.imageUrl} alt={product.name} />

      <div>
        <h1>{product.name}</h1>
        <p>{product.description}</p>

        <p>
          <strong>Precio:</strong> ${product.price.toLocaleString("es-AR")}
        </p>
        <p>
          <strong>Categoría:</strong> {product.category}
        </p>
        <p>
          <strong>Material:</strong> {product.material || "-"}
        </p>
        <p>
          <strong>Color:</strong> {product.color || "-"}
        </p>
        <p>
          <strong>Medidas:</strong> {product.dimensions || "-"}
        </p>
        <p>
          <strong>Stock:</strong> {product.stock}
        </p>

        <button onClick={() => addToCart(product)}>Agregar al carrito</button>
      </div>
    </section>
  );
}