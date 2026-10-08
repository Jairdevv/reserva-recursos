import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { registro } from "../services";
import { errorMessage } from "../../../shared/api/http";
import { useConexion } from "../../../shared/hooks/useConexion";

export function useRegistro() {
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
        "Usa al menos 8 caracteres, una mayúscula, un número y un símbolo.",
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

  return {
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
  };
}
