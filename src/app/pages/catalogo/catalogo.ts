import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { BibliotecaDb } from '../../services/biblioteca-db';
import { Libro } from '../../models/libro';
import { LibroCard } from '../../components/libro-card/libro-card';

@Component({
  selector: 'app-catalogo',
  imports: [LibroCard, RouterLink],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo {
  private db = inject(BibliotecaDb);
  private router = inject(Router);

  libros = signal<Libro[]>([]);
  busqueda = signal('');
  categoria = signal('');
  cargando = signal(true);
  mensaje = signal('');
  error = signal('');

  categorias = computed(() =>
    [...new Set(this.libros().map((l) => l.categoria))].sort(),
  );

  filtrados = computed(() => {
    const texto = this.normalizar(this.busqueda());
    const cat = this.categoria();

    return this.libros().filter((l) => {
      const coincideTexto =
        this.normalizar(l.titulo).includes(texto) ||
        this.normalizar(l.autor).includes(texto);
      const coincideCategoria = cat === '' || l.categoria === cat;
      return coincideTexto && coincideCategoria;
    });
  });

  constructor() {
    this.cargar();
  }

  private async cargar() {
    this.libros.set(await this.db.obtenerLibros());
    this.cargando.set(false);
  }

  private normalizar(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  irAPrestar(libro: Libro) {
    this.router.navigate(['/prestamos/nuevo'], { queryParams: { libroId: libro.id } });
  }

  irAEditar(libro: Libro) {
    this.router.navigate(['/libros', libro.id, 'editar']);
  }

  async eliminar(libro: Libro) {
    this.mensaje.set('');
    this.error.set('');
    if (!confirm(`¿Eliminar «${libro.titulo}» del catálogo?`)) return;

    try {
      await this.db.eliminarLibro(libro.id);
      this.libros.set(await this.db.obtenerLibros());
      this.mensaje.set(`Se eliminó «${libro.titulo}» del catálogo.`);
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }

  limpiar() {
    this.busqueda.set('');
    this.categoria.set('');
  }
}