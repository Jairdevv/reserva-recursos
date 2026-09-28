import type { FormEvent } from "react";
import type { Recurso } from "../types";
import { rangoLocal } from "../utils/reservas";
import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import type { DateSelectArg, EventInput, DatesSetArg } from "@fullcalendar/core";
import { getReservasEnRango, crearReserva, getRecurso } from "../services";
import { errorMessage } from "../api";
import "../styles/ReservarRecursos.css";

type Range = { inicio: string; fin: string };

export default function ReservarRecurso() {
  const { id } = useParams<{ id: string }>();
  const recursoId = Number(id);
  if (!id || !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(recursoId) || recursoId > 2147483647) {
    return <div className="workspace-page reservar-page">
      <p role="alert">El recurso seleccionado no es válido.</p>
      <Link to="/recursos">← Volver a recursos</Link>
    </div>;
  }
  return <CalendarioRecurso key={recursoId} recursoId={recursoId} />;
}

function CalendarioRecurso({ recursoId }: { recursoId: number }) {
  const [recurso, setRecurso] = useState<Recurso | null>(null);
  const [errorRecurso, setErrorRecurso] = useState("");
  const [inicioManual, setInicioManual] = useState("");
  const [finManual, setFinManual] = useState("");
  const [recargaRecurso, setRecargaRecurso] = useState(0);
  const [eventos, setEventos] = useState<EventInput[]>([]);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [disponible, setDisponible] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [seleccion, setSeleccion] = useState<Range | null>(null);
  const calendar = useRef<FullCalendar>(null);
  const mounted = useRef(true);
  const request = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const visibleRange = useRef<Range | null>(null);
  const sending = useRef(false);
  const ready = useRef(false);
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);

  useEffect(() => {
    let vigente = true;
    const controller = new AbortController();
    getRecurso(recursoId, controller.signal)
      .then(datos => { if (vigente) setRecurso(datos); })
      .catch(error => { if (vigente) setErrorRecurso(errorMessage(error, "No se pudo cargar el recurso")); });
    return () => { vigente = false; controller.abort(); };
  }, [recursoId, recargaRecurso]);

  function prepararHorario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || !recurso?.activo) return;
    setError("");
    setMensaje("");
    try {
      const range = rangoLocal(inicioManual, finManual);
      setSeleccion(range);
      calendar.current?.getApi().unselect();
    } catch (error) {
      setSeleccion(null);
      setError(error instanceof Error ? error.message : "Revisa el horario.");
    }
  }

  const cargarReservas = useCallback(async (range: Range) => {
    const requestId = ++request.current;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    ready.current = false;
    setCargando(true);
    setDisponible(false);
    setEventos([]);
    setError("");
    try {
      const reservas = await getReservasEnRango(recursoId, range.inicio, range.fin, abort.signal);
      if (!mounted.current || abort.signal.aborted || request.current !== requestId) return;
      setEventos(reservas.map(reserva => ({
        id: String(reserva.id),
        start: reserva.inicio,
        end: reserva.fin,
        display: "background",
        color: "#C0524A",
      })));
      ready.current = true;
      setDisponible(true);
    } catch (error) {
      if (mounted.current && request.current === requestId && !axios.isCancel(error)) {
        setError(errorMessage(error, "No se pudo cargar la disponibilidad"));
      }
    } finally {
      if (mounted.current && request.current === requestId) setCargando(false);
    }
  }, [recursoId]);

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    const range = { inicio: arg.start.toISOString(), fin: arg.end.toISOString() };
    visibleRange.current = range;
    setSeleccion(null);
    setMensaje("");
    void cargarReservas(range);
  }, [cargarReservas]);

  const handleSelect = (info: DateSelectArg) => {
    if (sending.current || !ready.current || !recurso?.activo) return;
    setError("");
    setMensaje("");
    if (info.start.getTime() <= Date.now()) {
      setError("La reserva debe comenzar en el futuro");
      info.view.calendar.unselect();
      return;
    }
    setSeleccion({ inicio: info.start.toISOString(), fin: info.end.toISOString() });
  };

  const confirmar = async () => {
    if (!seleccion || sending.current || !recurso?.activo) return;
    sending.current = true;
    setEnviando(true);
    setError("");
    setMensaje("");
    try {
      await crearReserva(recursoId, seleccion.inicio, seleccion.fin);
      if (!mounted.current) return;
      setSeleccion(null);
      calendar.current?.getApi().unselect();
      if (visibleRange.current) await cargarReservas(visibleRange.current);
      if (mounted.current) setMensaje("Reserva creada correctamente");
    } catch (error) {
      if (!mounted.current) return;
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setSeleccion(null);
        calendar.current?.getApi().unselect();
        if (visibleRange.current) await cargarReservas(visibleRange.current);
      }
      if (mounted.current) setError(errorMessage(error, "No se pudo crear la reserva"));
    } finally {
      sending.current = false;
      if (mounted.current) setEnviando(false);
    }
  };

  return (
    <div className="reservar-page">
      <Link to="/recursos">← Volver a recursos</Link>
      <h1>{recurso?.nombre ?? "Reserva un recurso"}</h1>
      {recurso?.descripcion && <p>{recurso.descripcion}</p>}
      {recurso?.capacidad != null && <p className="muted">Capacidad: {recurso.capacidad}</p>}
      {errorRecurso && <div><p className="feedback-error" role="alert">{errorRecurso}</p><button className="btn btn-ghost" onClick={() => { setErrorRecurso(""); setRecargaRecurso(value => value + 1); }}>Reintentar recurso</button></div>}
      {recurso && !recurso.activo && <p role="alert">Este recurso ya no acepta nuevas reservas.</p>}
      <p className="reservar-hint">
        Selecciona un bloque en el calendario o escribe las fechas en el formulario.
        Los bloques en rojo están ocupados. Horarios en tu zona: {zone}.
      </p>
      {cargando && <p role="status">Cargando disponibilidad...</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {mensaje && <p className="feedback-success" role="status">{mensaje} <Link to="/mis-reservas">Ver mis reservas</Link></p>}
      {!cargando && !disponible && <button disabled={enviando} onClick={() => {
        if (visibleRange.current) void cargarReservas(visibleRange.current);
      }}>Reintentar disponibilidad</button>}
      <form className="manual-booking" onSubmit={prepararHorario}>
        <fieldset disabled={enviando || !recurso?.activo}>
          <legend>Reservar con fecha y hora</legend>
          <div className="manual-fields">
            <label>Inicio<input type="datetime-local" required step="60" value={inicioManual}
              onChange={event => { setInicioManual(event.target.value); setSeleccion(null); }} /></label>
            <label>Fin<input type="datetime-local" required step="60" value={finManual}
              onChange={event => { setFinManual(event.target.value); setSeleccion(null); }} /></label>
            <button type="submit" className="btn btn-ghost">Revisar horario</button>
          </div>
          <p className="muted">La disponibilidad se confirma al guardar. Usa tu hora local ({zone}).</p>
        </fieldset>
      </form>
      {seleccion && <div className="reservar-confirmacion" aria-busy={enviando}>
        <p>Reservar desde {new Date(seleccion.inicio).toLocaleString("es-CO")} hasta {new Date(seleccion.fin).toLocaleString("es-CO")}</p>
        <button className="btn btn-primary" disabled={enviando || !recurso?.activo} onClick={confirmar}>
          {enviando ? "Reservando..." : "Confirmar reserva"}
        </button>
        <button className="btn" disabled={enviando} onClick={() => {
          setSeleccion(null);
          calendar.current?.getApi().unselect();
        }}>Cancelar selección</button>
      </div>}
      <div className="reservar-calendar" aria-busy={cargando || enviando}>
        <FullCalendar
          ref={calendar}
          plugins={[timeGridPlugin, interactionPlugin]}
          locale={esLocale}
          timeZone="local"
          initialView="timeGridWeek"
          selectable={!enviando && !cargando && disponible && Boolean(recurso?.activo)}
          selectMirror
          selectOverlap={false}
          selectAllow={selection => Boolean(recurso?.activo) && !sending.current && ready.current && selection.start.getTime() > Date.now()}
          select={handleSelect}
          datesSet={handleDatesSet}
          events={eventos}
          allDaySlot={false}
          headerToolbar={{ left: "prev,next today", center: "title", right: "timeGridWeek,timeGridDay" }}
          height="auto"
        />
      </div>
    </div>
  );
}
