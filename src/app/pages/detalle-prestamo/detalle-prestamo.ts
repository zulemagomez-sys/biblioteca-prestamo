import { Component, inject, signal } from '@angular/core';
import { DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BibliotecaDb } from '../../services/biblioteca-db';
import { Libro } from '../../models/libro';
import { Prestamo } from '../../models/prestamo';

@Component({
  selector: 'app-detalle-prestamo',
  imports: [RouterLink, DatePipe, NgClass, TitleCasePipe],
  templateUrl: './detalle-prestamo.html',
  styleUrl: './detalle-prestamo.css',
})
export class DetallePrestamo {
  private db = inject(BibliotecaDb);
  private route = inject(ActivatedRoute);

  prestamo = signal<Prestamo | undefined>(undefined);
  libro = signal<Libro | undefined>(undefined);
  cargando = signal(true);
  noEncontrado = signal(false);
  procesando = signal(false);
  mensajeExito = signal('');
  error = signal('');

  constructor() {
    this.cargar();
  }

  // Se ejecuta también al recargar la página, porque lee de IndexedDB
  private async cargar() {
    const texto = this.route.snapshot.paramMap.get('id');
    const id = Number(texto);

    // Identificador inválido (letras, 0, negativos, decimales)
    if (!texto || !Number.isInteger(id) || id <= 0) {
      this.noEncontrado.set(true);
      this.cargando.set(false);
      return;
    }

    const prestamo = await this.db.obtenerPrestamo(id);
    if (!prestamo) {
      this.noEncontrado.set(true);
      this.cargando.set(false);
      return;
    }

    this.prestamo.set(prestamo);
    this.libro.set(await this.db.obtenerLibro(prestamo.libroId));
    this.cargando.set(false);
  }

  vencido(p: Prestamo): boolean {
    return p.estado === 'Activo' && new Date(p.fechaLimite + 'T23:59:59') < new Date();
  }

  async devolver() {
    const p = this.prestamo();
    if (!p?.id || p.estado === 'Devuelto') return;

    if (!confirm(`¿Registrar la devolución de «${p.libroTitulo}»?`)) return;

    this.error.set('');
    this.procesando.set(true);
    try {
      await this.db.devolverPrestamo(p.id);

      // Volvemos a leer para mostrar el estado y el stock ya actualizados
      this.prestamo.set(await this.db.obtenerPrestamo(p.id));
      this.libro.set(await this.db.obtenerLibro(p.libroId));
      this.mensajeExito.set(
        `Devolución registrada. Se recuperaron ${p.cantidad} unidad(es) de «${p.libroTitulo}».`,
      );
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.procesando.set(false);
    }
  }
}