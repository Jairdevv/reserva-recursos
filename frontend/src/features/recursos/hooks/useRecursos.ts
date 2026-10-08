import { useEffect, useState } from "react";
import { getRecursos } from "../services";
import type { Recurso } from "../types";
import { getCategorias } from "../../categorias/services";
import type { Categoria } from "../../categorias/types";
import { useSession } from "../../auth/session";
import { errorMessage } from "../../../shared/api/http";

export function useRecursos() {
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
  return {
    session,
    recursos,
    cargando,
    setCargando,
    error,
    setError,
    setRecarga,
    busqueda,
    setBusqueda,
    categoria,
    setCategoria,
    visibles,
    totalCategorias,
    filtros,
    fecha,
  };
}
