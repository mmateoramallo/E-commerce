import { NavLink } from "react-router-dom";

export function AdminNav() {
  return (
    <nav className="admin-nav">
      <NavLink
        to="/admin/productos"
        className={({ isActive }) =>
          isActive ? "admin-nav-link active" : "admin-nav-link"
        }
      >
        Productos
      </NavLink>

      <NavLink
        to="/admin/consultas"
        className={({ isActive }) =>
          isActive ? "admin-nav-link active" : "admin-nav-link"
        }
      >
        Consultas
      </NavLink>
    </nav>
  );
}