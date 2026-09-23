import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services";
import "../styles/forms.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      navigate("/recursos");
    } catch {
      setError("Email o contraseña incorrectos");
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
          <button type="submit" className="btn btn-primary" disabled={cargando}>
            {cargando ? "Entrando..." : "Entrar"}
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