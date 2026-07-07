import { useCartStore } from "../store/cartStore";

export function Cart() {
  const items = useCartStore((state) => state.items);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalPrice = useCartStore((state) => state.getTotalPrice());

  const sellerPhone = "+5493515640277";

  const handleWhatsAppOrder = () => {
    const message = items
      .map(
        (item) =>
          `- ${item.name} x${item.quantity} - $${(
            item.price * item.quantity
          ).toLocaleString("es-AR")}`
      )
      .join("\n");

    const finalMessage = `Hola, quiero consultar por estos productos:\n\n${message}\n\nTotal estimado: $${totalPrice.toLocaleString(
      "es-AR"
    )}`;

    const encodedMessage = encodeURIComponent(finalMessage);

    window.open(
      `https://wa.me/${sellerPhone}?text=${encodedMessage}`,
      "_blank"
    );
  };

  if (items.length === 0) {
    return (
      <section>
        <h1>Carrito</h1>
        <p>Tu carrito está vacío.</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Carrito</h1>

      <div className="cart-list">
        {items.map((item) => (
          <article key={item.id} className="cart-item">
            <img src={item.imageUrl} alt={item.name} />

            <div>
              <h2>{item.name}</h2>
              <p>Cantidad: {item.quantity}</p>
              <p>
                Subtotal: $
                {(item.price * item.quantity).toLocaleString("es-AR")}
              </p>

              <button onClick={() => removeFromCart(item.id)}>
                Quitar
              </button>
            </div>
          </article>
        ))}
      </div>

      <h2>Total: ${totalPrice.toLocaleString("es-AR")}</h2>

      <div className="cart-actions">
        <button onClick={handleWhatsAppOrder}>Consultar por WhatsApp</button>
        <button onClick={clearCart}>Vaciar carrito</button>
      </div>
    </section>
  );
}