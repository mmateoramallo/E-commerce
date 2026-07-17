import { Link, useSearchParams } from "react-router-dom";

export function PaymentFailure() {
  const [searchParams] = useSearchParams();

  const paymentId = searchParams.get("payment_id");
  const orderId = searchParams.get("external_reference");
  const status = searchParams.get("status");

  return (
    <section className="payment-result-page">
      <article className="payment-result-card failure">
        <div className="payment-result-icon">×</div>

        <p className="eyebrow">Pago no completado</p>

        <h1>No pudimos confirmar el pago</h1>

        <p>
          La operación fue rechazada, cancelada o no se completó correctamente.
          Podés volver al carrito e intentar nuevamente.
        </p>

        <div className="payment-result-details">
          <span>
            Estado
            <strong>{status ?? "rejected"}</strong>
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
          <Link to="/carrito" className="primary-link-button">
            Volver al carrito
          </Link>

          <Link to="/" className="secondary-link-button">
            Ver catálogo
          </Link>
        </div>
      </article>
    </section>
  );
}