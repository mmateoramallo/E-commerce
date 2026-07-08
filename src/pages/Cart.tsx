import { useState } from "react";
import { useCartStore } from "../store/cartStore";
import { createInquiryFromCart } from "../services/inquiryService";

export function Cart() {
  const items = useCartStore((state) => state.items);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalPrice = useCartStore((state) => state.getTotalPrice());

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");

  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [sending, setSending] = useState(false);

  const sellerPhone = import.meta.env.VITE_SELLER_WHATSAPP ?? "5493511234567";

  function validateForm() {
    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedFullName) {
      return "Ingresá tu nombre y apellido.";
    }

    if (trimmedFullName.length < 3) {
      return "El nombre ingresado es demasiado corto.";
    }

    if (!trimmedEmail) {
      return "Ingresá tu correo electrónico.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      return "Ingresá un correo electrónico válido.";
    }

    if (!trimmedPhone) {
      return "Ingresá tu teléfono.";
    }

    const phoneDigits = trimmedPhone.replace(/\D/g, "");

    if (phoneDigits.length < 8) {
      return "Ingresá un teléfono válido.";
    }

    if (items.length === 0) {
      return "El carrito está vacío.";
    }

    return "";
  }

  function buildWhatsAppMessage(inquiryId: string) {
    const productMessage = items
      .map(
        (item) =>
          `- ${item.name} x${item.quantity} - $${(
            item.price * item.quantity
          ).toLocaleString("es-AR")}`
      )
      .join("\n");

    return `Hola soy ${fullName.trim()}, te quería consultar por lo siguiente:

${productMessage}

Total estimado: $${totalPrice.toLocaleString("es-AR")}

Datos de contacto:
Correo: ${email.trim()}
Teléfono: ${phone.trim()}
${comment.trim() ? `Comentario: ${comment.trim()}` : ""}

Nro. de consulta: ${inquiryId}`;
  }

  async function handleWhatsAppInquiry() {
    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      setSuccessMessage("");
      return;
    }

    try {
      setSending(true);
      setFormError("");
      setSuccessMessage("");

      const inquiryId = await createInquiryFromCart({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        comment: comment.trim(),
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      });

      const finalMessage = buildWhatsAppMessage(inquiryId);
      const encodedMessage = encodeURIComponent(finalMessage);

      window.open(`https://wa.me/${sellerPhone}?text=${encodedMessage}`, "_blank");

      setSuccessMessage("Consulta registrada correctamente.");

      clearCart();
      setFullName("");
      setEmail("");
      setPhone("");
      setComment("");
    } catch (error) {
      console.error(error);
      setFormError(
        "No se pudo registrar la consulta. Revisá los datos e intentá nuevamente."
      );
    } finally {
      setSending(false);
    }
  }

  if (items.length === 0) {
    return (
      <section className="cart-page">
        <div className="empty-state">
          <h1>Carrito</h1>

          {successMessage ? (
            <p className="success-message">{successMessage}</p>
          ) : (
            <p>Tu carrito está vacío.</p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <div className="cart-header">
        <div>
          <p className="eyebrow">Consulta</p>
          <h1>Tu carrito</h1>
          <p>
            Completá tus datos para registrar la consulta y enviarla por
            WhatsApp.
          </p>
        </div>
      </div>

      <div className="cart-layout">
        <div className="cart-list">
          {items.map((item) => (
            <article key={item.id} className="cart-item">
              <img src={item.imageUrl} alt={item.name} />

              <div className="cart-item-info">
                <h2>{item.name}</h2>
                <p>Cantidad: {item.quantity}</p>
                <p>
                  Subtotal: $
                  {(item.price * item.quantity).toLocaleString("es-AR")}
                </p>

                <button onClick={() => removeFromCart(item.id)}>Quitar</button>
              </div>
            </article>
          ))}
        </div>

        <aside className="cart-summary">
          <h2>Datos de contacto</h2>

          <label>
            Nombre y apellido
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Ej: Mateo Ramallo"
            />
          </label>

          <label>
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Ej: mateo@email.com"
            />
          </label>

          <label>
            Teléfono
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Ej: 3511234567"
            />
          </label>

          <label>
            Comentario opcional
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Ej: Quisiera consultar disponibilidad o colores."
            />
          </label>

          {formError && <p className="form-error">{formError}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}

          <div className="cart-total">
            <span>Total estimado</span>
            <strong>${totalPrice.toLocaleString("es-AR")}</strong>
          </div>

          <button
            className="primary-button"
            onClick={handleWhatsAppInquiry}
            disabled={sending}
          >
            {sending ? "Registrando consulta..." : "Enviar consulta por WhatsApp"}
          </button>

          <button
            className="secondary-button"
            onClick={clearCart}
            disabled={sending}
          >
            Vaciar carrito
          </button>

          <button className="disabled-payment-button" disabled>
            Comprar con Mercado Pago próximamente
          </button>
        </aside>
      </div>
    </section>
  );
}