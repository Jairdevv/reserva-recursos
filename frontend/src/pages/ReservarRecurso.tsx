import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import type { DateSelectArg, EventInput, DatesSetArg } from "@fullcalendar/core";
import { getReservasEnRango, crearReserva } from "../services";
import { errorMessage } from "../api";
import "../styles/ReservarRecursos.css";

type Range = { inicio: string; fin: string };

export default function ReservarRecurso() {
  const { id } = useParams<{ id: string }>();
  const recursoId = Number(id);
  if (!id || !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(recursoId) || recursoId > 2147483647) {
    return <div className="reservar-page">
      <p role="alert">El recurso seleccionado no es válido.</p>
      <Link to="/recursos">← Volver a recursos</Link>
    </div>;
  }
  return <CalendarioRecurso key={recursoId} recursoId={recursoId} />;
}

function CalendarioRecurso({ recursoId }: { recursoId: number }) {
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
    if (sending.current || !ready.current) return;
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
    if (!seleccion || sending.current || !ready.current) return;
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
      <h2>Selecciona un horario</h2>
      <p className="reservar-hint">
        Arrastra sobre un espacio libre y confirma tu reserva.
        Los bloques en rojo están ocupados. Horarios en tu zona: {zone}.
      </p>
      {cargando && <p role="status">Cargando disponibilidad...</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {mensaje && <p className="reservar-ok" role="status">{mensaje}</p>}
      {!cargando && !disponible && <button disabled={enviando} onClick={() => {
        if (visibleRange.current) void cargarReservas(visibleRange.current);
      }}>Reintentar disponibilidad</button>}
      {seleccion && <div className="reservar-confirmacion" aria-busy={enviando}>
        <p>Reservar desde {new Date(seleccion.inicio).toLocaleString("es-CO")} hasta {new Date(seleccion.fin).toLocaleString("es-CO")}</p>
        <button className="btn btn-primary" disabled={enviando || cargando || !disponible} onClick={confirmar}>
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
          selectable={!enviando && !cargando && disponible}
          selectMirror
          selectOverlap={false}
          selectAllow={selection => !sending.current && ready.current && selection.start.getTime() > Date.now()}
          select={handleSelect}
          datesSet={handleDatesSet}
          events={eventos}
          allDaySlot={false}
          headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
          height="auto"
        />
      </div>
    </div>
  );
}
