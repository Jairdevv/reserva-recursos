export interface Reserva {
  id: number;
  recurso_id: number;
  inicio: string;
  fin: string;
  estado: "confirmada" | "cancelada";
}

export interface ReservaConRecurso {
  id: number;
  inicio: string;
  fin: string;
  estado: "confirmada" | "cancelada";
  recurso_nombre: string;
}
