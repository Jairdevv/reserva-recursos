import { Link, useParams } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import ReglasReservaInfo from "../../recursos/components/ReglasReservaInfo";
import ResumenReserva from "../components/ResumenReserva";
import { fechaLocal, useReservaRecurso } from "../hooks/useReservaRecurso";
import "../styles/ReservarRecursos.css";

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
  const {
    recurso, errorRecurso, reintentarRecurso, error, mensaje, dia, dias, cambiarDia,
    cargando, disponible, enviando, franjas, seleccion, inicioManual, finManual,
    setInicioManual, setFinManual, prepararHorario, limpiarSeleccion, hora, zone,
    calendar, eventos, handleSelect, handleDatesSet, confirmar, elegirFranja,
    reintentarDisponibilidad,
  } = useReservaRecurso(recursoId);

  return <main className="workspace-page reservar-page booking-page">
    <Link className="booking-back" to="/recursos">← Catálogo / {recurso?.categoria_nombre ?? "Recursos"}</Link>
    <header className="booking-heading">
      <div><p className="eyebrow">Tu espacio, tu próximo plan</p><h1>Reserva <em>tu espacio</em></h1><p>Elige fecha y horario, y confirma.</p></div>
      <span className="booking-zone">Hora local · {zone}</span>
    </header>
    {errorRecurso && <div className="empty-state"><p className="feedback-error" role="alert">{errorRecurso}</p><button className="btn btn-ghost" onClick={reintentarRecurso}>Reintentar recurso</button></div>}
    {recurso && !recurso.activo && <p className="feedback-error" role="alert">Este recurso ya no acepta nuevas reservas.</p>}
    {mensaje && <p className="feedback-success" role="status">{mensaje} <Link to="/mis-reservas">Ver mis reservas →</Link></p>}
    <div className="booking-layout">
      <div className="booking-main">
        <section className="booking-panel" aria-labelledby="booking-day-title">
          <div className="booking-section-heading"><h2 id="booking-day-title"><span>01</span> Elige un día</h2><label className="booking-date-label"><span className="booking-sr-only">Elegir fecha</span><input type="date" value={dia} disabled={enviando} onChange={event => cambiarDia(event.target.value)} /></label></div>
          <div className="booking-days">{dias.map(date => {
            const value = fechaLocal(date);
            return <button type="button" key={value} aria-pressed={value === dia} disabled={enviando} onClick={() => cambiarDia(value)}><span>{date.toLocaleDateString("es-CO", { weekday: "short", month: "short" })}</span><strong>{date.getDate()}</strong><small>{value === dia ? "● Seleccionado" : "Ver horarios"}</small></button>;
          })}</div>
        </section>
        <section className="booking-panel" aria-labelledby="booking-slots-title" aria-busy={cargando}>
          <div className="booking-section-heading"><h2 id="booking-slots-title"><span>02</span> Elige un horario</h2><div className="booking-legend"><span>● Libre</span><span>● Ocupado</span></div></div>
          <ReglasReservaInfo reglas={recurso?.reglas_reserva} />
          {recurso?.reglas_reserva && franjas.length === 0 && <p className="muted">No hay franjas habilitadas para este día. Elige otra jornada.</p>}
          {cargando && <p role="status" className="muted">Consultando disponibilidad…</p>}
          {!cargando && !disponible && <button className="btn btn-ghost" disabled={enviando} onClick={reintentarDisponibilidad}>Reintentar disponibilidad</button>}
          <div className="booking-slots">{franjas.map(franja => {
            const inicio = franja.inicio.toISOString();
            const fin = franja.fin.toISOString();
            const selected = seleccion?.inicio === inicio && seleccion.fin === fin;
            const disabled = cargando || !disponible || enviando || !recurso?.activo || franja.ocupado || franja.pasado;
            return <button key={inicio} className={`booking-slot${franja.ocupado ? " is-busy" : ""}`} type="button" disabled={disabled} aria-pressed={selected} onClick={() => elegirFranja(franja.inicio, franja.fin)}><strong>{hora(franja.inicio)} – {hora(franja.fin)}</strong><span>{cargando ? "Consultando…" : !disponible ? "Sin verificar" : franja.pasado ? "Horario pasado" : franja.ocupado ? "Ocupado" : selected ? "Seleccionado · Tu reserva" : "Libre · Reservar"}</span></button>;
          })}</div>
          <form className="manual-booking" onSubmit={prepararHorario}><fieldset disabled={enviando || !recurso?.activo}><legend>Horario personalizado</legend><div className="manual-fields"><label>Inicio<input type="datetime-local" required step="60" value={inicioManual} onChange={event => { setInicioManual(event.target.value); limpiarSeleccion(); }} /></label><label>Fin<input type="datetime-local" required step="60" value={finManual} onChange={event => { setFinManual(event.target.value); limpiarSeleccion(); }} /></label><button type="submit" className="btn btn-ghost">Revisar horario</button></div>
            {error && <p className="feedback-error" role="alert">{error}</p>}

            <p className="muted">La disponibilidad final se confirma al guardar. Horarios en {zone}.</p></fieldset></form>
          <details className="booking-calendar-details" onToggle={event => { if (event.currentTarget.open) calendar.current?.getApi().updateSize(); }}><summary>Consultar calendario y seleccionar otro intervalo</summary><div className="reservar-calendar" aria-busy={cargando || enviando}>
            <FullCalendar ref={calendar} plugins={[timeGridPlugin, interactionPlugin]} locale={esLocale} timeZone="local" initialView="timeGridDay" selectable={!enviando && !cargando && disponible && Boolean(recurso?.activo)} selectMirror selectOverlap={false} selectAllow={selection => Boolean(recurso?.activo) && !enviando && disponible && selection.start.getTime() > Date.now()} select={handleSelect} datesSet={handleDatesSet} events={eventos} allDaySlot={false} headerToolbar={{ left: "prev,next today", center: "title", right: "" }} height="auto" />
          </div></details>
        </section>
        <section className="booking-panel booking-details" aria-labelledby="booking-details-title"><h2 id="booking-details-title"><span>03</span> Detalles del recurso</h2><h3>{recurso?.nombre ?? "Cargando recurso…"}</h3><p>{recurso?.descripcion || "Este recurso no tiene una descripción registrada."}</p><dl><div><dt>Categoría</dt><dd>{recurso?.categoria_nombre ?? "Sin categoría"}</dd></div><div><dt>Capacidad</dt><dd>{recurso?.capacidad != null ? `${recurso.capacidad} personas` : "Sin especificar"}</dd></div></dl></section>
      </div>
      <ResumenReserva recurso={recurso} seleccion={seleccion} enviando={enviando} zone={zone} confirmar={confirmar} limpiar={limpiarSeleccion} />
    </div>
  </main>;
}
