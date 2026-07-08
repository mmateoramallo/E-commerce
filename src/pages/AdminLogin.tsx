import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function AdminLogin() {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading, refreshAuth, signOut } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!authLoading && isAdmin) {
      navigate("/admin/productos");
    }
  }, [authLoading, isAdmin, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setErrorMessage("");

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage("Email o contraseña incorrectos.");
        return;
      }

      const { data: isAdminData, error: roleError } = await supabase.rpc(
        "is_admin"
      );

      if (roleError || !isAdminData) {
        await signOut();
        setErrorMessage("Este usuario no tiene permisos de administrador.");
        return;
      }

      await refreshAuth();

      navigate("/admin/productos");
    } catch (error) {
      console.error(error);
      setErrorMessage("Ocurrió un error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return <p>Verificando sesión...</p>;
  }

  return (
    <section className="login-page">
      <div className="login-card">
        <p className="eyebrow">Administrador</p>

        <h1>Ingresar al panel</h1>

        <p>
          Accedé con tu usuario administrador para gestionar el catálogo de
          productos.
        </p>

        <form className="admin-product-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              placeholder="admin@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {errorMessage && <p className="form-error">{errorMessage}</p>}

          <button className="primary-admin-button" type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </section>
  );
}