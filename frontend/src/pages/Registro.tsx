import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registro } from "../services";
import { errorMessage } from "../api";
import { useConexion } from "../useConexion";
import "../styles/forms.css";

export default function Registro() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  const { estado, listo, reintentar } = useConexion();

  const requisitosPendientes = [
    password.length < 8 && "Al menos 8 caracteres",
    !/\p{Lu}/u.test(password) && "Una mayúscula",
    !/[0-9]/.test(password) && "Un número",
    !/[^\p{L}\p{N}\s]/u.test(password) && "Un símbolo (por ejemplo, !, @ o #)",
    new TextEncoder().encode(password).length > 72 &&
    "Máximo 72 bytes: reduce la longitud de la contraseña",
  ].filter((requisito): requisito is string => Boolean(requisito));
  const mostrarAyuda = password.length > 0 && requisitosPendientes.length > 0;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!listo || cargando) return;
    setError("");
    if (requisitosPendientes.length > 0) {
      setError(
        "Usa al menos 8 caracteres, una mayúscula, un número y un símbolo. Máximo 72 bytes.",
      );
      return;
    }
    setCargando(true);
    try {
      await registro(nombre, email, password);
      navigate("/login");
    } catch (err) {
      setError(errorMessage(err, "Error al registrar, intenta de nuevo"));
    } finally {
      setCargando(false);
    }
  };

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
