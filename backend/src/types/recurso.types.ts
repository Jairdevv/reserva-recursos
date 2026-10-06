import type { ReglasReserva } from "../utils/reglasReserva";
export interface Recurso {
  id: number;
  nombre: string;
  descripcion: string | null;
  capacidad: number | null;
  activo: boolean;
  categoria_id: number | null;
  categoria_nombre: string | null;
  reglas_reserva: ReglasReserva | null;
  creado_en: Date;
}
export interface CrearRecursoInput {
  nombre: string;
  descripcion?: string | null;
  capacidad?: number | null;
  categoria_id?: number | null;
  reglas_reserva?: ReglasReserva | null;
}
export type ActualizarRecursoInput = Partial<CrearRecursoInput>;
