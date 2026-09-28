import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecursos } from "../services";
import { errorMessage } from "../api";
import { useSession } from "../session";
import type { Recurso } from "../types";
import "../styles/Recursos.css";

export default function Recursos() {
  const session = useSession();
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    let vigente = true;
    const controller = new AbortController();
    getRecursos(controller.signal)
      .then(datos => { if (vigente) setRecursos(datos); })
      .catch(error => { if (vigente) setError(errorMessage(error, "No se pudieron cargar los recursos")); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; controller.abort(); };
  }, [recarga]);
  const filtro = busqueda.trim().toLocaleLowerCase("es");
  const visibles = recursos.filter(recurso =>
    (recurso.nombre + " " + (recurso.descripcion ?? "")).toLocaleLowerCase("es").includes(filtro));
  return <main className="workspace-page">
    <div className="page-heading">
      <div><p className="eyebrow">Encuentra tu espacio</p><h1>Recursos disponibles</h1>
        <p>Elige un recurso para consultar sus horarios y reservar.</p></div>
      {session?.usuario.rol === "admin" && <Link className="btn btn-ghost" to="/admin/recursos">Gestionar recursos</Link>}
    </div>
    <label className="search-field">Buscar recurso
      <input type="search" placeholder="Nombre o descripción" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
    </label>
    {cargando && <p role="status">Cargando recursos...</p>}
    {error && <div className="empty-state"><p className="feedback-error" role="alert">{error}</p>
      <button className="btn btn-ghost" disabled={cargando} onClick={() => {
        setError(""); setCargando(true); setRecarga(value => value + 1);
      }}>Reintentar</button></div>}
    {!cargando && !error && visibles.length === 0 && <div className="empty-state">
      <h2>{recursos.length ? "Sin coincidencias" : "Todavía no hay recursos disponibles"}</h2>
      <p>{recursos.length ? "Prueba con otro nombre o descripción." : "Los recursos activos aparecerán aquí."}</p>
      {!recursos.length && session?.usuario.rol === "admin" && <Link className="btn btn-primary" to="/admin/recursos">Crear un recurso</Link>}
    </div>}
    {!cargando && !error && visibles.length > 0 && <div className="recursos-board">
      {visibles.map(recurso => <Link className="recursos-row" key={recurso.id} to={`/recursos/${recurso.id}/reservar`}>
        <span className="recursos-row-nombre">{recurso.nombre}</span>
        <span className="recursos-row-desc">{recurso.descripcion || "Sin descripción"}</span>
        <span className="recursos-row-capacidad">{recurso.capacidad ? `Capacidad: ${recurso.capacidad}` : "Capacidad no indicada"}</span>
        <span className="resource-action">Ver horarios →</span>
      </Link>)}
    </div>}
  </main>;
}
