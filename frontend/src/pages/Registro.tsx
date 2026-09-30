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
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  const { estado, listo, reintentar } = useConexion();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!listo || cargando) return;
    setError("");
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
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
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