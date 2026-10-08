import type { ReglasReserva } from "../types";

const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function ReglasReservaInfo({ reglas }: { reglas: ReglasReserva | null | undefined }) {
  if (!reglas) return null;

  return <div className="booking-rules">
    <div><span>Horario · Bogotá</span><strong>{reglas.apertura} – {reglas.cierre}</strong></div>
    <div><span>Duración permitida</span><strong>{reglas.minutos_minimos} – {reglas.minutos_maximos} minutos</strong></div>
    <div><span>Días habilitados</span><strong>{[...reglas.dias].sort().map(dia => dias[dia]).join(", ")}</strong></div>
  </div>;
}
