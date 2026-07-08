import { Link } from "react-router-dom";
import type { Product } from "../types/Product";
import { useCartStore } from "../store/cartStore";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.addToCart);
  const hasStock = product.stock > 0;

  return (
    <article className="product-card">
      <Link to={`/producto/${product.id}`} className="product-image-link">
        <img src={product.imageUrl} alt={product.name} />
      </Link>

      <div className="product-card-content">
        <span className="product-category">{product.category}</span>

        <h2>{product.name}</h2>

        <p className="product-description">{product.description}</p>

        <p className="price">${product.price.toLocaleString("es-AR")}</p>

        <p className={hasStock ? "stock available" : "stock unavailable"}>
          {hasStock ? `Stock disponible: ${product.stock}` : "Sin stock"}
        </p>

        <div className="product-actions">
          <Link to={`/producto/${product.id}`}>Ver detalle</Link>

          <button disabled={!hasStock} onClick={() => addToCart(product)}>
            {hasStock ? "Agregar" : "Sin stock"}
          </button>
        </div>
      </div>
    </article>
  );
}