import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCartStore } from "../store/cartStore";

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const clearCart = useCartStore((state) => state.clearCart);

  const paymentId = searchParams.get("payment_id");
  const orderId = searchParams.get("external_reference");
  const status = searchParams.get("status");
  const collectionStatus = searchParams.get("collection_status");

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <section className="payment-result-page">
      <article className="payment-result-card success">
        <div className="payment-result-icon">✓</div>

        <p className="eyebrow">Pago confirmado</p>

        <h1>Tu compra fue acreditada correctamente</h1>

        <p>
          Recibimos la confirmación de Mercado Pago. La orden ya quedó
          registrada y el stock fue actualizado automáticamente.
        </p>

        <div className="payment-result-details">
          <span>
            Estado
            <strong>{status ?? collectionStatus ?? "approved"}</strong>
          </span>

          <span>
            ID de pago
            <strong>{paymentId ?? "-"}</strong>
          </span>

          <span>
            ID de orden
            <strong>{orderId ?? "-"}</strong>
          </span>
        </div>

        <div className="payment-result-actions">
          <Link to="/" className="primary-link-button">
            Volver al catálogo
          </Link>

          <Link to="/carrito" className="secondary-link-button">
            Ir al carrito
          </Link>
        </div>
      </article>
    </section>
  );
}