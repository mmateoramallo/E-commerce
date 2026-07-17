import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCartStore } from "../store/cartStore";

export function PaymentPending() {
  const [searchParams] = useSearchParams();
  const clearCart = useCartStore((state) => state.clearCart);

  const paymentId = searchParams.get("payment_id");
  const orderId = searchParams.get("external_reference");
  const status = searchParams.get("status");

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <section className="payment-result-page">
      <article className="payment-result-card pending">
        <div className="payment-result-icon">!</div>

        <p className="eyebrow">Pago pendiente</p>

        <h1>Tu pago está siendo procesado</h1>

        <p>
          Mercado Pago todavía no confirmó la acreditación. Cuando el estado
          cambie, el sistema actualizará la orden automáticamente.
        </p>

        <div className="payment-result-details">
          <span>
            Estado
            <strong>{status ?? "pending"}</strong>
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