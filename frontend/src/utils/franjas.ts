import { FRANJAS_RAPIDAS } from "../config/reservas";
import { rangoLocal } from "./reservas";
import type { ReglasReserva } from "../types";
import { errorHorario } from "./reglasReserva";

export function generarFranjasRapidas(dia: string, reglas?: ReglasReserva | null) {
  const minutos = (hora: string) => {
    const [horas, minutos] = hora.split(":").map(Number);
    return horas * 60 + minutos;
  };
  const fecha = (minuto: number) => `${dia}T${String(Math.floor(minuto / 60)).padStart(2, "0")}:${String(minuto % 60).padStart(2, "0")}`;
  const franjas: { inicio: Date; fin: Date }[] = [];
  if (reglas) {
    // Colombia no cambia de offset: convertir primero la jornada local visible a sus límites en Bogotá.
    const desde = new Date(`${dia}T00:00:00`).getTime();
    const hasta = new Date(desde);
    hasta.setDate(hasta.getDate() + 1);
    const formato = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" });
    const fechas = new Set([formato.format(new Date(desde)), formato.format(new Date(hasta.getTime() - 1))]);
    const duracion = Math.max(reglas.minutos_minimos, Math.min(FRANJAS_RAPIDAS.duracionMinutos, reglas.minutos_maximos));
    for (const fechaBogota of fechas) {
      for (let minuto = minutos(reglas.apertura); minuto + duracion <= minutos(reglas.cierre); minuto += duracion) {
        const inicio = new Date(`${fechaBogota}T${String(Math.floor(minuto / 60)).padStart(2, "0")}:${String(minuto % 60).padStart(2, "0")}:00-05:00`);
        const fin = new Date(inicio.getTime() + duracion * 60000);
        if (inicio.getTime() >= desde && inicio.getTime() < hasta.getTime() && !errorHorario(reglas, inicio.toISOString(), fin.toISOString())) franjas.push({ inicio, fin });
      }
    }
    return franjas.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
  }
  for (let minuto = minutos(FRANJAS_RAPIDAS.inicio);
    minuto + FRANJAS_RAPIDAS.duracionMinutos <= minutos(FRANJAS_RAPIDAS.fin);
    minuto += FRANJAS_RAPIDAS.duracionMinutos) {
    try {
      // Omite horas civiles inexistentes durante cambios de zona horaria.
      const rango = rangoLocal(fecha(minuto), fecha(minuto + FRANJAS_RAPIDAS.duracionMinutos), -Infinity);
      franjas.push({ inicio: new Date(rango.inicio), fin: new Date(rango.fin) });
    } catch {
      continue;
    }
  }
  return franjas;
}
