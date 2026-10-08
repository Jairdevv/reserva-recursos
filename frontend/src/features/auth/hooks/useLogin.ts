import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "../services";
import { iniciarSesion } from "../session";
import { errorMessage } from "../../../shared/api/http";
import { useConexion } from "../../../shared/hooks/useConexion";

export function useLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { estado, listo, reintentar } = useConexion();
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!listo || cargando) return;
    setError("");
    setCargando(true);
    try {
      const data = await login(email, password);
      iniciarSesion(data);
      const from = location.state?.from;
      navigate(
        typeof from === "string" &&
          from.startsWith("/") &&
          !from.startsWith("//")
          ? from
          : "/recursos",
        { replace: true },
      );
    } catch (error) {
      setError(errorMessage(error, "No se pudo iniciar sesión"));
    } finally {
      setCargando(false);
    }
  };

  return {
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
  };
}
