import { useEffect, useState } from "react";
import { getRecursos } from "../services";
import type { Recurso } from "../types";

export default function Recursos() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getRecursos()
      .then(setRecursos)
      .catch(() => setError("No se pudieron cargar los recursos"))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p>Cargando recursos...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2>Recursos disponibles</h2>
      <ul>
        {recursos.map((r) => (
          <li key={r.id}>
            <strong>{r.nombre}</strong>
            {r.descripcion && ` — ${r.descripcion}`}
            {r.capacidad && ` (capacidad: ${r.capacidad})`}
          </li>
        ))}
      </ul>
    </div>
  );
}