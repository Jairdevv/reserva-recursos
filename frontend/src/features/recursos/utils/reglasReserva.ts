import type { ReglasReserva } from "../types";

export function errorHorario(reglas: ReglasReserva | null | undefined, inicio: string, fin: string): string | null {
  if (!reglas) return null;
  const formato = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  const a = formato.format(new Date(inicio));
  const b = formato.format(new Date(fin));
  const dia = new Date(`${a.slice(0, 10)}T12:00:00Z`).getUTCDay();
  if (a.slice(0, 10) !== b.slice(0, 10) || !reglas.dias.includes(dia) || a.slice(11) < `${reglas.apertura}:00` || b.slice(11) > `${reglas.cierre}:00`) return "Reserva fuera del horario habilitado (America/Bogota)";
  const duracion = (Date.parse(fin) - Date.parse(inicio)) / 60000;
  if (duracion < reglas.minutos_minimos || duracion > reglas.minutos_maximos) return `La reserva debe durar entre ${reglas.minutos_minimos} y ${reglas.minutos_maximos} minutos`;
  return null;
}
