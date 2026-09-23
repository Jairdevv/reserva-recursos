export interface Reserva {
  id: number;
  recurso_id: number;
  usuario_id: number;
  rango_horario: string;
  estado: "confirmada" | "cancelada";
  creado_en: Date;
  actualizado_en: Date;
}

export interface ReservaConRecurso {
  id: number;
  rango_horario: string;
  estado: "confirmada" | "cancelada";
  recurso_nombre: string;
}

export interface CrearReservaInput {
  recurso_id: number;
  inicio: string;
  fin: string;
}
