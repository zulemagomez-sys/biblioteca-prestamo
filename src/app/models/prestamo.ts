export type EstadoPrestamo = 'Activo' | 'Devuelto';

export interface Prestamo {
  id?: number;
  libroId: number;
  libroTitulo: string;
  solicitante: string;
  cantidad: number;
  fechaPrestamo: string;
  fechaLimite: string;
  estado: EstadoPrestamo;
  fechaDevolucion?: string;
}