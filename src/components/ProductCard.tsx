import { Link } from "react-router-dom";
import type { Product } from "../types/Product";
import { useCartStore } from "../store/cartStore";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.addToCart);

  return (
    <article className="product-card">
      <img src={product.imageUrl} alt={product.name} />

      <div className="product-card-content">
        <h2>{product.name}</h2>
        <p>{product.description}</p>
        <p className="price">${product.price.toLocaleString("es-AR")}</p>

        <div className="product-actions">
          <Link to={`/producto/${product.id}`}>Ver detalle</Link>
          <button onClick={() => addToCart(product)}>Agregar</button>
        </div>
      </div>
    </article>
  );
}