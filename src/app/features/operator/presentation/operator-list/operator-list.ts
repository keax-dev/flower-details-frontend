import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faPen,
  faPowerOff,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { finalize } from 'rxjs';

import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { NotificationService } from '@core/notification/notification.service';
import { Operator } from '@features/operator/models/operator.model';
import { OperatorApiService } from '@features/operator/services/operator-api.service';
import { PageResponse } from '@shared/domain/pagination/page-response.model';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-operator-list',
  imports: [FontAwesomeModule, NzPopconfirmModule],
  templateUrl: './operator-list.html',
  styleUrl: './operator-list.css',
})
export class OperatorList {
  private readonly operatorApiService = inject(OperatorApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly refreshVersion = input(0);
  readonly edit = output<Operator>();

  protected readonly operators = signal<Operator[]>([]);
  protected readonly pageResponse = signal<PageResponse<Operator> | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly pendingActionId = signal<number | null>(null);
  protected readonly faArrowLeft = faArrowLeft;
  protected readonly faArrowRight = faArrowRight;
  protected readonly faPen = faPen;
  protected readonly faPowerOff = faPowerOff;
  protected readonly faTrash = faTrash;
  protected readonly currentPage = computed(() => this.pageResponse()?.page ?? 0);
  protected readonly hasPreviousPage = computed(() => this.currentPage() > 0);
  protected readonly hasNextPage = computed(() => {
    const page = this.pageResponse();
    return page !== null && page.page + 1 < page.totalPages;
  });

  constructor() {
    effect(() => {
      this.refreshVersion();
      this.loadOperators();
    });
  }

  protected updateStatus(operator: Operator): void {
    this.pendingActionId.set(operator.id);
    const request$ = operator.active
      ? this.operatorApiService.deactivate(operator.id)
      : this.operatorApiService.activate(operator.id);
    request$
      .pipe(
        finalize(() => this.pendingActionId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.notificationService.success(
            operator.active
              ? 'Operador desactivado correctamente.'
              : 'Operador activado correctamente.',
          );
          this.loadOperators(this.currentPage());
        },
        error: (error: unknown) =>
          this.notificationService.error(
            resolveApiErrorMessage(error, 'No fue posible actualizar el estado del operador.'),
          ),
      });
  }

  protected deleteOperator(operator: Operator): void {
    this.pendingActionId.set(operator.id);
    this.operatorApiService
      .delete(operator.id)
      .pipe(
        finalize(() => this.pendingActionId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.notificationService.success('Operador eliminado correctamente.');
          this.loadOperators(
            this.operators().length === 1
              ? Math.max(0, this.currentPage() - 1)
              : this.currentPage(),
          );
        },
        error: (error: unknown) =>
          this.notificationService.error(
            resolveApiErrorMessage(error, 'No fue posible eliminar el operador.'),
          ),
      });
  }

  protected previousPage(): void {
    if (this.hasPreviousPage()) {
      this.loadOperators(this.currentPage() - 1);
    }
  }

  protected nextPage(): void {
    if (this.hasNextPage()) {
      this.loadOperators(this.currentPage() + 1);
    }
  }

  private loadOperators(page = 0): void {
    this.isLoading.set(true);
    this.operatorApiService
      .list(page, PAGE_SIZE)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.operators.set(response.items);
          this.pageResponse.set(response);
        },
        error: (error: unknown) =>
          this.notificationService.error(
            resolveApiErrorMessage(error, 'No fue posible cargar los operadores.'),
          ),
      });
  }
}
