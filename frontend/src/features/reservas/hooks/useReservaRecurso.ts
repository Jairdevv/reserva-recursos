import { useState, useCallback, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import type FullCalendar from "@fullcalendar/react";
import type { DateSelectArg, EventInput, DatesSetArg } from "@fullcalendar/core";
import axios from "axios";
import type { Recurso } from "../../recursos/types";
import { rangoLocal } from "../utils/reservas";
import { generarFranjasRapidas } from "../utils/franjas";
import { errorHorario } from "../../recursos/utils/reglasReserva";
import { getRecurso } from "../../recursos/services";
import { getReservasEnRango, crearReserva } from "../services";
import { errorMessage } from "../../../shared/api/http";

type Range = { inicio: string; fin: string };
export const fechaLocal = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function useReservaRecurso(recursoId: number) {
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

  function reintentarRecurso() {
    setErrorRecurso("");
    setRecargaRecurso(value => value + 1);
  }
  function reintentarDisponibilidad() {
    if (visibleRange.current) void cargarReservas(visibleRange.current);
  }
  function elegirFranja(inicio: Date, fin: Date) {
    if (!ready.current || sending.current || inicio.getTime() <= Date.now()) return;
    setSeleccion({ inicio: inicio.toISOString(), fin: fin.toISOString() });
    setError(""); setMensaje("");
    calendar.current?.getApi().unselect();
  }
  return {
    recurso, errorRecurso, reintentarRecurso, error, mensaje, dia, dias, cambiarDia,
    cargando, disponible, enviando, franjas, seleccion, inicioManual, finManual,
    setInicioManual, setFinManual, prepararHorario, limpiarSeleccion, hora, zone,
    calendar, eventos, handleSelect, handleDatesSet, confirmar, elegirFranja,
    reintentarDisponibilidad,
  };
}