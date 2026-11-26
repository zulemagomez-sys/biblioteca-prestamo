
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

  editar = output<Libro>();
  eliminar = output<Libro>();

  imagenFallida = signal(false);

 claseStock(): string {
  return 'text-bg-dark';
}
   
}