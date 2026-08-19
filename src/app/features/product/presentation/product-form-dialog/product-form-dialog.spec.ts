import { TestBed } from '@angular/core/testing';

import { ProductFormDialog } from './product-form-dialog';

describe('ProductFormDialog', () => {
  it('resets the form and selected files each time a create dialog is opened', async () => {
    await TestBed.configureTestingModule({ imports: [ProductFormDialog] }).compileComponents();

    const fixture = TestBed.createComponent(ProductFormDialog);
    fixture.componentRef.setInput('categories', []);
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const form = component['productForm'];
    form.controls.title.setValue('Ramo de rosas');
    component['selectedFiles'].set([new File(['image'], 'ramo.png', { type: 'image/png' })]);

    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    expect(form.getRawValue()).toEqual({
      categoryId: 0,
      title: '',
      description: '',
      price: 0,
      active: true,
    });
    expect(component['selectedFiles']()).toEqual([]);
  });
});
