import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../store/cartStore";
import { useAuth } from "../context/AuthContext";

function CartIcon() {
  return (
    <svg
      className="cart-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M7 18.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
      <path d="M17 18.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
      <path d="M3 3h2.2l2.1 10.4A3 3 0 0 0 10.2 16H17a3 3 0 0 0 2.8-2l1.7-5.1A1.5 1.5 0 0 0 20.1 7H7.1L6.6 4.8A2.3 2.3 0 0 0 4.4 3H3Z" />
    </svg>
  );
}

export function Navbar() {
  const navigate = useNavigate();

  const totalItems = useCartStore((state) => state.getTotalItems());
  const lastAddedItem = useCartStore((state) => state.lastAddedItem);
  const cartNotificationId = useCartStore((state) => state.cartNotificationId);

  const { isAdmin, signOut } = useAuth();

  const [showCartBubble, setShowCartBubble] = useState(false);
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    if (!lastAddedItem || cartNotificationId === 0) return;

    setShowCartBubble(true);

    const timer = window.setTimeout(() => {
      setShowCartBubble(false);
    }, 2300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [cartNotificationId, lastAddedItem]);

  async function handleLogout() {
    await signOut();
    navigate("/admin/login");
  }

  return (
    <header className="navbar">
      <Link to="/" className="logo">
        Muebles Store
      </Link>

      <nav className="nav-links">
        <Link to="/">Catálogo</Link>

        <div className="cart-nav-wrapper">
          <Link to="/carrito" className="cart-nav-link" aria-label="Ver carrito">
            <CartIcon />

            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>

          {showCartBubble && lastAddedItem && (
            <div className="cart-added-bubble">
              <img src={lastAddedItem.imageUrl} alt={lastAddedItem.name} />

              <div>
                <span>Agregado al carrito</span>
                <strong>{lastAddedItem.name}</strong>
              </div>
            </div>
          )}
        </div>

        {isAdmin ? (
          <>
            <Link to="/admin/productos">Panel admin</Link>
            <button className="navbar-button" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </>
        ) : (
          <Link to="/admin/login">Admin</Link>
        )}
      </nav>
    </header>
  );
}