import { useState } from "react";
import { useCartStore } from "../store/cartStore";

export function Cart() {
  const items = useCartStore((state) => state.items);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalPrice = useCartStore((state) => state.getTotalPrice());

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");

  const sellerPhone = import.meta.env.VITE_SELLER_WHATSAPP ?? "5493511234567";

  function handleWhatsAppOrder() {
    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFullName) {
      setFormError("Ingresá tu nombre y apellido.");
      return;
    }

    if (!trimmedEmail) {
      setFormError("Ingresá tu correo electrónico.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      setFormError("Ingresá un correo electrónico válido.");
      return;
    }

    setFormError("");

    const productMessage = items
      .map(
        (item) =>
          `- ${item.name} x${item.quantity} - $${(
            item.price * item.quantity
          ).toLocaleString("es-AR")}`
      )
      .join("\n");

    const finalMessage = `Hola soy ${trimmedFullName}, te quería consultar por lo siguiente:

${productMessage}

Total estimado: $${totalPrice.toLocaleString("es-AR")}

Correo de contacto: ${trimmedEmail}`;

    const encodedMessage = encodeURIComponent(finalMessage);

    window.open(`https://wa.me/${sellerPhone}?text=${encodedMessage}`, "_blank");
  }

  if (items.length === 0) {
    return (
      <section className="cart-page">
        <div className="empty-state">
          <h1>Carrito</h1>
          <p>Tu carrito está vacío.</p>
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
          <p>Completá tus datos y enviá la consulta por WhatsApp.</p>
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

          {formError && <p className="form-error">{formError}</p>}

          <div className="cart-total">
            <span>Total estimado</span>
            <strong>${totalPrice.toLocaleString("es-AR")}</strong>
          </div>

          <button className="primary-button" onClick={handleWhatsAppOrder}>
            Enviar consulta por WhatsApp
          </button>

          <button className="secondary-button" onClick={clearCart}>
            Vaciar carrito
          </button>
        </aside>
      </div>
    </section>
  );
}