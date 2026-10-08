import { Link } from "react-router-dom";
import { useMisReservas } from "../hooks/useMisReservas";
import { estadoReserva, reservaVigente } from "../utils/reservas";

export default function MisReservas() {
  const {
    reservas,
    cargando,
    errorCarga,
    error,
    setError,
    mensaje,
    setMensaje,
    filtro,
    setFiltro,
    busqueda,
    setBusqueda,
    pendiente,
    setPendiente,
    cancelando,
    now,
    recargar,
    confirmarCancelacion,
    visibles,
    proximas,
  } = useMisReservas();

  return <main className="workspace-page">
    <div className="page-heading">
      <div><p className="eyebrow">Tu agenda</p><h1>Mis reservas</h1>
        <p>Consulta tus horarios y gestiona tus reservas.</p></div>
      <button className="btn btn-ghost" disabled={cargando || cancelando} onClick={recargar}>Actualizar</button>
    </div>
    <p className="muted">Horarios en {Intl.DateTimeFormat().resolvedOptions().timeZone}.</p>
    <div className="filter-bar">
      <div className="filter-options" role="group" aria-label="Filtrar reservas">
        {([
          ["proximas", "Próximas y en curso", proximas],
          ["historial", "Historial", reservas.length - proximas],
          ["todas", "Todas", reservas.length],
        ] as const).map(([value, label, total]) => <button key={value}
          className="btn btn-ghost" aria-pressed={filtro === value}
          onClick={() => setFiltro(value)}>{label} ({total})</button>)}
      </div>
      <label className="search-field">Buscar por recurso
        <input type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Nombre del recurso" />
      </label>
    </div>
    {mensaje && <p className="feedback-success" role="status">{mensaje}</p>}
    {error && <p className="feedback-error" role="alert">{error}</p>}
    {pendiente && <section className="confirmation-panel" aria-labelledby="cancelar-titulo" aria-busy={cancelando}>
      <h2 id="cancelar-titulo">¿Cancelar la reserva de {pendiente.recurso_nombre}?</h2>
      <p>{new Date(pendiente.inicio).toLocaleString("es-CO")} — {new Date(pendiente.fin).toLocaleString("es-CO")}</p>
      <p>El horario quedará disponible para otras personas.</p>
      <div className="action-row">
        <button className="btn btn-danger" disabled={cancelando} onClick={confirmarCancelacion}>
          {cancelando ? "Cancelando..." : "Sí, cancelar reserva"}
        </button>
        <button className="btn btn-ghost" disabled={cancelando} onClick={() => { setPendiente(null); setError(""); }}>Conservar reserva</button>
      </div>
    </section>}
    {cargando && <p role="status">Cargando tus reservas...</p>}
    {errorCarga && <div className="empty-state"><p className="feedback-error" role="alert">{errorCarga}</p>
      <button className="btn btn-ghost" onClick={recargar}>Reintentar</button></div>}
    {!cargando && !errorCarga && visibles.length === 0 && <div className="empty-state">
      <h2>{busqueda ? "Sin coincidencias" : "No hay reservas en esta sección"}</h2>
      <p>{busqueda ? "Prueba con otro nombre." : "Tus reservas aparecerán aquí cuando elijas un horario."}</p>
      <Link className="btn btn-primary" to="/recursos">Explorar recursos</Link>
    </div>}
    {!cargando && !errorCarga && <div className="reservation-grid">
      {visibles.map(reserva => <article className="reservation-card" key={reserva.id}>
        <div className="card-heading"><h2>{reserva.recurso_nombre}</h2>
          <span className={reserva.estado === "cancelada" ? "status-badge cancelled" : "status-badge"}>{estadoReserva(reserva, now)}</span></div>
        <dl><dt>Inicio</dt><dd><time dateTime={reserva.inicio}>{new Date(reserva.inicio).toLocaleString("es-CO")}</time></dd>
          <dt>Fin</dt><dd><time dateTime={reserva.fin}>{new Date(reserva.fin).toLocaleString("es-CO")}</time></dd></dl>
        <p className="muted">Reserva #{reserva.id}</p>
        {reservaVigente(reserva, now) && <button className="btn btn-ghost" disabled={cancelando}
          onClick={() => { setPendiente(reserva); setError(""); setMensaje(""); }}
          aria-label={`Cancelar reserva #${reserva.id} de ${reserva.recurso_nombre}`}>Cancelar reserva</button>}
      </article>)}
    </div>}
  </main>;
}
