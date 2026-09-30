import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { login } from "../services";
import { iniciarSesion } from "../session";
import { errorMessage } from "../api";
import { useConexion } from "../useConexion";
import "../styles/forms.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { estado, listo, reintentar } = useConexion();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!listo || cargando) return;
    setError("");
    setCargando(true);
    try {
      const data = await login(email, password);
      iniciarSesion(data);
      const from = location.state?.from;
      navigate(typeof from === "string" && from.startsWith("/") && !from.startsWith("//") ? from : "/recursos", { replace: true });
    } catch (error) {
      setError(errorMessage(error, "No se pudo iniciar sesión"));
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
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
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