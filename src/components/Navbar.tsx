import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../store/cartStore";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const navigate = useNavigate();

  const totalItems = useCartStore((state) => state.getTotalItems());
  const { isAdmin, signOut } = useAuth();

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
        <Link to="/carrito">Carrito ({totalItems})</Link>

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