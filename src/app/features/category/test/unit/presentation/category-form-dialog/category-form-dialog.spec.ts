import { TestBed } from '@angular/core/testing';
import { Category } from '@features/category/models/category.model';
import { CategoryFormDialog } from '@features/category/presentation/category-form-dialog/category-form-dialog';
import { CategoryApiService } from '@features/category/services/category-api.service';
import { NotificationService } from '@core/notification/notification.service';
import { of } from 'rxjs';

const CATEGORY: Category = {
  id: 1,
  title: 'Cumpleaños',
  description: 'Arreglos para celebrar',
  active: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

async function createComponent() {
  const categoryApiService = {
    create: vi.fn(() => of(CATEGORY)),
    update: vi.fn(() => of(CATEGORY)),
  };
  const notificationService = { success: vi.fn(), error: vi.fn(), errorApi: vi.fn() };

  await TestBed.configureTestingModule({
    imports: [CategoryFormDialog],
    providers: [
      { provide: CategoryApiService, useValue: categoryApiService },
      { provide: NotificationService, useValue: notificationService },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(CategoryFormDialog);
  return { fixture, categoryApiService, notificationService };
}

describe('CategoryFormDialog', () => {
  it('resets the form each time a create dialog is opened', async () => {
    const { fixture } = await createComponent();
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

  it('does not submit an invalid form', async () => {
    const { fixture, categoryApiService } = await createComponent();

    fixture.componentInstance['submit']();

    expect(categoryApiService.create).not.toHaveBeenCalled();
    expect(fixture.componentInstance['categoryForm'].touched).toBe(true);
  });

  it('creates a category and emits the saved event', async () => {
    const { fixture, categoryApiService, notificationService } = await createComponent();
    const saved = vi.fn();
    fixture.componentInstance.saved.subscribe(saved);
    fixture.componentInstance['categoryForm'].setValue({
      title: 'Cumpleaños',
      description: 'Arreglos para celebrar',
      active: true,
    });

    fixture.componentInstance['submit']();

    expect(categoryApiService.create).toHaveBeenCalledWith({
      title: 'Cumpleaños',
      description: 'Arreglos para celebrar',
      active: true,
    });
    expect(notificationService.success).toHaveBeenCalledWith('Categoría creada correctamente.');
    expect(saved).toHaveBeenCalledOnce();
  });

  it('updates the selected category instead of creating a new one', async () => {
    const { fixture, categoryApiService } = await createComponent();
    fixture.componentRef.setInput('category', CATEGORY);
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    fixture.componentInstance['categoryForm'].controls.title.setValue('Cumpleaños especiales');

    fixture.componentInstance['submit']();

    expect(categoryApiService.update).toHaveBeenCalledWith(CATEGORY.id, {
      title: 'Cumpleaños especiales',
      description: CATEGORY.description,
      active: CATEGORY.active,
    });
  });
});
