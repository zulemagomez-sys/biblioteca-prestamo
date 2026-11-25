import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BibliotecaDb } from '../../services/biblioteca-db';
import { EstadoPrestamo, Prestamo } from '../../models/prestamo';

type Filtro = 'Todos' | EstadoPrestamo;

@Component({
  selector: 'app-historial',
  imports: [RouterLink, DatePipe, NgClass],
  templateUrl: './historial.html',
  styleUrl: './historial.css',
})
export class Historial {
  private db = inject(BibliotecaDb);

  prestamos = signal<Prestamo[]>([]);
  filtro = signal<Filtro>('Todos');
  cargando = signal(true);

  filtros: Filtro[] = ['Todos', 'Activo', 'Devuelto'];

  // Más recientes primero, aplicando el filtro por estado
  filtrados = computed(() => {
    const estado = this.filtro();
    return this.prestamos()
      .filter((p) => estado === 'Todos' || p.estado === estado)
      .sort((a, b) => b.fechaPrestamo.localeCompare(a.fechaPrestamo));
  });

  constructor() {
    this.cargar();
  }

  private async cargar() {
    this.prestamos.set(await this.db.obtenerPrestamos());
    this.cargando.set(false);
  }

  contar(filtro: Filtro): number {
    return filtro === 'Todos'
      ? this.prestamos().length
      : this.prestamos().filter((p) => p.estado === filtro).length;
  }

  // Un préstamo activo cuya fecha límite ya pasó
  vencido(p: Prestamo): boolean {
    return p.estado === 'Activo' && new Date(p.fechaLimite + 'T23:59:59') < new Date();
  }
}