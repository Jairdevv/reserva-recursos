import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";

import {
  getRecursos,
  crearRecurso,
  actualizarRecurso,
  desactivarRecurso,
} from "../services";
import { errorMessage } from "../api";
import { useSession } from "../session";
import type { NuevoRecurso, Recurso } from "../types";

import "../styles/forms.css";

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
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [capacidad, setCapacidad] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [desactivandoId, setDesactivandoId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Impide iniciar dos operaciones antes del siguiente render.
  const operacionEnCurso = useRef(false);
  const nombreInput = useRef<HTMLInputElement>(null);

  const ocupado = guardando || desactivandoId !== null;

  useEffect(() => {
    let vigente = true;
    const controller = new AbortController();

    getRecursos(controller.signal)
      .then((datos) => {
        if (!vigente) return;

        setRecursos(ordenarRecursos(datos));
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

        // Otro administrador podría haberlo desactivado.
        return ordenarRecursos(
          siguientes.filter((actual) => actual.activo),
        );
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
        anteriores.filter((actual) => actual.id !== recurso.id),
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

  const filtro = busqueda.trim().toLocaleLowerCase("es");

  const recursosFiltrados = recursos.filter((recurso) => {
    const texto =
      `${recurso.nombre} ${recurso.descripcion ?? ""}`
        .toLocaleLowerCase("es");

    return texto.includes(filtro);
  });

  return (
    <main className="workspace-page admin-page"
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: "2rem 1rem",
      }}
    >
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
            className="auth-form"
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

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
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

      <section aria-labelledby="titulo-listado" aria-busy={cargando}>
        <h2 id="titulo-listado">Recursos activos</h2>

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
          <p>No hay recursos activos. Puedes crear el primero arriba.</p>
        )}

        {!cargando &&
          !errorCarga &&
          recursos.length > 0 &&
          recursosFiltrados.length === 0 && (
            <p>No hay recursos que coincidan con la búsqueda.</p>
          )}

        {!cargando && !errorCarga && recursosFiltrados.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <caption>
                {recursosFiltrados.length} recursos encontrados
              </caption>

              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Descripción</th>
                  <th scope="col">Capacidad</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {recursosFiltrados.map((recurso) => (
                  <tr
                    key={recurso.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <th scope="row" style={{ padding: "1rem 0.5rem" }}>
                      {recurso.nombre}
                    </th>

                    <td style={{ padding: "1rem 0.5rem" }}>
                      {recurso.descripcion || "Sin descripción"}
                    </td>

                    <td style={{ padding: "1rem 0.5rem" }}>
                      {recurso.capacidad ?? "Sin especificar"}
                    </td>

                    <td style={{ padding: "1rem 0.5rem" }}>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                        }}
                      >
                        <button
                          type="button"
                          disabled={ocupado}
                          onClick={() => editar(recurso)}
                          aria-label={`Editar ${recurso.nombre}`}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          disabled={ocupado}
                          onClick={() => desactivar(recurso)}
                          aria-label={`Desactivar ${recurso.nombre}`}
                        >
                          {desactivandoId === recurso.id
                            ? "Desactivando..."
                            : "Desactivar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}