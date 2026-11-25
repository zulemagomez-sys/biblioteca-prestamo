import { Injectable } from '@angular/core';
import { Libro } from '../models/libro';
import { Prestamo } from '../models/prestamo';

const DB_NAME = 'biblioteca-db';
const DB_VERSION = 1;

const LIBROS_INICIALES: Libro[] = [
  { id: 1, titulo: 'Cien años de soledad', autor: 'Gabriel García Márquez', categoria: 'Novela', existencias: 4 },
  { id: 2, titulo: 'El principito', autor: 'Antoine de Saint-Exupéry', categoria: 'Infantil', existencias: 5 },
  { id: 3, titulo: 'Don Quijote de la Mancha', autor: 'Miguel de Cervantes', categoria: 'Clásico', existencias: 2 },
  { id: 4, titulo: 'Breve historia del tiempo', autor: 'Stephen Hawking', categoria: 'Ciencia', existencias: 3 },
  { id: 5, titulo: 'Cosmos', autor: 'Carl Sagan', categoria: 'Ciencia', existencias: 3 },
  { id: 6, titulo: 'Sapiens', autor: 'Yuval Noah Harari', categoria: 'Historia', existencias: 2 },
  { id: 7, titulo: 'Clean Code', autor: 'Robert C. Martin', categoria: 'Tecnología', existencias: 3 },
  { id: 8, titulo: 'Rayuela', autor: 'Julio Cortázar', categoria: 'Novela', existencias: 1 },
  { id: 9, titulo: 'Metro 2033', autor: 'Dmitri Glujovski', categoria: 'Novela', existencias: 2 },
  { id: 10, titulo: 'Padre Rico, Padre Pobre', autor: 'Robert Kiyosaki', categoria: 'Finanzas', existencias: 4 },
];

@Injectable({ providedIn: 'root' })
export class BibliotecaDb {
  private dbPromise: Promise<IDBDatabase> | null = null;

  // Abre la base de datos. Los datos iniciales se cargan en onupgradeneeded,
  // que solo se ejecuta cuando la base se crea por primera vez.
  private abrir(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = () => {
          const db = req.result;
          const libros = db.createObjectStore('libros', { keyPath: 'id' });
          db.createObjectStore('prestamos', { keyPath: 'id', autoIncrement: true });
          LIBROS_INICIALES.forEach((l) => libros.add(l));
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return this.dbPromise;
  }

  private pedir<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private terminar(tx: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error('Operación cancelada.'));
    });
  }

  // ---------- Lectura ----------

  async obtenerLibros(): Promise<Libro[]> {
    const db = await this.abrir();
    return this.pedir<Libro[]>(db.transaction('libros').objectStore('libros').getAll());
  }

  async obtenerLibro(id: number): Promise<Libro | undefined> {
    const db = await this.abrir();
    return this.pedir<Libro | undefined>(db.transaction('libros').objectStore('libros').get(id));
  }

  async obtenerPrestamos(): Promise<Prestamo[]> {
    const db = await this.abrir();
    return this.pedir<Prestamo[]>(db.transaction('prestamos').objectStore('prestamos').getAll());
  }

  async obtenerPrestamo(id: number): Promise<Prestamo | undefined> {
    const db = await this.abrir();
    return this.pedir<Prestamo | undefined>(
      db.transaction('prestamos').objectStore('prestamos').get(id),
    );
  }

  // ---------- Escritura ----------

  // Registra el préstamo y descuenta las existencias en una sola transacción.
  async registrarPrestamo(datos: {
    libroId: number;
    solicitante: string;
    cantidad: number;
    fechaLimite: string;
  }): Promise<number> {
    const db = await this.abrir();
    const tx = db.transaction(['libros', 'prestamos'], 'readwrite');
    const libros = tx.objectStore('libros');

    const libro = await this.pedir<Libro | undefined>(libros.get(datos.libroId));
    if (!libro) {
      tx.abort();
      throw new Error('El libro seleccionado no existe.');
    }
    if (datos.cantidad > libro.existencias) {
      tx.abort();
      throw new Error(`Solo hay ${libro.existencias} unidad(es) disponible(s).`);
    }

    libro.existencias -= datos.cantidad;
    libros.put(libro);

    const prestamo: Prestamo = {
      libroId: libro.id,
      libroTitulo: libro.titulo,
      solicitante: datos.solicitante,
      cantidad: datos.cantidad,
      fechaPrestamo: new Date().toISOString(),
      fechaLimite: datos.fechaLimite,
      estado: 'Activo',
    };
    const id = await this.pedir(tx.objectStore('prestamos').add(prestamo));

    await this.terminar(tx);
    return id as number;
  }

  // Marca el préstamo como devuelto y recupera las unidades. Solo se puede una vez.
  async devolverPrestamo(id: number): Promise<void> {
    const db = await this.abrir();
    const tx = db.transaction(['libros', 'prestamos'], 'readwrite');
    const prestamos = tx.objectStore('prestamos');

    const prestamo = await this.pedir<Prestamo | undefined>(prestamos.get(id));
    if (!prestamo) {
      tx.abort();
      throw new Error('El préstamo no existe.');
    }
    if (prestamo.estado === 'Devuelto') {
      tx.abort();
      throw new Error('Este préstamo ya fue devuelto.');
    }

    const libros = tx.objectStore('libros');
    const libro = await this.pedir<Libro | undefined>(libros.get(prestamo.libroId));
    if (libro) {
      libro.existencias += prestamo.cantidad;
      libros.put(libro);
    }

    prestamo.estado = 'Devuelto';
    prestamo.fechaDevolucion = new Date().toISOString();
    prestamos.put(prestamo);

    await this.terminar(tx);
  }
}