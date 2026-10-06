import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Categoria } from "../types";
import { crearCategoria, renombrarCategoria, eliminarCategoria } from "../services";
import { errorMessage } from "../api";

export default function AdminCategorias({ categorias, disabled, onChange, onBusyChange }: {
  categorias: Categoria[];
  disabled: boolean;
  onChange: (categorias: Categoria[]) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [editando, setEditando] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const enCurso = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  function limpiar() { setNombre(""); setEditando(null); }
  function ocupar(value: boolean) { enCurso.current = value; setBusy(value); onBusyChange(value); }
  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enCurso.current || disabled) return;
    const value = nombre.trim();
    if (!value || value.length > 100) { setError("Escribe un nombre de hasta 100 caracteres"); return; }
    ocupar(true); setError(""); setMensaje("");
    try {
      const categoria = editando === null ? await crearCategoria(value) : await renombrarCategoria(editando, value);
      onChange(editando === null ? [...categorias, categoria] : categorias.map(item => item.id === categoria.id ? categoria : item));
      setMensaje(editando === null ? "Categoría creada." : "Categoría renombrada. Sus recursos conservan la asignación.");
      limpiar();
    } catch (error) { setError(errorMessage(error, "No se pudo guardar la categoría")); }
    finally { ocupar(false); }
  }
  async function eliminar(categoria: Categoria) {
    if (enCurso.current || disabled || !window.confirm(`¿Eliminar la categoría "${categoria.nombre}"? Solo se puede eliminar si no tiene recursos asignados.`)) return;
    ocupar(true); setError(""); setMensaje("");
    try {
      await eliminarCategoria(categoria.id);
      onChange(categorias.filter(item => item.id !== categoria.id));
      if (editando === categoria.id) limpiar();
      setMensaje("Categoría eliminada.");
    } catch (error) { setError(errorMessage(error, "No se pudo eliminar la categoría")); }
    finally { ocupar(false); }
  }
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
        <button type="button" disabled={disabled || busy} aria-label={`Renombrar ${categoria.nombre}`} onClick={() => { setEditando(categoria.id); setNombre(categoria.nombre); setError(""); setMensaje(""); input.current?.focus(); }}>Renombrar</button>
        <button type="button" disabled={disabled || busy} aria-label={`Eliminar categoría ${categoria.nombre}`} onClick={() => void eliminar(categoria)}>Eliminar</button>
      </div></div>)}</div>
  </section>;
}
