import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecursos } from "../services";
import { cerrarSesion } from "../session";
import type { Recurso } from "../types";
import "../styles/Recursos.css";


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


  return (
    <div className="recursos-page">
      <div className="recursos-header">
        <h2>Recursos disponibles</h2>
        <button className="recursos-logout" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </div>

      {cargando && <p className="recursos-loading">Cargando...</p>}
      {error && <p className="auth-error">{error}</p>}

      {!cargando && !error && recursos.length === 0 && (
        <p className="recursos-empty">Todavía no hay recursos registrados.</p>
      )}

      {!cargando && recursos.length > 0 && (
        <div className="recursos-board">
          {recursos.map((r) => (
            <Link to={`/recursos/${r.id}/reservar`} className="recursos-row" key={r.id}>
              <span className="recursos-row-nombre">{r.nombre}</span>
              <span className="recursos-row-desc">{r.descripcion ?? "—"}</span>
              <span className="recursos-row-capacidad">
                {r.capacidad ? `cap. ${r.capacidad}` : "—"}
              </span>
            </Link>
          ))}
        </div>
      )
      }
    </div >
  );
}