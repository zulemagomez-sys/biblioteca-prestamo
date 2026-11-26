import { Routes } from '@angular/router';
import { Catalogo } from './pages/catalogo/catalogo';
import { NuevoPrestamo } from './pages/nuevo-prestamo/nuevo-prestamo';
import { Historial } from './pages/historial/historial';
import { DetallePrestamo } from './pages/detalle-prestamo/detalle-prestamo';
import { FormLibro } from './pages/form-libro/form-libro';

export const routes: Routes = [
  { path: '', redirectTo: 'catalogo', pathMatch: 'full' },
  { path: 'catalogo', component: Catalogo },
  { path: 'libros/nuevo', component: FormLibro },
  { path: 'libros/:id/editar', component: FormLibro },
  { path: 'prestamos/nuevo', component: NuevoPrestamo },
  { path: 'prestamos', component: Historial },
  { path: 'prestamos/:id', component: DetallePrestamo },
  { path: '**', redirectTo: 'catalogo' },
];