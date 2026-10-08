import { Link, Navigate } from "react-router-dom";
import { useSession } from "../../auth/session";
import { useAdminRecursos } from "../hooks/useAdminRecursos";
import AdminCategorias from "../../categorias/components/AdminCategorias";
import "../../auth/styles/forms.css";
import "../styles/AdminRecursos.css";

export default function AdminRecursos() {
  const session = useSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.usuario.rol !== "admin") {
    return <Navigate to="/recursos" replace />;
  }

  return <PanelRecursos key={session.usuario.id} />;
}

function PanelRecursos() {
  const {
    recursos,
    cargando,
    errorCarga,
    busqueda,
    setBusqueda,
    estadoFiltro,
    setEstadoFiltro,
    editandoId,
    nombre,
    setNombre,
    descripcion,
    setDescripcion,
    capacidad,
    setCapacidad,
    categorias,
    categoriaId,
    setCategoriaId,
    usarReglas,
    setUsarReglas,
    reglas,
    setReglas,
    guardando,
    gestionarCategorias,
    actualizarCategorias,
    desactivandoId,
    error,
    mensaje,
    nombreInput,
    ocupado,
    cancelarEdicion,
    editar,
    guardar,
    desactivar,
    reactivar,
    reintentarCarga,
    recursosFiltrados,
  } = useAdminRecursos();

  return (
    <main className="workspace-page admin-page">
      <header>
        <Link to="/recursos">← Volver a recursos</Link>
        <h1>Administración de recursos</h1>
        <p>Crea, edita y desactiva los recursos disponibles.</p>
      </header>

      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}

      {mensaje && <p role="status">{mensaje}</p>}

      <section
        aria-labelledby="titulo-formulario"
        style={{ marginBlock: "2rem" }}
      >
        <h2 id="titulo-formulario">
          {editandoId === null ? "Crear recurso" : "Editar recurso"}
        </h2>

        <form onSubmit={guardar} aria-busy={guardando}>
          <fieldset
            disabled={ocupado || cargando || Boolean(errorCarga)}
            className="auth-form admin-resource-form"
            style={{
              border: 0,
              margin: 0,
              padding: 0,
              maxWidth: 600,
            }}
          >
            <label htmlFor="recurso-nombre">Nombre</label>
            <input
              ref={nombreInput}
              id="recurso-nombre"
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              maxLength={100}
              placeholder="Ejemplo: Sala de reuniones A"
              required
            />

            <label htmlFor="recurso-categoria">Categoría</label>
            <select id="recurso-categoria" value={categoriaId} onChange={event => setCategoriaId(event.target.value)}>
              <option value="">Sin categoría</option>
              {categorias.map(categoria => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}
            </select>

            <label htmlFor="recurso-descripcion">
              Descripción — opcional
            </label>
            <textarea
              id="recurso-descripcion"
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              rows={4}
              placeholder="Ubicación, equipamiento y características"
              style={{
                padding: "0.85rem",
                font: "inherit",
                color: "inherit",
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                resize: "vertical",
              }}
            />

            <label htmlFor="recurso-capacidad">
              Capacidad — opcional
            </label>
            <input
              id="recurso-capacidad"
              type="number"
              value={capacidad}
              onChange={(event) => setCapacidad(event.target.value)}
              min={1}
              max={2147483647}
              step={1}
              placeholder="Ejemplo: 12"
            />

            <div className="admin-booking-rules">
              <label className="admin-rule-toggle"><input type="checkbox" checked={usarReglas} onChange={event => setUsarReglas(event.target.checked)} /> Limitar horarios y duración de reservas</label>
              <p className="muted">Reglas en America/Bogota. Desactivadas: cualquier horario y duración. No se modifican reservas existentes.</p>
              {usarReglas && <>
                <div className="admin-rule-fields">
                  <label>Apertura<input type="time" required value={reglas.apertura} onChange={event => setReglas({ ...reglas, apertura: event.target.value })} /></label>
                  <label>Cierre<input type="time" required value={reglas.cierre} onChange={event => setReglas({ ...reglas, cierre: event.target.value })} /></label>
                  <label>Mínimo (minutos)<input type="number" min={1} max={1440} required value={reglas.minutos_minimos} onChange={event => setReglas({ ...reglas, minutos_minimos: Number(event.target.value) })} /></label>
                  <label>Máximo (minutos)<input type="number" min={reglas.minutos_minimos} max={1440} required value={reglas.minutos_maximos} onChange={event => setReglas({ ...reglas, minutos_maximos: Number(event.target.value) })} /></label>
                </div>
                <div className="admin-rule-days" role="group" aria-label="Días habilitados">{["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((nombreDia, dia) => <label key={dia}><input type="checkbox" checked={reglas.dias.includes(dia)} onChange={event => setReglas({ ...reglas, dias: event.target.checked ? [...reglas.dias, dia] : reglas.dias.filter(value => value !== dia) })} />{nombreDia}</label>)}</div>
              </>}
            </div>
            <div className="admin-form-actions">
              <button type="submit" className="btn btn-primary">
                {guardando
                  ? "Guardando..."
                  : editandoId === null
                    ? "Crear recurso"
                    : "Guardar cambios"}
              </button>

              {editandoId !== null && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={cancelarEdicion}
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </fieldset>
        </form>
      </section>

      <AdminCategorias categorias={categorias} disabled={ocupado || cargando || Boolean(errorCarga)} onBusyChange={gestionarCategorias} onChange={actualizarCategorias} />

      <section aria-labelledby="titulo-listado" aria-busy={cargando}>
        <h2 id="titulo-listado">Listado de recursos</h2>
        <div className="filter-options admin-status-filters" role="group" aria-label="Estado de recursos">
          {(["activos", "inactivos", "todos"] as const).map(estado => <button key={estado} type="button" className="btn btn-ghost" aria-pressed={estadoFiltro === estado} onClick={() => setEstadoFiltro(estado)}>
            {estado === "activos" ? "Activos" : estado === "inactivos" ? "Inactivos" : "Todos"} ({recursos.filter(item => estado === "todos" || item.activo === (estado === "activos")).length})
          </button>)}
        </div>

        <label htmlFor="buscar-recurso">Buscar recurso</label>
        <input
          id="buscar-recurso"
          type="search"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Nombre o descripción"
          style={{
            display: "block",
            width: "100%",
            maxWidth: 400,
            padding: "0.75rem",
            marginBlock: "0.5rem 1rem",
          }}
        />

        {cargando && <p role="status">Cargando recursos...</p>}

        {errorCarga && (
          <div>
            <p className="auth-error" role="alert">
              {errorCarga}
            </p>
            <button
              type="button"
              onClick={reintentarCarga}
              disabled={ocupado || cargando}
            >
              Reintentar
            </button>
          </div>
        )}

        {!cargando && !errorCarga && recursos.length === 0 && (
          <p>No hay recursos registrados. Puedes crear el primero arriba.</p>
        )}

        {!cargando &&
          !errorCarga &&
          recursos.length > 0 &&
          recursosFiltrados.length === 0 && (
            <p>No hay recursos que coincidan con la búsqueda y el estado seleccionado.</p>
          )}

        {!cargando && !errorCarga && recursosFiltrados.length > 0 && (
          <>
            <p className="admin-resource-count" role="status">{recursosFiltrados.length} recursos encontrados</p>
            <div className="admin-resource-list">
              {recursosFiltrados.map(recurso => (
                <article className="admin-resource-card" key={recurso.id} aria-labelledby={`admin-recurso-${recurso.id}`}>
                  <div className="admin-resource-card-heading">
                    <span className="admin-resource-category">{recurso.categoria_nombre ?? "Sin categoría"}</span>
                    <span className={recurso.activo ? "admin-resource-active" : "admin-resource-inactive"}>● {recurso.activo ? "Activo" : "Inactivo"}</span>
                  </div>
                  <h3 id={`admin-recurso-${recurso.id}`}>{recurso.nombre}</h3>
                  <p className="admin-resource-description">{recurso.descripcion || "Sin descripción"}</p>
                  <dl className="admin-resource-details">
                    <div><dt>Capacidad</dt><dd>{recurso.capacidad !== null ? `${recurso.capacidad} personas` : "Sin especificar"}</dd></div>
                    <div><dt>Recurso</dt><dd>#{recurso.id}</dd></div>
                  </dl>
                  <div className="admin-resource-actions">
                    <button type="button" disabled={ocupado} onClick={() => editar(recurso)} aria-label={`Editar ${recurso.nombre}`}>Editar</button>
                    <button type="button" disabled={ocupado} onClick={() => recurso.activo ? desactivar(recurso) : reactivar(recurso)} aria-label={`${recurso.activo ? "Desactivar" : "Reactivar"} ${recurso.nombre}`}>
                      {desactivandoId === recurso.id ? (recurso.activo ? "Desactivando..." : "Reactivando...") : (recurso.activo ? "Desactivar" : "Reactivar")}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
