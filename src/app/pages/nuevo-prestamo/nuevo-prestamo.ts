import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BibliotecaDb } from '../../services/biblioteca-db';
import { Libro } from '../../models/libro';

// Fecha local en formato YYYY-MM-DD (comparable como texto)
function aISO(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function sumarDias(dias: number): string {
  const f = new Date();
  f.setDate(f.getDate() + dias);
  return aISO(f);
}

// La fecha límite debe estar entre hoy y 30 días
function validarFecha(control: AbstractControl): ValidationErrors | null {
  const valor = control.value as string;
  if (!valor) return null;
  if (valor < aISO(new Date())) return { fechaPasada: true };
  if (valor > sumarDias(30)) return { fechaLejana: true };
  return null;
}

@Component({
  selector: 'app-nuevo-prestamo',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './nuevo-prestamo.html',
  styleUrl: './nuevo-prestamo.css',
})
export class NuevoPrestamo {
  private db = inject(BibliotecaDb);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  libros = signal<Libro[]>([]);
  errorGeneral = signal('');
  guardando = signal(false);

  hoy = aISO(new Date());
  maxFecha = sumarDias(30);

  // Regla del tema: no se puede prestar más de las existencias
  private validarStock: ValidatorFn = (grupo) => {
    const libroId = grupo.get('libroId')?.value as number | null;
    const cantidad = Number(grupo.get('cantidad')?.value);
    const libro = this.libros().find((l) => l.id === libroId);
    if (!libro || !cantidad) return null;
    return cantidad > libro.existencias
      ? { stockInsuficiente: { disponible: libro.existencias } }
      : null;
  };

  form = this.fb.group(
    {
      libroId: [null as number | null, [Validators.required]],
      solicitante: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$/),
        ],
      ],
      cantidad: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      fechaLimite: ['', [Validators.required, validarFecha]],
    },
    { validators: this.validarStock },
  );

  // Acceso corto a los controles desde la plantilla
  get f() {
    return this.form.controls;
  }

  constructor() {
    this.cargar();
  }

  private async cargar() {
    this.libros.set(await this.db.obtenerLibros());

    // Si venimos desde el catálogo, preseleccionamos el libro
    const id = Number(this.route.snapshot.queryParamMap.get('libroId'));
    if (this.libros().some((l) => l.id === id)) {
      this.form.patchValue({ libroId: id });
    }
    // Recalcula la validación ahora que ya conocemos las existencias
    this.form.updateValueAndValidity();
  }

  libroSeleccionado(): Libro | undefined {
    return this.libros().find((l) => l.id === this.form.value.libroId);
  }

  async guardar() {
    this.errorGeneral.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    this.guardando.set(true);
    try {
      const id = await this.db.registrarPrestamo({
        libroId: v.libroId!,
        solicitante: v.solicitante!.trim(),
        cantidad: Number(v.cantidad),
        fechaLimite: v.fechaLimite!,
      });
      this.router.navigate(['/prestamos', id]);
    } catch (e) {
      this.errorGeneral.set((e as Error).message);
    } finally {
      this.guardando.set(false);
    }
  }
}