import { FormControl, FormGroup } from '@angular/forms';

import { validateDateRange, validatePriceRange } from '@shared/validation/range-validators';

describe('range validators', () => {
  it('rejects a minimum price greater than the maximum', () => {
    const form = new FormGroup({ minPrice: new FormControl<number | null>(20), maxPrice: new FormControl<number | null>(10) });

    expect(validatePriceRange(form)).toEqual({ priceRange: true });
    form.controls.maxPrice.setValue(20);
    expect(validatePriceRange(form)).toBeNull();
    form.controls.maxPrice.setValue(null);
    expect(validatePriceRange(form)).toBeNull();
  });

  it('rejects a start date after the end date', () => {
    const form = new FormGroup({ createdFrom: new FormControl('2026-10-25'), createdTo: new FormControl('2026-10-24') });

    expect(validateDateRange(form)).toEqual({ dateRange: true });
    form.controls.createdTo.setValue('2026-10-25');
    expect(validateDateRange(form)).toBeNull();
    form.controls.createdTo.setValue('');
    expect(validateDateRange(form)).toBeNull();
  });
});
