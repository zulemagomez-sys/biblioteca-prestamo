import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BibliotecaDb } from '../../services/biblioteca-db';
import { Libro } from '../../models/libro';
import { LibroCard } from '../../components/libro-card/libro-card';

@Component({
  selector: 'app-catalogo',
  imports: [LibroCard],
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

  categorias = computed(() =>
    [...new Set(this.libros().map((l) => l.categoria))].sort(),
  );

  // Búsqueda y filtro funcionan juntos: un libro debe cumplir ambos
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

  limpiar() {
    this.busqueda.set('');
    this.categoria.set('');
  }
}