import { useParams } from "react-router-dom";
import { mockProducts } from "../data/mockProducts";
import { useCartStore } from "../store/cartStore";

export function ProductDetail() {
  const { id } = useParams();
  const addToCart = useCartStore((state) => state.addToCart);

  const product = mockProducts.find((item) => item.id === id);

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
          <strong>Material:</strong> {product.material}
        </p>
        <p>
          <strong>Color:</strong> {product.color}
        </p>
        <p>
          <strong>Medidas:</strong> {product.dimensions}
        </p>
        <p>
          <strong>Stock:</strong> {product.stock}
        </p>

        <button onClick={() => addToCart(product)}>
          Agregar al carrito
        </button>
      </div>
    </section>
  );
}