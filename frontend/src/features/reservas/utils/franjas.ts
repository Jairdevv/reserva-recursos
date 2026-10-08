import type { ReglasReserva } from "../../recursos/types";
import { errorHorario } from "../../recursos/utils/reglasReserva";

export function generarFranjasRapidas(dia: string, reglas?: ReglasReserva | null) {
  if (!reglas) return [];
  const desde = new Date(`${dia}T00:00:00`);
  if (!Number.isFinite(desde.getTime()) || dia !== `${desde.getFullYear()}-${String(desde.getMonth() + 1).padStart(2, "0")}-${String(desde.getDate()).padStart(2, "0")}`) return [];
  const hasta = new Date(desde);
  hasta.setDate(hasta.getDate() + 1);
  const formato = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" });
  const fechas = new Set([formato.format(desde), formato.format(new Date(hasta.getTime() - 1))]);
  const minutos = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3));
  const franjas: { inicio: Date; fin: Date }[] = [];

  for (const fecha of fechas) {
    for (let minuto = minutos(reglas.apertura); minuto + reglas.minutos_minimos <= minutos(reglas.cierre); minuto += reglas.minutos_minimos) {
      const hora = `${String(Math.floor(minuto / 60)).padStart(2, "0")}:${String(minuto % 60).padStart(2, "0")}`;
      const inicio = new Date(`${fecha}T${hora}:00-05:00`);
      const fin = new Date(inicio.getTime() + reglas.minutos_minimos * 60000);
      if (inicio >= desde && fin <= hasta && !errorHorario(reglas, inicio.toISOString(), fin.toISOString())) franjas.push({ inicio, fin });
    }
  }
  return franjas.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
}
