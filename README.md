# Biblioteca - Sistema de Préstamo de Libros

Aplicación web desarrollada con Angular que permite consultar un catálogo de libros,
registrar préstamos, revisar su historial y procesar devoluciones.
Los datos se guardan en el navegador con IndexedDB.

**Estudiante:** ZULEMA GOMEZ FLORES

## Funcionalidades

- **Catálogo** (`/catalogo`): tarjetas de libros con búsqueda por título o autor y filtro por categoría.
- **Nuevo préstamo** (`/prestamos/nuevo`): formulario reactivo con validaciones.
- **Historial** (`/prestamos`): lista de préstamos con fecha y estado, filtrable por estado.
- **Detalle** (`/prestamos/:id`): datos del préstamo y devolución del libro.

## Reglas del negocio

- No se puede prestar una cantidad mayor a las existencias disponibles.
- Al registrar un préstamo se descuentan las unidades del libro.
- Al devolver, se recuperan las unidades prestadas.
- Una devolución solo puede registrarse una vez.
- La fecha límite debe estar entre hoy y 30 días.

## Requisitos

- Node.js 20 o superior
- npm
- Angular CLI: `npm install -g @angular/cli`

## Instalación y ejecución

```bash
git clone https://github.com/zulemagomez-sys/biblioteca-prestamo.git
cd biblioteca-prestamo
npm install
ng serve
```

Abrir en el navegador: http://localhost:4200

## Estructura del proyecto

```
src/app/
├── components/libro-card/   Componente hijo reutilizable (tarjeta de libro)
├── models/                  Interfaces Libro y Prestamo
├── pages/                   Pantallas: catalogo, nuevo-prestamo, historial, detalle-prestamo
├── services/biblioteca-db   Servicio de acceso a IndexedDB
├── app.routes.ts            Configuración de rutas
└── app.html                 Menú de navegación
```

## Tecnologías

Angular, TypeScript, Bootstrap 5.3, IndexedDB