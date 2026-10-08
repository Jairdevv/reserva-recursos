import { Link } from "react-router-dom";
import { useRegistro } from "../hooks/useRegistro";
import "../styles/forms.css";

export default function Registro() {
  const {
    nombre,
    setNombre,
    email,
    setEmail,
    password,
    setPassword,
    mostrarPassword,
    setMostrarPassword,
    error,
    cargando,
    estado,
    listo,
    reintentar,
    requisitosPendientes,
    mostrarAyuda,
    handleSubmit,
  } = useRegistro();

  return (
    <div className="auth-page">
      <Link to="/" className="auth-back">
        ← ReserV
      </Link>
      <div className="auth-card">
        <h2>Crear cuenta</h2>
        <p className="auth-subtitle">Regístrate para empezar a reservar.</p>
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
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
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
              aria-describedby={mostrarAyuda ? "password-help" : undefined}
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
          <div className="auth-password-help" aria-live="polite" aria-atomic="true">
            {mostrarAyuda && (
              <div id="password-help">
                <p>Tu contraseña necesita:</p>
                <ul>
                  {requisitosPendientes.map((requisito) => (
                    <li key={requisito}>{requisito}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!listo || cargando}
          >
            {cargando
              ? "Registrando..."
              : estado === "error"
                ? "Sin conexión"
                : !listo
                  ? "Conectando..."
                  : "Registrarme"}
          </button>
        </form>
        {error && <p className="auth-error">{error}</p>}
        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
