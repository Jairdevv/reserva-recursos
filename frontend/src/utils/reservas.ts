import type { ReservaConRecurso } from "../types";

export type FiltroReservas = "proximas" | "historial" | "todas";
export function reservaVigente(reserva: ReservaConRecurso, now: number) {
  return reserva.estado === "confirmada" && Date.parse(reserva.fin) > now;
}
export function estadoReserva(reserva: ReservaConRecurso, now: number) {
  if (reserva.estado === "cancelada") return "Cancelada";
  if (Date.parse(reserva.fin) <= now) return "Finalizada";
  if (Date.parse(reserva.inicio) <= now) return "En curso";
  return "Confirmada";
}
export function filtrarReservas(reservas: ReservaConRecurso[], filtro: FiltroReservas, query: string, now: number) {
  const search = query.trim().toLocaleLowerCase("es");
  return reservas.filter(reserva => {
    const vigente = reservaVigente(reserva, now);
    return (filtro === "todas" || (filtro === "proximas" ? vigente : !vigente)) &&
      reserva.recurso_nombre.toLocaleLowerCase("es").includes(search);
  }).sort((a, b) => filtro === "proximas"
    ? Date.parse(a.inicio) - Date.parse(b.inicio)
    : Date.parse(b.inicio) - Date.parse(a.inicio));
}
export function rangoLocal(inicio: string, fin: string, now = Date.now()) {
  const parse = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Completa las fechas y horas.");
    const date = new Date(value);
    const [year, month, day, hour, minute] = value.split(/[-T:]/).map(Number);
    if (!Number.isFinite(date.getTime()) || date.getFullYear() !== year ||
        date.getMonth() + 1 !== month || date.getDate() !== day ||
        date.getHours() !== hour || date.getMinutes() !== minute) {
      throw new Error("La fecha u hora seleccionada no es válida en tu zona.");
    }
    return date;
  };
  const start = parse(inicio);
  const end = parse(fin);
  if (start.getTime() <= now) throw new Error("La reserva debe comenzar en el futuro.");
  if (end <= start) throw new Error("La hora final debe ser posterior al inicio.");
  return { inicio: start.toISOString(), fin: end.toISOString() };
}
