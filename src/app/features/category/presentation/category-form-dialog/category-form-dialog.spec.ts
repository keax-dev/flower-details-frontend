import { TestBed } from '@angular/core/testing';

import { CategoryFormDialog } from './category-form-dialog';

describe('CategoryFormDialog', () => {
  it('resets the form each time a create dialog is opened', async () => {
    await TestBed.configureTestingModule({ imports: [CategoryFormDialog] }).compileComponents();

    const fixture = TestBed.createComponent(CategoryFormDialog);
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const form = fixture.componentInstance['categoryForm'];
    form.controls.title.setValue('Cumpleaños');
    form.controls.description.setValue('Arreglos para celebrar');

    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    expect(form.getRawValue()).toEqual({ title: '', description: '', active: true });
  });
});
