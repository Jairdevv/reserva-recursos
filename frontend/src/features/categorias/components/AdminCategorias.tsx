import { useAdminCategorias, type AdminCategoriasProps } from "../hooks/useAdminCategorias";

export default function AdminCategorias(props: AdminCategoriasProps) {
  const { categorias, disabled } = props;
  const {
    nombre,
    setNombre,
    editando,
    busy,
    error,
    mensaje,
    input,
    limpiar,
    guardar,
    eliminar,
    editar,
  } = useAdminCategorias(props);
  return <section className="admin-categories" aria-labelledby="admin-categories-title" aria-busy={busy}>
    <h2 id="admin-categories-title">Gestionar categorías</h2>
    <p className="muted">Crea y renombra categorías. Para eliminar una, reasigna primero todos sus recursos, incluidos los inactivos.</p>
    <form onSubmit={guardar}><fieldset disabled={disabled || busy} className="admin-category-form">
      <label htmlFor="categoria-nombre">{editando === null ? "Nueva categoría" : "Renombrar categoría"}<input ref={input} id="categoria-nombre" required maxLength={100} value={nombre} onChange={event => setNombre(event.target.value)} placeholder="Ejemplo: Aulas" /></label>
      <button type="submit" className="btn btn-primary">{busy ? "Guardando…" : editando === null ? "Crear categoría" : "Guardar nombre"}</button>
      {editando !== null && <button className="btn btn-ghost" type="button" onClick={limpiar}>Cancelar</button>}
    </fieldset></form>
    {error && <p className="feedback-error" role="alert">{error}</p>}
    {mensaje && <p className="feedback-success" role="status">{mensaje}</p>}
    <div className="admin-category-list">{categorias.map(categoria => <div className="admin-category-item" key={categoria.id}>
      <span>{categoria.nombre}</span><div className="admin-resource-actions">
        <button type="button" disabled={disabled || busy} aria-label={`Renombrar ${categoria.nombre}`} onClick={() => editar(categoria)}>Renombrar</button>
        <button type="button" disabled={disabled || busy} aria-label={`Eliminar categoría ${categoria.nombre}`} onClick={() => void eliminar(categoria)}>Eliminar</button>
      </div></div>)}</div>
  </section>;
}
