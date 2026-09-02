import { TestBed } from '@angular/core/testing';
import { Operator } from '@features/operator/models/operator.model';
import { OperatorPage } from '@features/operator/presentation/operator-page/operator-page';

const OPERATOR: Operator = {
  id: 4,
  personId: 12,
  names: 'Maria',
  lastNames: 'Lopez',
  email: 'maria@example.com',
  phone: '0999999999',
  role: 'OPERATOR',
  active: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('OperatorPage', () => {
  it('opens the form for a new administrative user', async () => {
    await TestBed.configureTestingModule({ imports: [OperatorPage] }).compileComponents();
    const component = TestBed.createComponent(OperatorPage).componentInstance;

    component['openCreateForm']();

    expect(component['editingOperator']()).toBeNull();
    expect(component['isFormVisible']()).toBe(true);
  });

  it('opens the selected user and refreshes the list after save', async () => {
    await TestBed.configureTestingModule({ imports: [OperatorPage] }).compileComponents();
    const component = TestBed.createComponent(OperatorPage).componentInstance;

    component['openEditForm'](OPERATOR);
    component['refreshList']();

    expect(component['editingOperator']()).toBeNull();
    expect(component['isFormVisible']()).toBe(false);
    expect(component['listRefreshVersion']()).toBe(1);
  });
});
