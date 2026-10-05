import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategorias, getRecursos } from "../services";
import { errorMessage } from "../api";
import { useSession } from "../session";
import type { Categoria, Recurso } from "../types";
import "../styles/Recursos.css";

const fotos: Record<string, string> = {
  Todos: "photo-1497366754035-f200968a6e72",
  "Salas de reunión": "photo-1497366811353-6870744d04b2",
  "Canchas deportivas": "photo-1526232761682-d26e03ac148e",
  Laboratorios: "photo-1518770660439-4636190af475",
  Multimedia: "photo-1478737270239-2f02b77fc618",
  Otros: "photo-1497366754035-f200968a6e72",
};
export default function Recursos() {
  const session = useSession();
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoria, setCategoria] = useState<number | "todos" | "sin-categoria">("todos");
  useEffect(() => {
    let vigente = true;
    const controller = new AbortController();
    Promise.all([getRecursos(controller.signal), getCategorias(controller.signal)])
      .then(([datos, disponibles]) => { if (vigente) { setRecursos(datos.filter(recurso => recurso.activo)); setCategorias(disponibles); } })
      .catch(error => { if (vigente) setError(errorMessage(error, "No se pudieron cargar los recursos")); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; controller.abort(); };
  }, [recarga]);
  const filtro = busqueda.trim().toLocaleLowerCase("es");
  const visibles = recursos.filter(recurso => (categoria === "todos" || (categoria === "sin-categoria" ? recurso.categoria_id === null : recurso.categoria_id === categoria)) &&
    `${recurso.nombre} ${recurso.descripcion ?? ""} ${recurso.capacidad ?? ""}`.toLocaleLowerCase("es").includes(filtro));
  const totalCategorias = categorias.length;
  const filtros: { id: number | "todos" | "sin-categoria"; nombre: string; total: number }[] = [
    { id: "todos", nombre: "Todos", total: recursos.length },
    ...categorias.map(item => ({ ...item, total: recursos.filter(recurso => recurso.categoria_id === item.id).length })),
    { id: "sin-categoria", nombre: "Sin categoría", total: recursos.filter(recurso => recurso.categoria_id === null).length },
  ];
  const fecha = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Bogota" }).format(new Date());
  return <main className="workspace-page resource-catalog">
    <div className="catalog-heading">
      <div><p className="catalog-eyebrow">● Encuentra tu espacio <span>/ Catálogo de recursos</span></p>
        <h1>Recursos disponibles</h1><p className="catalog-intro">Elige un recurso para consultar sus horarios, disponibilidad y reservar sin complicaciones.</p></div>
      <dl className="catalog-summary">
        <div><dt>Recursos activos</dt><dd>{cargando || error ? "—" : recursos.length}<small> espacios</small></dd></div>
        <div><dt>Categorías</dt><dd>{cargando || error ? "—" : totalCategorias}<small> tipos</small></dd></div>
        <div><dt>Tu próxima reserva</dt><dd className="summary-label">Empieza aquí ↗</dd></div>
      </dl>
    </div>
    <section className="catalog-toolbar" aria-label="Buscar y filtrar recursos">
      <div className="catalog-toolbar-top">
        <label className="catalog-search"><span aria-hidden="true">⌕</span><span className="catalog-sr-only">Buscar por nombre, capacidad o descripción</span><input type="search" placeholder="Buscar por nombre, capacidad o descripción…" value={busqueda} onChange={e => setBusqueda(e.target.value)} /></label>
        <div className="catalog-toolbar-meta"><span>{fecha}</span>{session?.usuario.rol === "admin" && <Link to="/admin/recursos">Administrar ↗</Link>}</div>
      </div>
      <div className="catalog-tabs" aria-label="Categorías">{filtros.map(item => <button key={item.id} type="button" aria-pressed={categoria === item.id} onClick={() => setCategoria(item.id)}>{item.nombre} <span>({cargando || error ? "—" : item.total})</span></button>)}</div>
    </section>
    {cargando && <p className="catalog-loading" role="status">Cargando el catálogo de recursos…</p>}
    {error && <div className="empty-state"><p className="feedback-error" role="alert">{error}</p><button className="btn btn-ghost" disabled={cargando} onClick={() => { setError(""); setCargando(true); setRecarga(value => value + 1); }}>Reintentar</button></div>}
    {!cargando && !error && visibles.length === 0 && <div className="empty-state"><h2>{recursos.length ? "Sin coincidencias" : "Todavía no hay recursos disponibles"}</h2><p>{recursos.length ? "Prueba con otra búsqueda o categoría." : "Los recursos activos aparecerán aquí."}</p>{recursos.length > 0 && <button className="btn btn-ghost" onClick={() => { setBusqueda(""); setCategoria("todos"); }}>Limpiar filtros</button>}{!recursos.length && session?.usuario.rol === "admin" && <Link className="btn btn-primary" to="/admin/recursos">Crear un recurso</Link>}</div>}
    {!cargando && !error && visibles.length > 0 && <>
      <div className="catalog-results" role="status">{visibles.length} {visibles.length === 1 ? "espacio para descubrir" : "espacios para descubrir"}<span>Encuentra el lugar para tu próxima idea</span></div>
      <div className="catalog-grid">{visibles.map(recurso => {
        const tipo = recurso.categoria_nombre ?? "Sin categoría";
        return <article className="catalog-card" key={recurso.id}>
          <div className="catalog-card-photo"><img src={`https://images.unsplash.com/${fotos[tipo] ?? fotos.Otros}?auto=format&fit=crop&w=800&q=80`} alt="" loading="lazy" onError={e => { e.currentTarget.style.visibility = "hidden"; }} />
            <div className="catalog-card-badges"><span className="catalog-active">● Recurso activo</span><span>{recurso.capacidad !== null ? `${recurso.capacidad} personas` : "Capacidad sin indicar"}</span></div>
            <span className="catalog-photo-label">{tipo}</span><span className="catalog-image-note">Imagen ilustrativa</span></div>
          <div className="catalog-card-body"><h2>{recurso.nombre}</h2><p className="catalog-card-description">{recurso.descripcion || "Un espacio para tus actividades. Consulta el calendario y encuentra el horario ideal."}</p>
            <div className="catalog-card-details"><span>{tipo}</span><span>Reserva por horario</span></div>
            <div className="catalog-schedule"><span>Planifica tu visita</span><span>Consultar calendario ↗</span></div>
            <Link className="catalog-reserve" to={`/recursos/${recurso.id}/reservar`}>Ver horarios y reservar <span aria-hidden="true">→</span><span className="catalog-sr-only">: {recurso.nombre}</span></Link></div>
        </article>;
      })}</div>
      <p className="catalog-footer">Consulta la disponibilidad de cada espacio en su calendario.</p>
    </>}
  </main>;
}
