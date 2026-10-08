import { Link } from "react-router-dom";
import { useLogin } from "../hooks/useLogin";
import "../styles/forms.css";

export default function Login() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    cargando,
    estado,
    listo,
    reintentar,
    mostrarPassword,
    setMostrarPassword,
    handleSubmit,
  } = useLogin();

  return (
    <div className="auth-page">
      <Link to="/" className="auth-back">
        ← ReserV
      </Link>
      <div className="auth-card">
        <h2>Iniciar sesión</h2>
        <p className="auth-subtitle">Entra para ver tus reservas y horarios.</p>
        {(estado === "inicial" || estado === "conectando") && (
          <p role="status">
            Estamos conectando con el servidor.
            La primera conexión puede tardar alrededor de un minuto.
            Puedes ir escribiendo tus datos.
          </p>
        )}

        {estado === "error" && (
          <div>
            <p role="alert">
              No pudimos conectar con el servidor. Inténtalo de nuevo.
            </p>

            <button type="button" onClick={() => void reintentar()}>
              Reintentar conexión
            </button>
          </div>
        )}
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="auth-password">
            <input
              id="registro-password"
              aria-label="Contraseña"
              type={mostrarPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="auth-password-toggle"
              aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={mostrarPassword}
              aria-controls="registro-password"
              onClick={() => setMostrarPassword((visible) => !visible)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
                {mostrarPassword && <path d="m3 3 18 18" />}
              </svg>
            </button>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!listo || cargando}
          >
            {cargando
              ? "Entrando..."
              : estado === "error"
                ? "Sin conexión"
                : !listo
                  ? "Conectando..."
                  : "Entrar"}
          </button>
        </form>
        {error && <p className="auth-error">{error}</p>}
        <p className="auth-footer">
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </div>
    </div>

  );
}