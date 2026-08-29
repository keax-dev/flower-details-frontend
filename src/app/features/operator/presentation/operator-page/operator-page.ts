import { Component, signal } from '@angular/core';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { Operator } from '@features/operator/models/operator.model';
import { OperatorFormDialog } from '@features/operator/presentation/operator-form-dialog/operator-form-dialog';
import { OperatorList } from '@features/operator/presentation/operator-list/operator-list';

@Component({
  selector: 'app-operator-page',
  imports: [FontAwesomeModule, OperatorFormDialog, OperatorList],
  templateUrl: './operator-page.html',
  styleUrl: './operator-page.css',
})
export class OperatorPage {
  protected readonly faPlus = faPlus;
  protected readonly listRefreshVersion = signal(0);
  protected readonly editingOperator = signal<Operator | null>(null);
  protected readonly isFormVisible = signal(false);

  protected openCreateForm(): void {
    this.editingOperator.set(null);
    this.isFormVisible.set(true);
  }

  protected openEditForm(operator: Operator): void {
    this.editingOperator.set(operator);
    this.isFormVisible.set(true);
  }

  protected closeForm(): void {
    this.editingOperator.set(null);
    this.isFormVisible.set(false);
  }

  protected refreshList(): void {
    this.closeForm();
    this.listRefreshVersion.update((version) => version + 1);
  }
}
