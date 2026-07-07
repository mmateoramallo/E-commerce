import { Link } from "react-router-dom";
import { useCartStore } from "../store/cartStore";

export function Navbar() {
  const totalItems = useCartStore((state) => state.getTotalItems());

  return (
    <header className="navbar">
      <Link to="/" className="logo">
        Muebles Store
      </Link>

      <nav className="nav-links">
        <Link to="/">Catálogo</Link>
        <Link to="/carrito">Carrito ({totalItems})</Link>
        <Link to="/admin/login">Admin</Link>
      </nav>
    </header>
  );
}