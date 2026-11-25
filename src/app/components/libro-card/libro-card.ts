import { Component, input, output } from '@angular/core';
import { NgClass, TitleCasePipe } from '@angular/common';
import { Libro } from '../../models/libro';

@Component({
  selector: 'app-libro-card',
  imports: [NgClass, TitleCasePipe],
  templateUrl: './libro-card.html',
  styleUrl: './libro-card.css',
})
export class LibroCard {
  // Padre -> hijo: el catálogo le pasa el libro
  libro = input.required<Libro>();

  // Hijo -> padre: avisa que el usuario quiere prestar este libro
  prestar = output<Libro>();

  claseStock(): string {
    const n = this.libro().existencias;
    if (n === 0) return 'text-bg-danger';
    if (n <= 2) return 'text-bg-warning';
    return 'text-bg-success';
  }
}