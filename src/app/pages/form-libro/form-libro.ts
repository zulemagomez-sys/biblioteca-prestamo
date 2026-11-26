import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BibliotecaDb } from '../../services/biblioteca-db';

@Component({
  selector: 'app-form-libro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './form-libro.html',
  styleUrl: './form-libro.css',
})
export class FormLibro {
  private db = inject(BibliotecaDb);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  idEdicion: number | null = null; // null = estamos agregando
  categorias = signal<string[]>([]);
  portada = signal<string | undefined>(undefined);
  errorImagen = signal('');
  errorGeneral = signal('');
  noEncontrado = signal(false);
  cargando = signal(true);
  guardando = signal(false);

  form = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    autor: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    categoria: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
    existencias: [1, [Validators.required, Validators.min(0), Validators.max(999), Validators.pattern(/^\d+$/)]],
  });

  get f() {
    return this.form.controls;
  }

  constructor() {
    this.cargar();
  }

  private async cargar() {
    const libros = await this.db.obtenerLibros();
    this.categorias.set([...new Set(libros.map((l) => l.categoria))].sort());

    const texto = this.route.snapshot.paramMap.get('id');
    if (texto !== null) {
      const id = Number(texto);
      const libro = libros.find((l) => l.id === id);
      if (!libro) {
        this.noEncontrado.set(true);
      } else {
        this.idEdicion = id;
        this.form.patchValue({
          titulo: libro.titulo,
          autor: libro.autor,
          categoria: libro.categoria,
          existencias: libro.existencias,
        });
        this.portada.set(libro.portada);
      }
    }
    this.cargando.set(false);
  }

  async onArchivo(event: Event) {
    this.errorImagen.set('');
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      this.errorImagen.set('El archivo debe ser una imagen (JPG, PNG, WEBP).');
      return;
    }
    try {
      this.portada.set(await this.reducir(archivo));
    } catch (e) {
      this.errorImagen.set((e as Error).message);
    }
  }

  quitarPortada() {
    this.portada.set(undefined);
  }

  // Reduce la imagen a máximo 400 px para que ocupe poco en IndexedDB
  private reducir(archivo: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(archivo);
      img.onload = () => {
        const escala = Math.min(1, 400 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('No se pudo leer la imagen.'));
      };
      img.src = url;
    });
  }

  async guardar() {
    this.errorGeneral.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const datos = {
      titulo: v.titulo!.trim(),
      autor: v.autor!.trim(),
      categoria: v.categoria!.trim(),
      existencias: Number(v.existencias),
      portada: this.portada(),
    };

    this.guardando.set(true);
    try {
      if (this.idEdicion !== null) {
        await this.db.actualizarLibro({ id: this.idEdicion, ...datos });
      } else {
        await this.db.agregarLibro(datos);
      }
      this.router.navigate(['/catalogo']);
    } catch (e) {
      this.errorGeneral.set((e as Error).message);
    } finally {
      this.guardando.set(false);
    }
  }
}