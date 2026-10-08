import { useRef, useState, type FormEvent } from "react";
import type { Categoria } from "../types";
import { crearCategoria, renombrarCategoria, eliminarCategoria } from "../services";
import { errorMessage } from "../../../shared/api/http";

export interface AdminCategoriasProps {
  categorias: Categoria[];
  disabled: boolean;
  onChange: (categorias: Categoria[]) => void;
  onBusyChange: (busy: boolean) => void;
}

export function useAdminCategorias({ categorias, disabled, onChange, onBusyChange }: AdminCategoriasProps) {
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
  function editar(categoria: Categoria) {
    setEditando(categoria.id);
    setNombre(categoria.nombre);
    setError("");
    setMensaje("");
    input.current?.focus();
  }
  return { nombre, setNombre, editando, busy, error, mensaje, input, limpiar, guardar, eliminar, editar };
}
