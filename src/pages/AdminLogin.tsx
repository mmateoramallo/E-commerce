import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

      navigate("/admin/productos");
    } catch (error) {
      console.error(error);
      setErrorMessage("Ocurrió un error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1>Login administrador</h1>
      <p>Ingresá con el usuario administrador creado en Supabase.</p>

      <form className="admin-form" onSubmit={handleSubmit}>
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

        {errorMessage && <p>{errorMessage}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </section>
  );
}