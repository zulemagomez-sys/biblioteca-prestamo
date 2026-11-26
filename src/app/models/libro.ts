
export interface Libro {
  id: number;
  titulo: string;
  autor: string;
  categoria: string;
  existencias: number;
  portada?: string; 
}