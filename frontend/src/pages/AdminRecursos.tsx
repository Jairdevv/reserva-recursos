import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";

import {
  getRecursosAdministracion,
  reactivarRecurso,
  getCategorias,
  crearRecurso,
  actualizarRecurso,
  desactivarRecurso,
} from "../services";
import { errorMessage } from "../api";
import { useSession } from "../session";
import type { Categoria, NuevoRecurso, Recurso, ReglasReserva } from "../types";

import "../styles/forms.css";
import "../styles/AdminRecursos.css";
import AdminCategorias from "../components/AdminCategorias";

function ordenarRecursos(recursos: Recurso[]): Recurso[] {
  return [...recursos].sort(
    (a, b) => a.nombre.localeCompare(b.nombre, "es") || a.id - b.id,
  );
}

// La protección del backend sigue siendo obligatoria.
// Este componente controla el acceso desde la interfaz.
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
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [recarga, setRecarga] = useState(0);

  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<"activos" | "inactivos" | "todos">("activos");
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [usarReglas, setUsarReglas] = useState(false);
  const [reglas, setReglas] = useState<ReglasReserva>({ apertura: "08:00", cierre: "20:00", minutos_minimos: 30, minutos_maximos: 240, dias: [1, 2, 3, 4, 5] });

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

    Promise.all([getRecursosAdministracion(controller.signal), getCategorias(controller.signal)])
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
    setReglas({ apertura: "08:00", cierre: "20:00", minutos_minimos: 30, minutos_maximos: 240, dias: [1, 2, 3, 4, 5] });
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
    setCategoriaId(recurso.categoria_id === null ? "" : String(recurso.categoria_id));
    setUsarReglas(Boolean(recurso.reglas_reserva));
    setReglas(recurso.reglas_reserva ?? { apertura: "08:00", cierre: "20:00", minutos_minimos: 30, minutos_maximos: 240, dias: [1, 2, 3, 4, 5] });
    setCapacidad(
      recurso.capacidad === null ? "" : String(recurso.capacidad),
    );

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
    const capacidadNumero =
      capacidad.trim() === "" ? null : Number(capacidad);

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
            : anteriores.map((actual) =>
              actual.id === id ? recurso : actual,
            );

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
        anteriores.map(actual => actual.id === recurso.id ? { ...actual, activo: false } : actual),
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
    setError(""); setMensaje("");
    try {
      const actualizado = await reactivarRecurso(recurso.id);
      setRecursos(items => ordenarRecursos(items.map(item => item.id === actualizado.id ? actualizado : item)));
      setMensaje(`El recurso "${recurso.nombre}" fue reactivado. Ya acepta nuevas reservas.`);
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
      `${recurso.nombre} ${recurso.descripcion ?? ""}`
        .toLocaleLowerCase("es");

    return texto.includes(filtro) && (estadoFiltro === "todos" || recurso.activo === (estadoFiltro === "activos"));
  });

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

      <AdminCategorias categorias={categorias} disabled={ocupado || cargando || Boolean(errorCarga)} onBusyChange={value => { setGestionandoCategorias(value); operacionEnCurso.current = value; }} onChange={siguientes => {
        setCategorias(siguientes);
        setRecursos(items => items.map(item => ({ ...item, categoria_nombre: siguientes.find(categoria => categoria.id === item.categoria_id)?.nombre ?? null })));
        if (categoriaId && !siguientes.some(item => item.id === Number(categoriaId))) setCategoriaId("");
      }} />

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
