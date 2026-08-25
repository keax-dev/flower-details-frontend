import { TestBed } from '@angular/core/testing';
import { Category } from '@features/category/models/category.model';
import { CategoryPage } from '@features/category/presentation/category-page/category-page';

const CATEGORY: Category = {
  id: 1,
  title: 'Cumpleaños',
  description: 'Arreglos para celebrar',
  active: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('CategoryPage', () => {
  it('opens the form for a new category', async () => {
    await TestBed.configureTestingModule({ imports: [CategoryPage] }).compileComponents();
    const component = TestBed.createComponent(CategoryPage).componentInstance;

    component['openCreateForm']();

    expect(component['editingCategory']()).toBeNull();
    expect(component['isFormVisible']()).toBe(true);
  });

  it('opens the selected category and refreshes the list after save', async () => {
    await TestBed.configureTestingModule({ imports: [CategoryPage] }).compileComponents();
    const component = TestBed.createComponent(CategoryPage).componentInstance;

    component['openEditForm'](CATEGORY);
    component['refreshList']();

    expect(component['editingCategory']()).toBeNull();
    expect(component['isFormVisible']()).toBe(false);
    expect(component['listRefreshVersion']()).toBe(1);
  });
});
