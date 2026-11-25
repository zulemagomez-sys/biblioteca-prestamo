
import { Component, input, output, signal } from '@angular/core';
import { NgClass, TitleCasePipe } from '@angular/common';
import { Libro } from '../../models/libro';

@Component({
  selector: 'app-libro-card',
  imports: [NgClass, TitleCasePipe],
  templateUrl: './libro-card.html',
  styleUrl: './libro-card.css',
})
export class LibroCard {
  libro = input.required<Libro>();
  prestar = output<Libro>();

  // Se activa si la imagen no existe o falla al cargar
  imagenFallida = signal(false);

  claseStock(): string {
    const n = this.libro().existencias;
    if (n === 0) return 'text-bg-danger';
    if (n <= 2) return 'text-bg-warning';
    return 'text-bg-success';
  }
}