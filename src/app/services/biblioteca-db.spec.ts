import { TestBed } from '@angular/core/testing';
import { BibliotecaDb } from './biblioteca-db';

describe('BibliotecaDb', () => {
  let service: BibliotecaDb;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BibliotecaDb);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
