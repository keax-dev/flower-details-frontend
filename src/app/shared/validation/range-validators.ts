import { AbstractControl, ValidationErrors } from '@angular/forms';

export function validatePriceRange(control: AbstractControl): ValidationErrors | null {
  const minPrice: unknown = control.get('minPrice')?.value;
  const maxPrice: unknown = control.get('maxPrice')?.value;
  return typeof minPrice === 'number' && typeof maxPrice === 'number' && minPrice > maxPrice ? { priceRange: true } : null;
}

export function validateDateRange(control: AbstractControl): ValidationErrors | null {
  const createdFrom: unknown = control.get('createdFrom')?.value;
  const createdTo: unknown = control.get('createdTo')?.value;
  return typeof createdFrom === 'string' && typeof createdTo === 'string' && createdFrom !== '' && createdTo !== '' && createdFrom > createdTo
    ? { dateRange: true }
    : null;
}
