import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  getRecursosAdministracion,
  reactivarRecurso,
  crearRecurso,
  actualizarRecurso,
  desactivarRecurso,
} from "../../recursos/services";
import { getCategorias } from "../../categorias/services";
import type { Categoria } from "../../categorias/types";
import type {
  NuevoRecurso,
  Recurso,
  ReglasReserva,
} from "../../recursos/types";
import { errorMessage } from "../../../shared/api/http";
function ordenarRecursos(recursos: Recurso[]): Recurso[] {
  return [...recursos].sort(
    (a, b) => a.nombre.localeCompare(b.nombre, "es") || a.id - b.id,
  );
}

export function useAdminRecursos() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [recarga, setRecarga] = useState(0);

  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<
    "activos" | "inactivos" | "todos"
  >("activos");
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [usarReglas, setUsarReglas] = useState(false);
  const [reglas, setReglas] = useState<ReglasReserva>({
    apertura: "08:00",
    cierre: "20:00",
    minutos_minimos: 30,
    minutos_maximos: 240,
    dias: [1, 2, 3, 4, 5],
  });

  const [guardando, setGuardando] = useState(false);
  const [gestionandoCategorias, setGestionandoCategorias] = useState(false);
  const [desactivandoId, setDesactivandoId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Impide iniciar dos operaciones antes del siguiente render.
  const operacionEnCurso = useRef(false);
  const nombreInput = useRef<HTMLInputElement>(null);

  const ocupado = guardando || desactivandoId !== null || gestionandoCategorias;

  useEffect(() => {
    let vigente = true;
    const controller = new AbortController();

    Promise.all([
      getRecursosAdministracion(controller.signal),
      getCategorias(controller.signal),
    ])
      .then(([datos, categoriasDisponibles]) => {
        if (!vigente) return;

        setRecursos(ordenarRecursos(datos));
        setCategorias(categoriasDisponibles);
        setErrorCarga("");
      })
      .catch((error) => {
        if (!vigente) return;

        setErrorCarga(
          errorMessage(error, "No se pudieron cargar los recursos"),
        );
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
      controller.abort();
    };
  }, [recarga]);

  function limpiarFormulario() {
    setEditandoId(null);
    setNombre("");
    setDescripcion("");
    setCapacidad("");
    setCategoriaId("");
    setUsarReglas(false);
    setReglas({
      apertura: "08:00",
      cierre: "20:00",
      minutos_minimos: 30,
      minutos_maximos: 240,
      dias: [1, 2, 3, 4, 5],
    });
  }

  function cancelarEdicion() {
    if (operacionEnCurso.current) return;

    limpiarFormulario();
    setError("");
    setMensaje("");
  }

  function editar(recurso: Recurso) {
    if (operacionEnCurso.current || cargando) return;

    setEditandoId(recurso.id);
    setNombre(recurso.nombre);
    setDescripcion(recurso.descripcion ?? "");
    setCategoriaId(
      recurso.categoria_id === null ? "" : String(recurso.categoria_id),
    );
    setUsarReglas(Boolean(recurso.reglas_reserva));
    setReglas(
      recurso.reglas_reserva ?? {
        apertura: "08:00",
        cierre: "20:00",
        minutos_minimos: 30,
        minutos_maximos: 240,
        dias: [1, 2, 3, 4, 5],
      },
    );
    setCapacidad(recurso.capacidad === null ? "" : String(recurso.capacidad));

    setError("");
    setMensaje("");

    nombreInput.current?.focus();
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (operacionEnCurso.current || cargando || errorCarga) return;

    setError("");
    setMensaje("");

    const nombreLimpio = nombre.trim();
    const capacidadNumero = capacidad.trim() === "" ? null : Number(capacidad);

    if (!nombreLimpio || nombreLimpio.length > 100) {
      setError("El nombre es obligatorio y admite hasta 100 caracteres.");
      nombreInput.current?.focus();
      return;
    }

    if (
      capacidadNumero !== null &&
      (!Number.isInteger(capacidadNumero) ||
        capacidadNumero <= 0 ||
        capacidadNumero > 2147483647)
    ) {
      setError("La capacidad debe ser un número entero positivo.");
      return;
    }

    const datos: NuevoRecurso = {
      nombre: nombreLimpio,
      descripcion: descripcion.trim() || null,
      capacidad: capacidadNumero,
      categoria_id: categoriaId === "" ? null : Number(categoriaId),
      reglas_reserva: usarReglas ? reglas : null,
    };

    const id = editandoId;

    operacionEnCurso.current = true;
    setGuardando(true);

    try {
      const recurso =
        id === null
          ? await crearRecurso(datos)
          : await actualizarRecurso(id, datos);

      setRecursos((anteriores) => {
        const siguientes =
          id === null
            ? [...anteriores, recurso]
            : anteriores.map((actual) => (actual.id === id ? recurso : actual));

        return ordenarRecursos(siguientes);
      });

      limpiarFormulario();

      setMensaje(
        id === null
          ? "Recurso creado correctamente."
          : "Recurso actualizado correctamente.",
      );
    } catch (error) {
      setError(errorMessage(error, "No se pudo guardar el recurso"));
    } finally {
      operacionEnCurso.current = false;
      setGuardando(false);
    }
  }

  async function desactivar(recurso: Recurso) {
    if (operacionEnCurso.current || cargando) return;

    const confirmado = window.confirm(
      `¿Desactivar "${recurso.nombre}"?\n\n` +
        "No aceptará nuevas reservas. Las reservas existentes " +
        "se conservarán y no se cancelarán automáticamente.",
    );

    if (!confirmado) return;

    operacionEnCurso.current = true;
    setDesactivandoId(recurso.id);
    setError("");
    setMensaje("");

    try {
      await desactivarRecurso(recurso.id);

      setRecursos((anteriores) =>
        anteriores.map((actual) =>
          actual.id === recurso.id ? { ...actual, activo: false } : actual,
        ),
      );

      if (editandoId === recurso.id) {
        limpiarFormulario();
      }

      setMensaje(`El recurso "${recurso.nombre}" fue desactivado.`);
    } catch (error) {
      setError(errorMessage(error, "No se pudo desactivar el recurso"));
    } finally {
      operacionEnCurso.current = false;
      setDesactivandoId(null);
    }
  }

  function reintentarCarga() {
    if (operacionEnCurso.current || cargando) return;

    setErrorCarga("");
    setCargando(true);
    setRecarga((anterior) => anterior + 1);
  }

  async function reactivar(recurso: Recurso) {
    if (operacionEnCurso.current || cargando) return;
    operacionEnCurso.current = true;
    setDesactivandoId(recurso.id);
    setError("");
    setMensaje("");
    try {
      const actualizado = await reactivarRecurso(recurso.id);
      setRecursos((items) =>
        ordenarRecursos(
          items.map((item) =>
            item.id === actualizado.id ? actualizado : item,
          ),
        ),
      );
      setMensaje(
        `El recurso "${recurso.nombre}" fue reactivado. Ya acepta nuevas reservas.`,
      );
    } catch (error) {
      setError(errorMessage(error, "No se pudo reactivar el recurso"));
    } finally {
      operacionEnCurso.current = false;
      setDesactivandoId(null);
    }
  }

  const filtro = busqueda.trim().toLocaleLowerCase("es");

  const recursosFiltrados = recursos.filter((recurso) => {
    const texto =
      `${recurso.nombre} ${recurso.descripcion ?? ""}`.toLocaleLowerCase("es");

    return (
      texto.includes(filtro) &&
      (estadoFiltro === "todos" ||
        recurso.activo === (estadoFiltro === "activos"))
    );
  });

  function gestionarCategorias(value: boolean) {
    setGestionandoCategorias(value);
    operacionEnCurso.current = value;
  }

  function actualizarCategorias(siguientes: Categoria[]) {
    setCategorias(siguientes);
    setRecursos((items) =>
      items.map((item) => ({
        ...item,
        categoria_nombre:
          siguientes.find((categoria) => categoria.id === item.categoria_id)
            ?.nombre ?? null,
      })),
    );
    if (
      categoriaId &&
      !siguientes.some((item) => item.id === Number(categoriaId))
    )
      setCategoriaId("");
  }

  return {
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
  };
}
