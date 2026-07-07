export function AdminLogin() {
  return (
    <section>
      <h1>Login administrador</h1>
      <p>Más adelante conectaremos esto con Supabase Auth.</p>

      <form className="admin-form">
        <label>
          Email
          <input type="email" placeholder="admin@email.com" />
        </label>

        <label>
          Contraseña
          <input type="password" placeholder="********" />
        </label>

        <button type="button">Ingresar</button>
      </form>
    </section>
  );
}