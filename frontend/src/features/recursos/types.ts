export interface ReglasReserva {
  apertura: string;
  cierre: string;
  minutos_minimos: number;
  minutos_maximos: number;
  dias: number[];
}
export interface Recurso {
  id: number;
  nombre: string;
  descripcion: string | null;
  capacidad: number | null;
  activo: boolean;
  categoria_id: number | null;
  categoria_nombre: string | null;
  reglas_reserva: ReglasReserva | null;
}
export interface NuevoRecurso {
  nombre: string;
  descripcion?: string | null;
  capacidad?: number | null;
  categoria_id?: number | null;
  reglas_reserva?: ReglasReserva | null;
}
