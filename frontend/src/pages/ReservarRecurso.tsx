import type { FormEvent } from "react";
import type { Recurso } from "../types";
import { rangoLocal } from "../utils/reservas";
import { generarFranjasRapidas } from "../utils/franjas";
import { FRANJAS_RAPIDAS } from "../config/reservas";
import { errorHorario } from "../utils/reglasReserva";
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
const fechaLocal = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

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
  const [dia, setDia] = useState(() => fechaLocal(new Date()));
  const [ahora, setAhora] = useState(() => Date.now());
  const calendar = useRef<FullCalendar>(null);
  const mounted = useRef(true);
  const request = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const visibleRange = useRef<Range | null>(null);
  const sending = useRef(false);
  const ready = useRef(false);
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    const timer = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

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
      const problema = errorHorario(recurso.reglas_reserva, range.inicio, range.fin);
      if (problema) throw new Error(problema);
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
        color: "#ef4444",
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
    setDia(fechaLocal(arg.view.currentStart));
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
    const range = { inicio: info.start.toISOString(), fin: info.end.toISOString() };
    const problema = errorHorario(recurso.reglas_reserva, range.inicio, range.fin);
    if (problema) { setError(problema); info.view.calendar.unselect(); return; }
    setSeleccion(range);
  };

  const confirmar = async () => {
    if (!seleccion || sending.current || !recurso?.activo) return;
    const problema = errorHorario(recurso.reglas_reserva, seleccion.inicio, seleccion.fin);
    if (problema) { setError(problema); return; }
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

  const fechaDia = new Date(`${dia}T12:00:00`);
  const dias = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(fechaDia);
    date.setDate(date.getDate() + index - 3);
    return date;
  });
  const franjas = generarFranjasRapidas(dia, recurso?.reglas_reserva).map(({ inicio, fin }) => {
    const ocupado = eventos.some(evento => inicio.getTime() < Date.parse(String(evento.end)) && fin.getTime() > Date.parse(String(evento.start)));
    return { inicio, fin, ocupado, pasado: inicio.getTime() <= ahora };
  });
  function cambiarDia(value: string) {
    if (sending.current || !value || value === dia || !Number.isFinite(new Date(`${value}T12:00:00`).getTime())) return;
    setSeleccion(null);
    ready.current = false;
    setDisponible(false);
    setCargando(true);
    setDia(value);
    calendar.current?.getApi().gotoDate(value);
  }
  function limpiarSeleccion() {
    setSeleccion(null);
    calendar.current?.getApi().unselect();
  }
  const hora = (value: string | Date) => new Date(value).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });

  return <main className="workspace-page reservar-page booking-page">
    <Link className="booking-back" to="/recursos">← Catálogo / {recurso?.categoria_nombre ?? "Recursos"}</Link>
    <header className="booking-heading">
      <div><p className="eyebrow">Tu espacio, tu próximo plan</p><h1>Configuración y <em>confirmación de reserva</em></h1><p>Selecciona una fecha y un horario. Revisa los detalles y confirma tu reserva.</p></div>
      <span className="booking-zone">Hora local · {zone}</span>
    </header>
    {errorRecurso && <div className="empty-state"><p className="feedback-error" role="alert">{errorRecurso}</p><button className="btn btn-ghost" onClick={() => { setErrorRecurso(""); setRecargaRecurso(value => value + 1); }}>Reintentar recurso</button></div>}
    {recurso && !recurso.activo && <p className="feedback-error" role="alert">Este recurso ya no acepta nuevas reservas.</p>}
    {mensaje && <p className="feedback-success" role="status">{mensaje} <Link to="/mis-reservas">Ver mis reservas →</Link></p>}
    <div className="booking-layout">
      <div className="booking-main">
        <section className="booking-panel" aria-labelledby="booking-day-title">
          <div className="booking-section-heading"><h2 id="booking-day-title"><span>01</span> Selección de jornada</h2><label className="booking-date-label"><span className="booking-sr-only">Elegir fecha</span><input type="date" value={dia} disabled={enviando} onChange={event => cambiarDia(event.target.value)} /></label></div>
          <div className="booking-days">{dias.map(date => {
            const value = fechaLocal(date);
            return <button type="button" key={value} aria-pressed={value === dia} disabled={enviando} onClick={() => cambiarDia(value)}><span>{date.toLocaleDateString("es-CO", { weekday: "short", month: "short" })}</span><strong>{date.getDate()}</strong><small>{value === dia ? "● Seleccionado" : "Ver horarios"}</small></button>;
          })}</div>
        </section>
        <section className="booking-panel" aria-labelledby="booking-slots-title" aria-busy={cargando}>
          <div className="booking-section-heading"><h2 id="booking-slots-title"><span>02</span> Franja horaria</h2><div className="booking-legend"><span>● Libre</span><span>● Ocupado</span></div></div>
          <p className="booking-help">{recurso?.reglas_reserva ? `Horario en Bogotá: ${recurso.reglas_reserva.apertura} – ${recurso.reglas_reserva.cierre}. Duración: ${recurso.reglas_reserva.minutos_minimos} a ${recurso.reglas_reserva.minutos_maximos} minutos. Días: ${recurso.reglas_reserva.dias.map(dia => ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][dia]).join(", ")}. Las franjas se muestran en tu hora local.` : `Sin restricciones configuradas. Sugerencias de ${FRANJAS_RAPIDAS.duracionMinutos} minutos entre ${FRANJAS_RAPIDAS.inicio} y ${FRANJAS_RAPIDAS.fin}; puedes elegir otro horario o duración.`}</p>
          {recurso?.reglas_reserva && franjas.length === 0 && <p className="muted">No hay franjas habilitadas para este día. Elige otra jornada.</p>}
          {cargando && <p role="status" className="muted">Consultando disponibilidad…</p>}
          {!cargando && !disponible && <button className="btn btn-ghost" disabled={enviando} onClick={() => { if (visibleRange.current) void cargarReservas(visibleRange.current); }}>Reintentar disponibilidad</button>}
          <div className="booking-slots">{franjas.map(franja => {
            const inicio = franja.inicio.toISOString();
            const fin = franja.fin.toISOString();
            const selected = seleccion?.inicio === inicio && seleccion.fin === fin;
            const disabled = cargando || !disponible || enviando || !recurso?.activo || franja.ocupado || franja.pasado;
            return <button key={inicio} className={`booking-slot${franja.ocupado ? " is-busy" : ""}`} type="button" disabled={disabled} aria-pressed={selected} onClick={() => {
              if (!ready.current || sending.current || franja.inicio.getTime() <= Date.now()) return;
              setSeleccion({ inicio, fin }); setError(""); setMensaje(""); calendar.current?.getApi().unselect();
            }}><strong>{hora(franja.inicio)} – {hora(franja.fin)}</strong><span>{cargando ? "Consultando…" : !disponible ? "Sin verificar" : franja.pasado ? "Horario pasado" : franja.ocupado ? "Ocupado" : selected ? "Seleccionado · Tu reserva" : "Libre · Reservar"}</span></button>;
          })}</div>
          <form className="manual-booking" onSubmit={prepararHorario}><fieldset disabled={enviando || !recurso?.activo}><legend>Horario personalizado</legend><div className="manual-fields"><label>Inicio<input type="datetime-local" required step="60" value={inicioManual} onChange={event => { setInicioManual(event.target.value); limpiarSeleccion(); }} /></label><label>Fin<input type="datetime-local" required step="60" value={finManual} onChange={event => { setFinManual(event.target.value); limpiarSeleccion(); }} /></label><button type="submit" className="btn btn-ghost">Revisar horario</button></div>
            {error && <p className="feedback-error" role="alert">{error}</p>}

            <p className="muted">La disponibilidad final se confirma al guardar. Horarios en {zone}.</p></fieldset></form>
          <details className="booking-calendar-details" onToggle={event => { if (event.currentTarget.open) calendar.current?.getApi().updateSize(); }}><summary>Consultar calendario y seleccionar otro intervalo</summary><div className="reservar-calendar" aria-busy={cargando || enviando}>
            <FullCalendar ref={calendar} plugins={[timeGridPlugin, interactionPlugin]} locale={esLocale} timeZone="local" initialView="timeGridDay" selectable={!enviando && !cargando && disponible && Boolean(recurso?.activo)} selectMirror selectOverlap={false} selectAllow={selection => Boolean(recurso?.activo) && !sending.current && ready.current && selection.start.getTime() > Date.now()} select={handleSelect} datesSet={handleDatesSet} events={eventos} allDaySlot={false} headerToolbar={{ left: "prev,next today", center: "title", right: "" }} height="auto" />
          </div></details>
        </section>
        <section className="booking-panel booking-details" aria-labelledby="booking-details-title"><h2 id="booking-details-title"><span>03</span> Detalles del recurso</h2><h3>{recurso?.nombre ?? "Cargando recurso…"}</h3><p>{recurso?.descripcion || "Este recurso no tiene una descripción registrada."}</p><dl><div><dt>Categoría</dt><dd>{recurso?.categoria_nombre ?? "Sin categoría"}</dd></div><div><dt>Capacidad</dt><dd>{recurso?.capacidad != null ? `${recurso.capacidad} personas` : "Sin especificar"}</dd></div></dl></section>
      </div>
      <aside className="booking-sidebar" aria-labelledby="booking-summary-title">
        <div className="booking-summary-card">
          <div className="booking-photo"><img src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80" alt="" onError={event => { event.currentTarget.style.visibility = "hidden"; }} /><span>Imagen ilustrativa</span><strong>{recurso?.nombre ?? "Tu espacio"}</strong></div>
          <div className="booking-summary-body"><div className="booking-section-heading"><h2 id="booking-summary-title">Resumen de reserva</h2><span className="booking-summary-state">{seleccion ? "Por confirmar" : "Sin selección"}</span></div>
            <dl><div><dt>Recurso</dt><dd>{recurso?.nombre ?? "Cargando…"}</dd></div><div><dt>Fecha</dt><dd>{seleccion ? new Date(seleccion.inicio).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }) : "Elige un horario"}</dd></div><div><dt>Inicio</dt><dd>{seleccion ? `${hora(seleccion.inicio)} · ${new Date(seleccion.inicio).toLocaleDateString("es-CO")}` : "—"}</dd></div><div><dt>Fin</dt><dd>{seleccion ? `${hora(seleccion.fin)} · ${new Date(seleccion.fin).toLocaleDateString("es-CO")}` : "—"}</dd></div><div><dt>Duración</dt><dd>{seleccion ? `${Math.round((Date.parse(seleccion.fin) - Date.parse(seleccion.inicio)) / 60000)} minutos` : "—"}</dd></div><div><dt>Zona horaria</dt><dd>{zone}</dd></div></dl>
            <p className="booking-summary-note">{seleccion ? "Revisa tu selección. El horario se reservará al confirmar." : "Selecciona una franja o introduce las fechas para preparar tu reserva."}</p>
            <button className="btn btn-primary booking-confirm" disabled={!seleccion || enviando || !recurso?.activo} onClick={confirmar}>{enviando ? "Reservando…" : "Confirmar reserva →"}</button>
            <div className="booking-summary-links"><button type="button" disabled={!seleccion || enviando} onClick={limpiarSeleccion}>Limpiar selección</button><Link to="/recursos">Volver al catálogo</Link></div>
          </div>
        </div>
        <div className="booking-notice"><span aria-hidden="true">◈</span><p><strong>Tu horario, sin cruces</strong>El sistema verifica la disponibilidad al confirmar. Si otra persona reserva primero, podrás elegir un nuevo horario.</p></div>
      </aside>
    </div>
  </main>;
}
