export interface Reserva {
  id: number;
  recurso_id: number;
  usuario_id: number;
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
export type Disponibilidad = Pick<Reserva, "id" | "inicio" | "fin">;
export interface CrearReservaInput {
  recurso_id: number;
  inicio: string;
  fin: string;
}
