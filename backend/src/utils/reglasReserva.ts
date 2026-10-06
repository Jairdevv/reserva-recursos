import { HttpError } from "./errors";
import { objectInput } from "./validation";

export interface ReglasReserva {
  apertura: string;
  cierre: string;
  minutos_minimos: number;
  minutos_maximos: number;
  dias: number[];
}
export function validarReglas(value: unknown): ReglasReserva | null {
  if (value === null) return null;
  const data = objectInput(value);
  const hora = (v: unknown): v is string => typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
  if (Object.keys(data).some(key => !["apertura", "cierre", "minutos_minimos", "minutos_maximos", "dias"].includes(key)) ||
      !hora(data.apertura) || !hora(data.cierre) || data.apertura >= data.cierre ||
      typeof data.minutos_minimos !== "number" || !Number.isInteger(data.minutos_minimos) || data.minutos_minimos < 1 ||
      typeof data.minutos_maximos !== "number" || !Number.isInteger(data.minutos_maximos) || data.minutos_maximos < data.minutos_minimos || data.minutos_maximos > 1440 ||
      !Array.isArray(data.dias) || !data.dias.length || data.dias.some(dia => !Number.isInteger(dia) || dia < 0 || dia > 6)) {
    throw new HttpError(400, "Reglas inválidas: revisa días, apertura, cierre y duración");
  }
  const minutos = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3));
  if (data.minutos_minimos > minutos(data.cierre) - minutos(data.apertura)) throw new HttpError(400, "La duración mínima supera el horario de apertura");
  return { apertura: data.apertura, cierre: data.cierre, minutos_minimos: data.minutos_minimos, minutos_maximos: data.minutos_maximos, dias: [...new Set(data.dias as number[])] };
}
export function comprobarHorario(reglas: ReglasReserva | null, inicio: string, fin: string) {
  if (!reglas) return;
  const formato = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  const a = formato.format(new Date(inicio));
  const b = formato.format(new Date(fin));
  const dia = new Date(`${a.slice(0, 10)}T12:00:00Z`).getUTCDay();
  const duracion = (Date.parse(fin) - Date.parse(inicio)) / 60000;
  if (a.slice(0, 10) !== b.slice(0, 10) || !reglas.dias.includes(dia) || a.slice(11) < `${reglas.apertura}:00` || b.slice(11) > `${reglas.cierre}:00`) throw new HttpError(400, "Reserva fuera del horario habilitado (America/Bogota)");
  if (duracion < reglas.minutos_minimos || duracion > reglas.minutos_maximos) throw new HttpError(400, `La reserva debe durar entre ${reglas.minutos_minimos} y ${reglas.minutos_maximos} minutos`);
}
